// ============================================================
// 📁 api/projects.js (أو routes/dashboard/projects.js)
// ============================================================
import express from "express";
import { v2 as cloudinary } from "cloudinary";
import db from "../../config/db.js"; // تأكد من ضبط المسار حسب مكان الملف

const router = express.Router();

// ⚙️ إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🛠️ استخراج public_id المضمون لحذف الصور من Cloudinary
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

// ✅ 1. جلب جميع المشاريع (GET /api/projects)
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    return res.json({
      success: true,
      data: results.map((p) => ({ ...p, image_url: p.image || null })),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error_message: err.message,
    });
  }
});

// ✅ 2. إضافة مشروع جديد (POST /api/projects)
router.post("/", async (req, res) => {
  try {
    const { title, description, link, technologies, status, image } = req.body;
    let imageUrl = null;

    if (image && typeof image === "string" && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "portfolio_uploads/projects",
      });
      imageUrl = uploadRes.secure_url;
    }

    // معالجة الـ technologies لو مبعوثة كمصفوفة Array
    const techString = Array.isArray(technologies)
      ? technologies.join(",")
      : technologies || "";

    const insertData = {
      title: title || "",
      description: description || "",
      link: link || "",
      technologies: techString,
      status: status || "active",
      image: imageUrl,
    };

    const [result] = await db.query("INSERT INTO projects SET ?", [insertData]);

    return res.json({
      success: true,
      message: "✅ Project created successfully",
      data: { id: result.insertId, ...insertData, image_url: imageUrl },
    });
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
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status, image } = req.body;

    // جلب بيانات المشروع القديمة
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

    // إذا تم رفع صورة جديدة بصيغة Base64
    if (image && typeof image === "string" && image.startsWith("data:image")) {
      // 1. رفع الصورة الجديدة لـ Cloudinary
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "portfolio_uploads/projects",
      });
      newImageUrl = uploadRes.secure_url;

      // 2. مسح الصورة القديمة فوراً من Cloudinary
      if (oldProject.image) {
        const publicId = extractPublicId(oldProject.image);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (delErr) {
            console.error("⚠️ Could not delete old Cloudinary image:", delErr);
          }
        }
      }
    }

    // معالجة الـ technologies لو مبعوثة كمصفوفة
    const techValue =
      technologies !== undefined
        ? Array.isArray(technologies)
          ? technologies.join(",")
          : technologies
        : oldProject.technologies;

    // تحديث البيانات في MySQL
    const sql = `
      UPDATE projects 
      SET title = ?, description = ?, link = ?, technologies = ?, status = ?, image = ?
      WHERE id = ?
    `;
    const values = [
      title !== undefined ? title : oldProject.title,
      description !== undefined ? description : oldProject.description,
      link !== undefined ? link : oldProject.link,
      techValue,
      status !== undefined ? status : oldProject.status,
      newImageUrl,
      id,
    ];

    await db.query(sql, values);

    return res.json({
      success: true,
      message: "✅ Project updated successfully",
      image_url: newImageUrl,
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
      const publicId = extractPublicId(existing[0].image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (delErr) {
          console.error("⚠️ Cloudinary Delete Error:", delErr);
        }
      }
    }

    await db.query("DELETE FROM projects WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: "✅ Project deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error_message: err.message,
    });
  }
});

export default router;
