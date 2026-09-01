// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ إعداد Cloudinary بالمفاتيح الخاصة بك
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'qnfujvlo',
  api_key: process.env.CLOUDINARY_API_KEY || '648639437789343',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'frluELM6NDqKm2RaQBvEheP1oK8',
});

// ⚙️ إعداد التخزين المباشر في Cloudinary بواسطة Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage: storage });

// ✅ 1. جلب البيانات (GET /api/information)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM information LIMIT 1';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results[0] || {},
    });
  } catch (err) {
    console.error('❌ Error fetching information:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch information',
      error: err.message,
    });
  }
});

// ✅ 2. رفع الصورة الشخصية إلى Cloudinary (POST /api/information/image)
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }

    // req.file.path هو رابط الصورة المباشر على Cloudinary
    const imageUrl = req.file.path;

    const query = 'UPDATE information SET image = ? WHERE id = 1';
    await db.query(query, [imageUrl]);

    return res.json({
      success: true,
      message: '✅ Image uploaded to Cloudinary successfully',
      image: imageUrl,
      image_url: imageUrl,
    });
  } catch (err) {
    console.error('❌ Error updating image:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: err.message,
    });
  }
});

// ✅ 3. رفع ملف الـ CV PDF إلى Cloudinary (POST /api/information/pdf)
router.post('/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار ملف PDF' });
    }

    const pdfUrl = req.file.path;

    const query = 'UPDATE information SET cv_file = ? WHERE id = 1';
    await db.query(query, [pdfUrl]);

    return res.json({
      success: true,
      message: '✅ PDF uploaded to Cloudinary successfully',
      filename: pdfUrl,
      pdf_url: pdfUrl,
    });
  } catch (err) {
    console.error('❌ Error uploading PDF:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload PDF',
      error: err.message,
    });
  }
});

// ✅ 4. تحديث البيانات كاملة (PUT /api/information)
router.put('/', async (req, res) => {
  const data = { ...req.body };

  delete data.created_at;
  delete data.updated_at;
  delete data.image_url;
  delete data.pdf_url;

  try {
    const query = 'UPDATE information SET ? WHERE id = 1';
    await db.query(query, [data]);

    return res.json({
      success: true,
      message: '✅ Information updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating information:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update information',
      error: err.message,
    });
  }
});

export default router;