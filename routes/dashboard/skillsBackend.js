// ============================================================
// 📁 backend/routes/dashboard/skillsBackend.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب جميع مهارات Back-End
router.get('/', (req, res) => {
  const query = 'SELECT * FROM skills_backend ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching backend skills:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch backend skills'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// ✅ إضافة مهارة Back-End جديدة
router.post('/', (req, res) => {
  const { title } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const query = 'INSERT INTO skills_backend (title) VALUES (?)';
  
  db.query(query, [title.trim()], (err, result) => {
    if (err) {
      console.error('❌ Error creating backend skill:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create backend skill'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Backend skill created successfully',
      data: { id: result.insertId }
    });
  });
});

// ✅ تحديث مهارة Back-End
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const query = 'UPDATE skills_backend SET title = ? WHERE id = ?';
  
  db.query(query, [title.trim(), id], (err, result) => {
    if (err) {
      console.error('❌ Error updating backend skill:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update backend skill'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backend skill not found'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Backend skill updated successfully'
    });
  });
});

// ✅ حذف مهارة Back-End
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM skills_backend WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting backend skill:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete backend skill'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backend skill not found'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Backend skill deleted successfully'
    });
  });
});

export default router;