// ============================================================
// 📁 backend/routes/dashboard/projects.js
// ============================================================
import express from 'express';
import multer from 'multer';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ استبدال التخزين المحلي بـ MemoryStorage ليتوافق مع Vercel
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ 1. جلب كافة المشاريع (GET /api/projects)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM projects ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results || [],
    });
  } catch (err) {
    console.error('❌ Error fetching projects:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: err.message,
    });
  }
});

// ✅ 2. تحديث مشروع (PUT /api/projects/:id)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status, image } = req.body;

    let updateData = {
      title,
      description,
      link,
      technologies,
      status,
    };

    // لو مبعوث رابط صورة أو اسم صورة قديم نحدثه
    if (image) {
      updateData.image = image;
    }

    // ملاحظة: لو بتستخدم خدمة رفع سحابية مثل Cloudinary ارفع الصورة هنا واكتب المسار
    // if (req.file) { ... }

    const query = 'UPDATE projects SET ? WHERE id = ?';
    await db.query(query, [updateData, id]);

    return res.json({
      success: true,
      message: '✅ Project updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating project:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: err.message,
    });
  }
});

export default router;