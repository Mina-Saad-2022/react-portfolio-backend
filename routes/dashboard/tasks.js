// ============================================================
// 📁 backend/routes/dashboard/tasks.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب جميع المهام
router.get('/', (req, res) => {
  const query = 'SELECT * FROM tasks ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching tasks:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch tasks'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ✅ جلب مهمة واحدة
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM tasks WHERE id = ?';
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching task:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch task'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      data: results[0]
    });
  });
});

// ✅ إضافة مهمة جديدة
router.post('/', (req, res) => {
  const { title, description, icon, color, status } = req.body;
  
  const query = `
    INSERT INTO tasks (title, description, icon, color, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const values = [
    title || '',
    description || '',
    icon || '📋',
    color || '#6C63FF',
    status || 'completed'
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error creating task:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create task'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Task created successfully',
      data: { id: result.insertId }
    });
  });
});

// ✅ تحديث مهمة
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, icon, color, status } = req.body;
  
  const query = `
    UPDATE tasks SET
      title = ?, description = ?, icon = ?, color = ?, status = ?
    WHERE id = ?
  `;
  
  const values = [
    title || '', description || '', icon || '📋',
    color || '#6C63FF', status || 'completed', id
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error updating task:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update task'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Task updated successfully'
    });
  });
});

// ✅ حذف مهمة
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM tasks WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting task:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete task'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Task deleted successfully'
    });
  });
});

export default router;