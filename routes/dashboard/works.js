// ============================================================
// 📁 backend/routes/dashboard/works.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب جميع الأعمال
router.get('/', (req, res) => {
  const query = 'SELECT * FROM works ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching works:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch works'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ✅ إضافة عمل جديد
router.post('/', (req, res) => {
  const { title } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const query = 'INSERT INTO works (title) VALUES (?)';
  
  db.query(query, [title.trim()], (err, result) => {
    if (err) {
      console.error('❌ Error creating work:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create work'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Work created successfully',
      data: { id: result.insertId }
    });
  });
});

// ✅ تحديث عمل
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const query = 'UPDATE works SET title = ? WHERE id = ?';
  
  db.query(query, [title.trim(), id], (err, result) => {
    if (err) {
      console.error('❌ Error updating work:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update work'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Work updated successfully'
    });
  });
});

// ✅ حذف عمل
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM works WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting work:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete work'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Work deleted successfully'
    });
  });
});

export default router;