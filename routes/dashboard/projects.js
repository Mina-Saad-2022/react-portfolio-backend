// ============================================================
// 📁 react-portfolio-backend/routes/dashboard/projects.js
// ============================================================
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import db from "../../config/db.js";

const router = express.Router();

// ⚙️ إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🛠️ تنظيف اسم المشروع لاستخدامه كاسم ملف
const sanitizeFilename = (name) => {
  if (!name) return "project";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50);
};

// ⚙️ إعداد Multer Storage مع الحفظ باسم المشروع
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const rawTitle = req.body?.title || "project";
    const cleanTitle = sanitizeFilename(rawTitle);
    const uniqueSuffix = Date.now();

    return {
      folder: "portfolio_uploads/projects",
      public_id: `${cleanTitle}_${uniqueSuffix}`,
      allowed_formats: ["jpg", "png", "jpeg", "webp", "svg"],
      resource_type: "auto",
    };
  },
});

const upload = multer({ storage: storage });

// Middleware للتعامل مع المجموعات (سواء FormData أو JSON عادي)
const handleUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("image")(req, res, next);
  }
  next();
};

// 🛠️ استخراج public_id لحذف الصورة من Cloudinary
const extractPublicId = (url) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com"))
    return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let publicIdWithExt = parts[1].replace(/^v\d+\//, "");
    const lastDot = publicIdWithExt.lastIndexOf(".");
    return lastDot !== -1
      ? publicIdWithExt.substring(0, lastDot)
      : publicIdWithExt;
  } catch (err) {
    return null;
  }
};

// 🛠️ دالة مساعدة لحذف الملف القديم من Cloudinary
const deleteOldCloudinaryFile = async (fileUrl) => {
  const publicId = extractPublicId(fileUrl);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Deleted old image from Cloudinary: ${publicId}`);
    } catch (err) {
      console.error("❌ Failed to delete old image:", err);
    }
  }
};

// ✅ 1. جلب جميع المشاريع (GET /api/projects)
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    return res.json({
      success: true,
      data: results.map((p) => ({
        ...p,
        image_url: p.image || null,
        status: p.status || "active",
      })),
    });
  } catch (err) {
    console.error("❌ GET Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error_message: err.message,
    });
  }
});

// ✅ 2. إضافة مشروع جديد (POST /api/projects)
router.post("/", handleUpload, async (req, res) => {
  try {
    const { title, description, link, technologies, status } = req.body || {};
    let imageUrl = null;

    if (req.file) {
      imageUrl = req.file.path;
    }

    const techString = Array.isArray(technologies)
      ? technologies.join(",")
      : technologies || "";

    const insertData = {
      title: title || "",
      description: description || "",
      link: link || "",
      technologies: techString,
      image: imageUrl,
    };

    try {
      const [result] = await db.query("INSERT INTO projects SET ?", [
        { ...insertData, status: status || "active" },
      ]);
      return res.json({
        success: true,
        message: "✅ Project created successfully",
        data: {
          id: result.insertId,
          ...insertData,
          status: status || "active",
          image_url: imageUrl,
        },
      });
    } catch (dbErr) {
      const [result] = await db.query("INSERT INTO projects SET ?", [
        insertData,
      ]);
      return res.json({
        success: true,
        message: "✅ Project created successfully",
        data: {
          id: result.insertId,
          ...insertData,
          status: "active",
          image_url: imageUrl,
        },
      });
    }
  } catch (err) {
    console.error("❌ POST Project Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error_message: err.message,
      error_stack: err.stack,
    });
  }
});

// ✅ 3. تحديث مشروع (PUT /api/projects/:id)
router.put("/:id", handleUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { title, description, link, technologies, status } = body;

    const [existing] = await db.query("SELECT * FROM projects WHERE id = ?", [
      id,
    ]);
    if (!existing || existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const oldProject = existing[0];
    let newImageUrl = oldProject.image;

    if (req.file) {
      if (oldProject.image) {
        await deleteOldCloudinaryFile(oldProject.image);
      }
      newImageUrl = req.file.path;
    }

    const techValue =
      technologies !== undefined
        ? Array.isArray(technologies)
          ? technologies.join(",")
          : technologies
        : oldProject.technologies;

    const updatedTitle = title !== undefined ? title : oldProject.title;
    const updatedDesc =
      description !== undefined ? description : oldProject.description;
    const updatedLink = link !== undefined ? link : oldProject.link;
    const updatedStatus =
      status !== undefined ? status : oldProject.status || "active";

    try {
      const sql = `
        UPDATE projects 
        SET title = ?, description = ?, link = ?, technologies = ?, status = ?, image = ?
        WHERE id = ?
      `;
      await db.query(sql, [
        updatedTitle,
        updatedDesc,
        updatedLink,
        techValue,
        updatedStatus,
        newImageUrl,
        id,
      ]);
    } catch (dbErr) {
      const fallbackSql = `
        UPDATE projects 
        SET title = ?, description = ?, link = ?, technologies = ?, image = ?
        WHERE id = ?
      `;
      await db.query(fallbackSql, [
        updatedTitle,
        updatedDesc,
        updatedLink,
        techValue,
        newImageUrl,
        id,
      ]);
    }

    return res.json({
      success: true,
      message: "✅ Project updated successfully",
      image_url: newImageUrl,
      status: updatedStatus,
    });
  } catch (err) {
    console.error("❌ PUT Project Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating project",
      error_message: err.message,
      error_stack: err.stack,
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

    if (existing.length > 0 && existing[0].image) {
      await deleteOldCloudinaryFile(existing[0].image);
    }

    await db.query("DELETE FROM projects WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "✅ Project deleted successfully",
    });
  } catch (err) {
    console.error("❌ DELETE Project Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error_message: err.message,
    });
  }
});

export default router;
