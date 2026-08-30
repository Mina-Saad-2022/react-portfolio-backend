// ============================================================
// 📁 backend/routes/dashboard/projects.js
// ============================================================
import express from 'express';
import multer from 'multer';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ التخزين في الذاكرة لتفادي قيود نظام الملفات في Vercel
const upload = multer({ storage: multer.memoryStorage() });

// ✅ تحديث مشروع بالكامل وبشكل آمن من أخطاء الـ SQL
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status, image } = req.body;

    // 1️⃣ تجهيز القيم وتنظيف الـ undefined لتفادي كراش قاعدة البيانات
    const updatedTitle = title !== undefined ? title : null;
    const updatedDesc = description !== undefined ? description : null;
    const updatedLink = link !== undefined ? link : null;
    const updatedTechs = technologies !== undefined ? technologies : null;
    const updatedStatus = status !== undefined ? status : 'active';
    
    // صورة المشروع (الرابط القديم أو المبعوث)
    let updatedImage = image || null;

    // 2️⃣ استعلام SQL صريح ومباشر بدون استبدال الكائنات
    const query = `
      UPDATE projects 
      SET title = ?, description = ?, link = ?, technologies = ?, status = ?, image = COALESCE(?, image)
      WHERE id = ?
    `;

    await db.query(query, [
      updatedTitle,
      updatedDesc,
      updatedLink,
      updatedTechs,
      updatedStatus,
      updatedImage,
      id,
    ]);

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