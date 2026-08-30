// ============================================================
// 📁 backend/routes/dashboard/projects.js
// ============================================================
import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ إعداد Multer لتخزين صور المشاريع
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/projects');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ 1. جلب كافة المشاريع (GET /api/projects)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM projects ORDER BY id DESC';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results || [],
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

// ✅ 2. إنشاء مشروع جديد (POST /api/projects)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, link, technologies, status } = req.body;
    const imageUrl = req.file ? `/uploads/projects/${req.file.filename}` : null;

    const newProject = {
      title,
      description,
      link,
      technologies,
      status: status || 'active',
      image: imageUrl,
    };

    const query = 'INSERT INTO projects SET ?';
    const [result] = await db.query(query, [newProject]);

    return res.json({
      success: true,
      message: '✅ Project created successfully',
      data: { id: result.insertId, ...newProject },
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

// ✅ 3. تحديث مشروع (PUT /api/projects/:id)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, technologies, status } = req.body;

    let updateData = {
      title,
      description,
      link,
      technologies,
      status,
    };

    // لو اترُفعت صورة جديدة نحدّث مسار الصورة
    if (req.file) {
      updateData.image = `/uploads/projects/${req.file.filename}`;
    }

    const query = 'UPDATE projects SET ? WHERE id = ?';
    await db.query(query, [updateData, id]);

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

// ✅ 4. حذف مشروع (DELETE /api/projects/:id)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM projects WHERE id = ?';
    await db.query(query, [id]);

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