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

// 🛠️ استخراج public_id بدقة عالية جداً لحذف الصور من Cloudinary
const extractPublicId = (url) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com"))
    return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // الجزء بعد كلمة upload/
    let publicIdWithExt = parts[1];

    // إزالة رقم الإصدار v12345678/ لو موجود
    if (publicIdWithExt.startsWith("v")) {
      publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, "");
    }

    // إزالة امتداد الملف (.png, .jpg, إلخ)
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch (err) {
    console.error("⚠️ Error extracting public_id:", err);
    return null;
  }
};

// 🛠️ دالة الحذف المباشرة والمضمونة من Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Cloudinary Delete Result for [${publicId}]:`, result);
      return result;
    } catch (err) {
      console.error(
        `❌ Failed to delete image [${publicId}] from Cloudinary:`,
        err,
      );
    }
  }
  return null;
};

// 🛠️ رفع الملف لـ Cloudinary باستخدام Promise
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "portfolio_uploads/projects",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    uploadStream.end(fileBuffer);
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

    // 1. التأكد من وجود المشروع وجلب بياناته القديمة
    const [existing] = await db.query("SELECT * FROM projects WHERE id = ?", [
      id,
    ]);
    if (!existing || existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const oldProject = existing[0];

    // تجهيز حقول التحديث الآمنة (عدم السماح بقيم undefined)
    let updateFields = {
      title:
        title !== undefined && title !== "undefined" ? title : oldProject.title,
      description:
        description !== undefined && description !== "undefined"
          ? description
          : oldProject.description,
      link: link !== undefined && link !== "undefined" ? link : oldProject.link,
      technologies:
        technologies !== undefined && technologies !== "undefined"
          ? technologies
          : oldProject.technologies,
      status:
        status !== undefined && status !== "undefined"
          ? status
          : oldProject.status,
    };

    // 2. إذا تم رفع صورة جديدة
    if (req.file) {
      // أ) رفع الصورة الجديدة لـ Cloudinary أولاً
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      updateFields.image = uploadResult.secure_url;

      // ب) مسح الصورة القديمة من Cloudinary إذا كانت موجودة
      if (oldProject.image) {
        await deleteFromCloudinary(oldProject.image);
      }
    }

    // 3. تحديث قاعدة البيانات
    const query = "UPDATE projects SET ? WHERE id = ?";
    await db.query(query, [updateFields, id]);

    return res.json({
      success: true,
      message: "✅ Project updated successfully",
      data: updateFields,
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
      await deleteFromCloudinary(existing[0].image);
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
