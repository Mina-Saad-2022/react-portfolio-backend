// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, 'public/dashboard/assets/images/information');
    } else if (file.fieldname === 'pdf') {
      cb(null, 'public/dashboard/assets/pdf');
    } else {
      cb(null, 'public/uploads');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

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
router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  return res.json({
    success: true,
    filename: req.file.filename,
    image_url: `https://react-portfolio-backend-seven.vercel.app/dashboard/assets/images/information/${req.file.filename}`,
  });
});

// ✅ 3. رفع ملف الـ CV PDF (POST /api/information/pdf)
router.post('/pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded' });
  }
  return res.json({
    success: true,
    filename: req.file.filename,
  });
});

// ✅ 4. تحديث البيانات كاملة (PUT /api/information)
router.put('/', async (req, res) => {
  const data = req.body;

  // تنظيف الـ Data من أي حقول زي زيادات الـ DB أو الروابط المجهزة للـ Frontend
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