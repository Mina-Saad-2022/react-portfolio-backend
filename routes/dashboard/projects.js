import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import db from "../../db.js"; // تأكد من مسار ملف الربط بالداتابيز عندك

const router = express.Router();
const upload = multer({ dest: "/tmp" });

// دالة حماية لحذف الصورة القديمة من Cloudinary بدون إيقاف السيرفر
const deleteOldCloudinaryFile = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) return;
    const parts = imageUrl.split("/");
    const fileNameWithExt = parts.pop();
    const publicId = fileNameWithExt.split(".")[0];
    await cloudinary.uploader.destroy(`projects/${publicId}`);
  } catch (err) {
    console.error("Cloudinary deletion non-blocking error:", err.message);
  }
};

// GET: جلب جميع المشاريع
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST: إضافة مشروع جديد
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, link, technologies, status } = req.body;
    let imageUrl = null;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "projects",
      });
      imageUrl = uploadRes.secure_url;
    }

    const techValue = Array.isArray(technologies)
      ? technologies.join(",")
      : technologies || "";
    const statusValue = status || "active";

    // محاولة الإدخال مع حقل status، وفي حال عدم وجود العمود في الداتابيز يتم الإدخال بدونه تلقائياً
    try {
      const sql =
        "INSERT INTO projects (title, description, link, technologies, status, image) VALUES (?, ?, ?, ?, ?, ?)";
      await db.query(sql, [
        title,
        description,
        link,
        techValue,
        statusValue,
        imageUrl,
      ]);
    } catch (dbErr) {
      const fallbackSql =
        "INSERT INTO projects (title, description, link, technologies, image) VALUES (?, ?, ?, ?, ?)";
      await db.query(fallbackSql, [
        title,
        description,
        link,
        techValue,
        imageUrl,
      ]);
    }

    return res.json({ success: true, message: "Project created successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT: تحديث مشروع (الحل المباشر لمشكلة الـ 500)
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
    let newImageUrl = oldProject.image;

    if (req.file) {
      if (oldProject.image) {
        await deleteOldCloudinaryFile(oldProject.image);
      }
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "projects",
      });
      newImageUrl = uploadRes.secure_url;
    }

    let techValue = oldProject.technologies;
    if (technologies !== undefined && technologies !== null) {
      techValue = Array.isArray(technologies)
        ? technologies.join(",")
        : String(technologies);
    }

    const updatedTitle = title !== undefined ? title : oldProject.title;
    const updatedDesc =
      description !== undefined ? description : oldProject.description;
    const updatedLink = link !== undefined ? link : oldProject.link;
    const updatedStatus =
      status !== undefined ? status : oldProject.status || "active";

    // محاولة التحديث بوجود status، وفي حال غياب العمود في الداتابيز يندمج مع الاستعلام البديل فوراً
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
      message: "Project updated successfully",
      image_url: newImageUrl,
      status: updatedStatus,
    });
  } catch (err) {
    console.error("PUT Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating project",
      error_message: err.message,
    });
  }
});

// DELETE: حذف مشروع
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      "SELECT image FROM projects WHERE id = ?",
      [id],
    );

    if (existing && existing.length > 0 && existing[0].image) {
      await deleteOldCloudinaryFile(existing[0].image);
    }

    await db.query("DELETE FROM projects WHERE id = ?", [id]);
    return res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
