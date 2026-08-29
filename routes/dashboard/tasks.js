// ============================================================
// 📁 backend/routes/dashboard/tasks.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب المهام
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM tasks ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('❌ Error fetching tasks:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: err.message,
    });
  }
});

// ✅ جلب مهمة بالـ ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'SELECT * FROM tasks WHERE id = ?';
    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.json({
      success: true,
      data: results[0],
    });
  } catch (err) {
    console.error('❌ Error fetching task:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: err.message,
    });
  }
});

// ✅ إضافة مهمة
router.post('/', async (req, res) => {
  const { title, status } = req.body;

  try {
    const query = 'INSERT INTO tasks (title, status) VALUES (?, ?)';
    const [result] = await db.query(query, [title, status || 'pending']);

    return res.json({
      success: true,
      message: '✅ Task created successfully',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('❌ Error creating task:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: err.message,
    });
  }
});

// ✅ تحديث مهمة
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, status } = req.body;

  try {
    const query = 'UPDATE tasks SET title = ?, status = ? WHERE id = ?';
    const [result] = await db.query(query, [title, status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Task updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating task:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: err.message,
    });
  }
});

// ✅ حذف مهمة
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM tasks WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Task deleted successfully',
    });
  } catch (err) {
    console.error('❌ Error deleting task:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: err.message,
    });
  }
});

export default router;