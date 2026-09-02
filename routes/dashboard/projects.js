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

// 🛠️ تنظيف اسم المشروع
const sanitizeFilename = (name) => {
  if (!name) return "project";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50);
};

// ⚙️ Multer Storage
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

const handleUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("image")(req, res, next);
  }
  next();
};

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

const deleteOldCloudinaryFile = async (fileUrl) => {
  const publicId = extractPublicId(fileUrl);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("❌ Failed to delete old image:", err);
    }
  }
};

// ✅ 1. جلب جميع المشاريع مع فحص رابط الصورة
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
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 2. تحديث الحالة فقط (دعم PUT و PATCH لتفادي مشاكل CORS)
const handleStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status required" });
    }

    await db.query("UPDATE projects SET status = ? WHERE id = ?", [status, id]);

    return res.json({
      success: true,
      message: "✅ Status updated successfully",
      status: status,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.patch("/:id/status", handleStatusUpdate);
router.put("/:id/status", handleStatusUpdate);

// ✅ 3. إضافة مشروع
router.post("/", handleUpload, async (req, res) => {
  try {
    const { title, description, link, technologies, status } = req.body || {};
    let imageUrl = req.file ? req.file.path : null;

    const techString = Array.isArray(technologies)
      ? technologies.join(",")
      : technologies || "";

    const insertData = {
      title: title || "",
      description: description || "",
      link: link || "",
      technologies: techString,
      image: imageUrl,
      status: status || "active",
    };

    const [result] = await db.query("INSERT INTO projects SET ?", [insertData]);
    return res.json({
      success: true,
      data: { id: result.insertId, ...insertData, image_url: imageUrl },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 4. تحديث مشروع
router.put("/:id", handleUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const [existing] = await db.query("SELECT * FROM projects WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const oldProject = existing[0];
    let newImageUrl = oldProject.image;

    if (req.file) {
      if (oldProject.image) await deleteOldCloudinaryFile(oldProject.image);
      newImageUrl = req.file.path;
    }

    const updatedTitle = body.title ?? oldProject.title;
    const updatedDesc = body.description ?? oldProject.description;
    const updatedLink = body.link ?? oldProject.link;
    const updatedTech = body.technologies ?? oldProject.technologies;
    const updatedStatus = body.status ?? oldProject.status;

    await db.query(
      "UPDATE projects SET title=?, description=?, link=?, technologies=?, status=?, image=? WHERE id=?",
      [updatedTitle, updatedDesc, updatedLink, updatedTech, updatedStatus, newImageUrl, id]
    );

    return res.json({ success: true, image_url: newImageUrl, status: updatedStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 5. حذف مشروع
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query("SELECT image FROM projects WHERE id = ?", [id]);
    if (existing.length && existing[0].image) {
      await deleteOldCloudinaryFile(existing[0].image);
    }
    await db.query("DELETE FROM projects WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;