// ============================================================
// 📁 backend/routes/dashboard/experiences.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ 1. جلب كل الخبرات (Get All Experiences)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM experiences ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('❌ Error fetching experiences:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch experiences',
      error: err.message,
    });
  }
});

// ✅ 2. إضافة خبرة جديدة (Create Experience)
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  try {
    const query = 'INSERT INTO experiences (title) VALUES (?)';
    const [result] = await db.query(query, [title]);

    return res.status(201).json({
      success: true,
      message: '✅ Experience created successfully',
      data: { id: result.insertId, title },
    });
  } catch (err) {
    console.error('❌ Error creating experience:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create experience',
      error: err.message,
    });
  }
});

// ✅ 3. تعديل خبرة بالـ ID (Update Experience)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const query = 'UPDATE experiences SET title = ? WHERE id = ?';
    const [result] = await db.query(query, [title, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Experience updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating experience:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update experience',
      error: err.message,
    });
  }
});

// ✅ 4. حذف خبرة بالـ ID (Delete Experience)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM experiences WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Experience deleted successfully',
    });
  } catch (err) {
    console.error('❌ Error deleting experience:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete experience',
      error: err.message,
    });
  }
});

export default router;