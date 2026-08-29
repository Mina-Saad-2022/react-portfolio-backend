// ============================================================
// 📁 backend/routes/dashboard/skillsBackend.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب جميع مهارات Back-End
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM skills_backend ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('❌ Error fetching backend skills:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch backend skills',
      error: err.message,
    });
  }
});

// ✅ إضافة مهارة Back-End جديدة
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  try {
    const query = 'INSERT INTO skills_backend (title) VALUES (?)';
    const [result] = await db.query(query, [title.trim()]);

    return res.json({
      success: true,
      message: '✅ Backend skill created successfully',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('❌ Error creating backend skill:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create backend skill',
      error: err.message,
    });
  }
});

// ✅ تحديث مهارة Back-End
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  try {
    const query = 'UPDATE skills_backend SET title = ? WHERE id = ?';
    const [result] = await db.query(query, [title.trim(), id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backend skill not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Backend skill updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating backend skill:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update backend skill',
      error: err.message,
    });
  }
});

// ✅ حذف مهارة Back-End
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM skills_backend WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backend skill not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Backend skill deleted successfully',
    });
  } catch (err) {
    console.error('❌ Error deleting backend skill:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete backend skill',
      error: err.message,
    });
  }
});

export default router;