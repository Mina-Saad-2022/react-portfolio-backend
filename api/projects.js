// ============================================================
// 📁 api/projects.js
// ============================================================
import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import mysql from "mysql2/promise";

const app = express();

// ⚙️ إعداد CORS والـ Body Parser
app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ⚙️ إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ⚙️ الاتصال بقاعدة البيانات
const getDbConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });
};

// 🛠️ استخراج public_id المضمون لـ Cloudinary
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

// ✅ 1. GET ALL (/api/projects)
app.get("/api/projects", async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const [results] = await connection.query(
      "SELECT * FROM projects ORDER BY id DESC",
    );
    await connection.end();
    return res.json({
      success: true,
      data: results.map((p) => ({ ...p, image_url: p.image || null })),
    });
  } catch (err) {
    if (connection) await connection.end();
    return res.status(500).json({ success: false, error_message: err.message });
  }
});

// ✅ 2. POST (/api/projects)
app.post("/api/projects", async (req, res) => {
  let connection;
  try {
    const { title, description, link, technologies, status, image } = req.body;
    let imageUrl = null;

    if (image && typeof image === "string" && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "portfolio_uploads/projects",
      });
      imageUrl = uploadRes.secure_url;
    }

    const insertData = {
      title: title || "",
      description: description || "",
      link: link || "",
      technologies: technologies || "",
      status: status || "active",
      image: imageUrl,
    };

    connection = await getDbConnection();
    const [result] = await connection.query("INSERT INTO projects SET ?", [
      insertData,
    ]);
    await connection.end();

    return res.json({
      success: true,
      message: "✅ Project created successfully",
      data: { id: result.insertId, ...insertData, image_url: imageUrl },
    });
  } catch (err) {
    if (connection) await connection.end();
    return res.status(500).json({ success: false, error_message: err.message });
  }
});

// ✅ 3. PUT (/api/projects/:id)
app.put("/api/projects/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status, image } = req.body;

    connection = await getDbConnection();

    // جلب البيانات القديمة
    const [existing] = await connection.query(
      "SELECT * FROM projects WHERE id = ?",
      [id],
    );
    if (!existing || existing.length === 0) {
      await connection.end();
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const oldProject = existing[0];
    let newImageUrl = oldProject.image;

    // لو رفع صورة جديدة
    if (image && typeof image === "string" && image.startsWith("data:image")) {
      // 1. رفع الصورة الجديدة لـ Cloudinary
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "portfolio_uploads/projects",
      });
      newImageUrl = uploadRes.secure_url;

      // 2. مسح الصورة القديمة من Cloudinary
      if (oldProject.image) {
        const publicId = extractPublicId(oldProject.image);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (delErr) {
            console.error("⚠️ Cloudinary delete error:", delErr);
          }
        }
      }
    }

    // تحديث قاعدة البيانات
    const sql = `
      UPDATE projects 
      SET title = ?, description = ?, link = ?, technologies = ?, status = ?, image = ?
      WHERE id = ?
    `;
    const values = [
      title !== undefined ? title : oldProject.title,
      description !== undefined ? description : oldProject.description,
      link !== undefined ? link : oldProject.link,
      technologies !== undefined ? technologies : oldProject.technologies,
      status !== undefined ? status : oldProject.status,
      newImageUrl,
      id,
    ];

    await connection.query(sql, values);
    await connection.end();

    return res.json({
      success: true,
      message: "✅ Project updated successfully",
      image_url: newImageUrl,
    });
  } catch (err) {
    if (connection) await connection.end();
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error_message: err.message,
    });
  }
});

// ✅ 4. DELETE (/api/projects/:id)
app.delete("/api/projects/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getDbConnection();

    const [existing] = await connection.query(
      "SELECT image FROM projects WHERE id = ?",
      [id],
    );

    if (existing.length > 0 && existing[0].image) {
      const publicId = extractPublicId(existing[0].image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (delErr) {
          console.error("⚠️ Cloudinary delete error:", delErr);
        }
      }
    }

    await connection.query("DELETE FROM projects WHERE id = ?", [id]);
    await connection.end();

    return res.json({
      success: true,
      message: "✅ Project deleted successfully",
    });
  } catch (err) {
    if (connection) await connection.end();
    return res.status(500).json({ success: false, error_message: err.message });
  }
});

export default app;
