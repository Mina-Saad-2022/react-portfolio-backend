// ============================================================
// 📁 react-portfolio-backend/api/projects.js
// ============================================================
import { v2 as cloudinary } from "cloudinary";
import mysql from "mysql2/promise";
import { parse } from "busboy";

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

// 🛠️ دالة لمعالجة FormData في Vercel Serverless Functions
const parseMultipart = (req) => {
  return new Promise((resolve, reject) => {
    const busboy = parse({ headers: req.headers });
    const fields = {};
    const files = {};

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on("file", (fieldname, file, info) => {
      const chunks = [];
      file.on("data", (data) => {
        chunks.push(data);
      });
      file.on("end", () => {
        files[fieldname] = {
          buffer: Buffer.concat(chunks),
          mimetype: info.mimeType,
          filename: info.filename,
        };
      });
    });

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    busboy.on("error", (err) => {
      reject(err);
    });

    req.pipe(busboy);
  });
};

export default async function handler(req, res) {
  // ✅ إعداد CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let connection;

  try {
    // ✅ 1. GET - جلب جميع المشاريع
    if (req.method === "GET") {
      connection = await getDbConnection();
      const [results] = await connection.query(
        "SELECT * FROM projects ORDER BY id DESC",
      );
      await connection.end();
      return res.json({
        success: true,
        data: results.map((p) => ({ ...p, image_url: p.image || null })),
      });
    }

    // ✅ 2. POST - إضافة مشروع جديد
    if (req.method === "POST") {
      const { fields, files } = await parseMultipart(req);

      const title = fields.title || "";
      const description = fields.description || "";
      const link = fields.link || "";
      const technologies = fields.technologies || "";
      const status = fields.status || "active";

      let imageUrl = null;

      // رفع الصورة لو موجودة
      if (files.image && files.image.buffer) {
        const base64Image = `data:${files.image.mimetype};base64,${files.image.buffer.toString("base64")}`;
        const uploadRes = await cloudinary.uploader.upload(base64Image, {
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
    }

    // ✅ 3. PUT - تحديث مشروع
    if (req.method === "PUT") {
      const { id } = req.query;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID is required and must be a number",
        });
      }

      const { fields, files } = await parseMultipart(req);

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
      if (files.image && files.image.buffer) {
        // 1. رفع الصورة الجديدة لـ Cloudinary
        const base64Image = `data:${files.image.mimetype};base64,${files.image.buffer.toString("base64")}`;
        const uploadRes = await cloudinary.uploader.upload(base64Image, {
          folder: "portfolio_uploads/projects",
        });
        newImageUrl = uploadRes.secure_url;

        // 2. مسح الصورة القديمة من Cloudinary
        if (oldProject.image) {
          const publicId = extractPublicId(oldProject.image);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
              console.log("✅ Old image deleted:", publicId);
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
        fields.title !== undefined ? fields.title : oldProject.title,
        fields.description !== undefined
          ? fields.description
          : oldProject.description,
        fields.link !== undefined ? fields.link : oldProject.link,
        fields.technologies !== undefined
          ? fields.technologies
          : oldProject.technologies,
        fields.status !== undefined ? fields.status : oldProject.status,
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
    }

    // ✅ 4. DELETE - حذف مشروع
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID is required and must be a number",
        });
      }

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
            console.log("✅ Image deleted:", publicId);
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
    }

    // ❌ طريقة غير مدعومة
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    if (connection) await connection.end();
    console.error("❌ Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error_message: error.message,
      error_stack:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
