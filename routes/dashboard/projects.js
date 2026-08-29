// ============================================================
// 📁 backend/routes/dashboard/projects.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ✅ إعداد رفع الصور
const uploadsDir = path.join(__dirname, '../../uploads/projects');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ جلب جميع المشاريع
router.get('/', (req, res) => {
  const query = 'SELECT * FROM projects ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching projects:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch projects'
      });
    }
    
    // ✅ إضافة الرابط الكامل للصورة
    const data = results.map(project => ({
      ...project,
      image_url: project.image 
        ? `http://localhost:5000/dashboard/assets/images/projects/${project.image}`
        : null
    }));
    
    res.json({
      success: true,
      data: data
    });
  });
});

// ✅ إضافة مشروع جديد
router.post('/', upload.single('image'), (req, res) => {
  const { title, description, link, technologies } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const image = req.file ? req.file.filename : null;
  
  const query = `
    INSERT INTO projects (title, description, image, link, technologies)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const values = [
    title.trim(),
    description || '',
    image,
    link || '',
    technologies || ''
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error creating project:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create project'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Project created successfully',
      data: { id: result.insertId }
    });
  });
});

// ✅ تحديث مشروع
router.put('/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, link, technologies } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  // ✅ جلب الصورة القديمة
  const selectQuery = 'SELECT image FROM projects WHERE id = ?';
  db.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching project:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch project'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const oldImage = results[0].image;
    const newImage = req.file ? req.file.filename : oldImage;
    
    // ✅ حذف الصورة القديمة لو تم رفع صورة جديدة
    if (req.file && oldImage) {
      const oldPath = path.join(uploadsDir, oldImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    
    const query = `
      UPDATE projects SET
        title = ?,
        description = ?,
        image = ?,
        link = ?,
        technologies = ?
      WHERE id = ?
    `;
    
    const values = [
      title.trim(),
      description || '',
      newImage,
      link || '',
      technologies || '',
      id
    ];
    
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('❌ Error updating project:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update project'
        });
      }
      
      res.json({
        success: true,
        message: '✅ Project updated successfully'
      });
    });
  });
});

// ✅ حذف مشروع
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // ✅ جلب الصورة لحذفها
  const selectQuery = 'SELECT image FROM projects WHERE id = ?';
  db.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching project:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch project'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const image = results[0].image;
    
    // ✅ حذف الصورة من السيرفر
    if (image) {
      const imagePath = path.join(uploadsDir, image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    
    const query = 'DELETE FROM projects WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('❌ Error deleting project:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete project'
        });
      }
      
      res.json({
        success: true,
        message: '✅ Project deleted successfully'
      });
    });
  });
});

export default router;