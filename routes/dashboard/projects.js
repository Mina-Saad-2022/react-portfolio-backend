// ============================================================
// 📁 backend/routes/dashboard/projects.js (أو الملف المقابل له)
// ============================================================
import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ إعداد Multer لتخزين صور المشاريع
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/projects');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ تحديث مشروع بالصورة (PUT /api/projects/:id)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status } = req.body;

    // تجهيز الحقول للتحديث
    let updateFields = { title, description, link, technologies, status };

    // لو اترُفعت صورة جديدة نحدث مسار الصورة
    if (req.file) {
      updateFields.image = `/uploads/projects/${req.file.filename}`;
    }

    const query = 'UPDATE projects SET ? WHERE id = ?';
    await db.query(query, [updateFields, id]);

    return res.json({
      success: true,
      message: '✅ Project updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating project:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating project',
      error: err.message,
    });
  }
});

export default router;