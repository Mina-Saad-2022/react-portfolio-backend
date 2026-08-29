// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ✅ جلب جميع البيانات
router.get('/', (req, res) => {
  const query = 'SELECT * FROM information WHERE id = 1';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching information:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch data'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found'
      });
    }
    
    const data = results[0];
    data.image_url = data.image
      ? `http://localhost:5000/dashboard/assets/images/information/${data.image}`
      : null;
    
    res.json({
      success: true,
      data: data
    });
  });
});

// ✅ تحديث جميع البيانات
router.put('/', (req, res) => {
  const {
    name, title, email, phone, address, about_text,
    github, linkedin, facebook, whatsapp, image, cv_file
  } = req.body;
  
  const query = `
    UPDATE information SET
      name = ?, title = ?, email = ?, phone = ?, address = ?,
      about_text = ?, github = ?, linkedin = ?, facebook = ?,
      whatsapp = ?, image = ?, cv_file = ?
    WHERE id = 1
  `;
  
  const values = [
    name || '', title || '', email || '', phone || '', address || '',
    about_text || '', github || '', linkedin || '', facebook || '',
    whatsapp || '', image || null, cv_file || null
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error updating information:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update data'
      });
    }
    
    res.json({
      success: true,
      message: '✅ Data updated successfully'
    });
  });
});

// ✅ تحديث حقل معين
router.patch('/field', (req, res) => {
  const { field, value } = req.body;
  
  const allowedFields = [
    'name', 'title', 'email', 'phone', 'address',
    'about_text', 'github', 'linkedin', 'facebook', 'whatsapp'
  ];
  
  if (!allowedFields.includes(field)) {
    return res.status(400).json({
      success: false,
      message: `Field '${field}' is not allowed to update`
    });
  }
  
  const query = `UPDATE information SET ${field} = ? WHERE id = 1`;
  
  db.query(query, [value], (err, result) => {
    if (err) {
      console.error(`❌ Error updating ${field}:`, err);
      return res.status(500).json({
        success: false,
        message: `Failed to update ${field}`
      });
    }
    
    res.json({
      success: true,
      message: `✅ ${field} updated successfully`
    });
  });
});

// ✅ رفع الصورة
import multer from 'multer';
const imagesDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const oldPath = path.join(imagesDir, 'hero.png');
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    cb(null, 'hero.png');
  }
});
const uploadImage = multer({ storage: imageStorage });

router.post('/image', uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image uploaded'
    });
  }
  
  const query = 'UPDATE information SET image = ? WHERE id = 1';
  db.query(query, ['hero.png'], (err, result) => {
    if (err) {
      console.error('❌ Error updating image:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update image'
      });
    }
    
    res.json({
      success: true,
      filename: 'hero.png',
      image_url: `http://localhost:5000/dashboard/assets/images/information/hero.png`,
      message: '✅ Image updated successfully'
    });
  });
});

// ✅ رفع الـ PDF
const pdfDir = path.join(__dirname, '../../uploads/pdf');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pdfDir),
  filename: (req, file, cb) => {
    const oldPath = path.join(pdfDir, 'CV.pdf');
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    cb(null, 'CV.pdf');
  }
});
const uploadPdf = multer({ storage: pdfStorage });

router.post('/pdf', uploadPdf.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PDF uploaded'
    });
  }
  
  const query = 'UPDATE information SET cv_file = ? WHERE id = 1';
  db.query(query, ['CV.pdf'], (err, result) => {
    if (err) {
      console.error('❌ Error updating CV:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update CV'
      });
    }
    
    res.json({
      success: true,
      filename: 'CV.pdf',
      pdf_url: `http://localhost:5000/dashboard/assets/pdf/CV.pdf`,
      message: '✅ CV updated successfully'
    });
  });
});

// ✅ تحميل الـ CV
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename || 'CV.pdf';
  const filepath = path.join(__dirname, '../../uploads/pdf', filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
  
  res.download(filepath, 'CV_MINA_Saadallah.pdf', (err) => {
    if (err) {
      console.error('❌ Download error:', err);
      return res.status(500).json({
        success: false,
        message: 'Download failed'
      });
    }
  });
});

export default router;