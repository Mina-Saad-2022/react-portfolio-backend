// ============================================================
// 📁 backend/routes/dashboard/projects.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب المشاريع
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM projects ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results,
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

// ✅ إضافة مشروع
router.post('/', async (req, res) => {
  const { title, description, image, category, demo_link, repo_link } = req.body;

  try {
    const query = 'INSERT INTO projects (title, description, image, category, demo_link, repo_link) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [title, description, image, category, demo_link, repo_link]);

    return res.json({
      success: true,
      message: '✅ Project added successfully',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('❌ Error creating project:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: err.message,
    });
  }
});

// ✅ تحديث مشروع
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, image, category, demo_link, repo_link } = req.body;

  try {
    const query = 'UPDATE projects SET title = ?, description = ?, image = ?, category = ?, demo_link = ?, repo_link = ? WHERE id = ?';
    const [result] = await db.query(query, [title, description, image, category, demo_link, repo_link, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

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

// ✅ حذف مشروع
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM projects WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.json({
      success: true,
      message: '✅ Project deleted successfully',
    });
  } catch (err) {
    console.error('❌ Error deleting project:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: err.message,
    });
  }
});

export default router;