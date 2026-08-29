// ============================================================
// 📁 backend/routes/dashboard/experiences.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const query = 'SELECT * FROM experiences ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
    res.json({ success: true, data: results });
  });
});

router.post('/', (req, res) => {
  const { title, description } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  
  const query = 'INSERT INTO experiences (title, description) VALUES (?, ?)';
  db.query(query, [title.trim(), description || ''], (err, result) => {
    if (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create' });
    }
    res.json({ success: true, message: '✅ Created', data: { id: result.insertId } });
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  
  const query = 'UPDATE experiences SET title = ?, description = ? WHERE id = ?';
  db.query(query, [title.trim(), description || '', id], (err, result) => {
    if (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, message: '✅ Updated' });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM experiences WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, message: '✅ Deleted' });
  });
});

export default router;