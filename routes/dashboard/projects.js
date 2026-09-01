// ============================================================
// 📁 backend/routes/dashboard/projects.js
// ============================================================
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import db from "../../config/db.js";

const router = express.Router();

// ⚙️ إعداد Multer في الذاكرة لتنسجم مع Vercel Serverless Functions
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ⚙️ إعداد Cloudinary (يقرأ تلقائياً من ملف الـ .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🛠️ دالة مساعدة لاستخراج public_id من رابط Cloudinary لحيذفه
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // تجاهل أرقام الـ Version مثل v1788301257 لو كانت موجودة
    const relevantParts = parts.slice(uploadIndex + 1);
    if (relevantParts[0] && relevantParts[0].startsWith("v")) {
      relevantParts.shift();
    }

    const filePath = relevantParts.join("/");
    return filePath.substring(0, filePath.lastIndexOf("."));
  } catch (err) {
    console.error("Error parsing public_id:", err);
    return null;
  }
};

// 🛠️ دالة رفـع الملف المباشر إلى Cloudinary عبر الـ Buffer
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "portfolio_uploads/projects",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(fileBuffer);
  });
};

// ✅ 1. جلب كافة المشاريع (GET /api/projects)
router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM projects ORDER BY id DESC";
    const [results] = await db.query(query);

    // إضافة image_url لتسهيل القراءة في الـ Frontend
    const formattedResults = results.map((project) => ({
      ...project,
      image_url: project.image || null,
    }));

    return res.json({
      success: true,
      data: formattedResults,
    });
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: err.message,
    });
  }
});

// ✅ 2. إنشاء مشروع جديد (POST /api/projects)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, link, technologies, status } = req.body;
    let imageUrl = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const insertData = {
      title,
      description: description || "",
      link: link || "",
      technologies: technologies || "",
      status: status || "active",
      image: imageUrl,
    };

    const query = "INSERT INTO projects SET ?";
    const [result] = await db.query(query, insertData);

    return res.json({
      success: true,
      message: "✅ Project created successfully",
      data: { id: result.insertId, ...insertData, image_url: imageUrl },
    });
  } catch (err) {
    console.error("❌ Error creating project:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: err.message,
    });
  }
});

// ✅ 3. تحديث مشروع (PUT /api/projects/:id)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status } = req.body;

    // جلب بيانات المشروع القديم لمعرفة رابط الصورة السابقة
    const [existing] = await db.query("SELECT * FROM projects WHERE id = ?", [
      id,
    ]);
    if (!existing || existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const oldProject = existing[0];
    let updateData = {
      title: title !== undefined ? title : oldProject.title,
      description:
        description !== undefined ? description : oldProject.description,
      link: link !== undefined ? link : oldProject.link,
      technologies:
        technologies !== undefined ? technologies : oldProject.technologies,
      status: status !== undefined ? status : oldProject.status,
    };

    // لو تم رفع صورة جديدة
    if (req.file) {
      // 1. رفع الصورة الجديدة إلى Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      updateData.image = uploadResult.secure_url;

      // 2. حذف الصورة القديمة من Cloudinary لمنع استهلاك المساحة
      if (oldProject.image) {
        const publicId = getPublicIdFromUrl(oldProject.image);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch((err) => {
            console.error("⚠️ Could not delete old Cloudinary image:", err);
          });
        }
      }
    }

    const query = "UPDATE projects SET ? WHERE id = ?";
    await db.query(query, [updateData, id]);

    return res.json({
      success: true,
      message: "✅ Project updated successfully",
    });
  } catch (err) {
    console.error("❌ Error updating project:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: err.message,
    });
  }
});

// ✅ 4. حذف مشروع (DELETE /api/projects/:id)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT image FROM projects WHERE id = ?",
      [id],
    );
    if (existing && existing.length > 0 && existing[0].image) {
      const publicId = getPublicIdFromUrl(existing[0].image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error(
            "⚠️ Could not delete Cloudinary image on project delete:",
            err,
          );
        });
      }
    }

    await db.query("DELETE FROM projects WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "✅ Project deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: err.message,
    });
  }
});

export default router;
