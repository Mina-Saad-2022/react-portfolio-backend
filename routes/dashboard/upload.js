// ============================================================
// 📁 backend/routes/dashboard/upload.js
// ============================================================
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ✅ إعداد مجلدات التخزين
const uploadsDir = path.join(__dirname, "../../uploads");
const imagesDir = path.join(uploadsDir, "images");
const pdfDir = path.join(uploadsDir, "pdf");

// إنشاء المجلدات لو مش موجودة
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

// ✅ إعداد Multer للصور - تحفظ باسم hero.png
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    // ✅ حذف الملف القديم hero.png لو موجود
    const oldPath = path.join(imagesDir, "hero.png");
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
    cb(null, "hero.png");
  },
});

// ✅ إعداد Multer للـ PDF - تحفظ باسم CV.pdf
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pdfDir),
  filename: (req, file, cb) => {
    // ✅ حذف الملف القديم CV.pdf لو موجود
    const oldPath = path.join(pdfDir, "CV.pdf");
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
    cb(null, "CV.pdf");
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadPdf = multer({ storage: pdfStorage });

// ✅ رفع الصورة
router.post("/image", uploadImage.single("image"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  res.json({
    success: true,
    filename: "hero.png", // ✅ دا الاسم الثابت
  });
});

// ✅ رفع الـ PDF
router.post("/pdf", uploadPdf.single("pdf"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  res.json({
    success: true,
    filename: "CV.pdf", // ✅ دا الاسم الثابت
  });
});

export default router;
