// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import multer from 'multer';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ استخدام MemoryStorage بدلاً من DiskStorage لتوافق Vercel وعدم حدوث Server Error (500)
const upload = multer({ storage: multer.memoryStorage() });

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

// ✅ 2. رفع الصورة الشخصية (POST /api/information/image)
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.body.image || '/image/hero.jpg';

    // تحديث مسار الصورة في جدول الـ information
    const query = 'UPDATE information SET image = ? WHERE id = 1';
    await db.query(query, [imagePath]);

    return res.json({
      success: true,
      message: '✅ Image updated successfully',
      image: imagePath,
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

// ✅ 3. رفع ملف الـ CV PDF (POST /api/information/pdf)
router.post('/pdf', upload.single('pdf'), async (req, res) => {
  try {
    const pdfPath = req.body.pdf || req.file?.originalname || 'cv.pdf';

    return res.json({
      success: true,
      message: '✅ PDF received successfully',
      filename: pdfPath,
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
  const data = req.body;

  delete data.created_at;
  delete data.updated_at;
  delete data.image_url;

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