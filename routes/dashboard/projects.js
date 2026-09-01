// ============================================================
// 📁 routes/dashboard/projects.js
// ============================================================
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import db from "../../config/db.js";

const router = express.Router();

// ⚙️ إعداد Multer في الذاكرة
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ⚙️ إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🛠️ استخراج public_id بأمان آمن لمنع السيرفر من الانهيار
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com"))
    return null;
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let relevantParts = parts.slice(uploadIndex + 1);
    if (relevantParts[0] && /^v\d+$/.test(relevantParts[0])) {
      relevantParts.shift();
    }

    const fullPath = relevantParts.join("/");
    return fullPath.substring(0, fullPath.lastIndexOf("."));
  } catch (err) {
    console.error("⚠️ Error parsing public_id:", err);
    return null;
  }
};

// 🛠️ رفع الملف لـ Cloudinary مع Promise ومعالجة أخطاء الـ Buffer
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
      title: title || "",
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

    // لو تم إرفاق صورة جديدة
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        updateData.image = uploadResult.secure_url;

        // محاولة حذف الصورة القديمة بأمان بدون إيقاف الطلب لو فشلت
        if (oldProject.image) {
          const publicId = getPublicIdFromUrl(oldProject.image);
          if (publicId) {
            cloudinary.uploader.destroy(publicId).catch((err) => {
              console.error(
                "⚠️ Failed to delete old image from Cloudinary:",
                err,
              );
            });
          }
        }
      } catch (uploadErr) {
        console.error("❌ Cloudinary Upload Error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new image to Cloudinary",
          error: uploadErr.message,
        });
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
        cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error("⚠️ Could not delete Cloudinary image:", err);
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
