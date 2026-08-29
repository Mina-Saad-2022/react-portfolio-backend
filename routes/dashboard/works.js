// ============================================================
// 📁 backend/routes/dashboard/works.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب الأعمال
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM works ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('❌ Error fetching works:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch works',
      error: err.message,
    });
  }
});

// ✅ إضافة عمل
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  try {
    const query = 'INSERT INTO works (title) VALUES (?)';
    const [result] = await db.query(query, [title.trim()]);

    return res.json({
      success: true,
      message: '✅ Work created successfully',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('❌ Error creating work:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create work',
      error: err.message,
    });
  }
});

// ✅ تحديث عمل
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
    const query = 'UPDATE works SET title = ? WHERE id = ?';
    const [result] = await db.query(query, [title.trim(), id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Work updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating work:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update work',
      error: err.message,
    });
  }
});

// ✅ حذف عمل
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM works WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Work deleted successfully',
    });
  } catch (err) {
    console.error('❌ Error deleting work:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete work',
      error: err.message,
    });
  }
});

export default router;