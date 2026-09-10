// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import db from '../../config/db.js';

const router = express.Router();

// ⚙️ إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'qnfujvlo',
  api_key: process.env.CLOUDINARY_API_KEY || '648639437789343',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'frluELM6NDqKm2RaQBvEheP1oK8',
});

// ⚙️ إعداد Multer مع CloudinaryStorage للـ PDF والصور
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    
    // 📄 ضبط resource_type كـ raw للـ PDF لمنع خطأ 404
    if (isPdf) {
      return {
        folder: 'portfolio_uploads',
        resource_type: 'raw',
        public_id: `Mina-Saad-CV-${Date.now()}.pdf`,
      };
    }

    return {
      folder: 'portfolio_uploads',
      resource_type: 'image',
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    };
  },
});

const upload = multer({ storage: storage });

// 🛠️ دالة مساعدة لاستخراج الـ public_id من رابط Cloudinary لحذفه
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const pathAfterUpload = parts.slice(uploadIndex + 1);
    if (pathAfterUpload[0].startsWith('v')) {
      pathAfterUpload.shift();
    }

    const fullPath = pathAfterUpload.join('/');
    return fullPath;
  } catch (error) {
    console.error('❌ Error parsing public_id:', error);
    return null;
  }
};

// 🛠️ دالة مساعدة لحذف الملف القديم من Cloudinary
const deleteOldCloudinaryFile = async (fileUrl, resourceType = 'raw') => {
  const publicId = getPublicIdFromUrl(fileUrl);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`🗑️ Deleted old file from Cloudinary: ${publicId}`);
    } catch (err) {
      console.error('❌ Failed to delete old file from Cloudinary:', err);
    }
  }
};

// ✅ 1. جلب البيانات (GET /api/information)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM information LIMIT 1';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results[0] || {},
    });
  } catch (err) {
    console.error('❌ Error fetching information:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch information',
      error: err.message,
    });
  }
});

// ✅ 2. رفع الصورة الشخصية إلى Cloudinary (POST /api/information/image)
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }

    const [rows] = await db.query('SELECT image FROM information WHERE id = 1');
    const oldImageUrl = rows[0]?.image;

    if (oldImageUrl) {
      await deleteOldCloudinaryFile(oldImageUrl, 'image');
    }

    const imageUrl = req.file.path;
    const query = 'UPDATE information SET image = ? WHERE id = 1';
    await db.query(query, [imageUrl]);

    return res.json({
      success: true,
      message: '✅ Image uploaded to Cloudinary successfully',
      image: imageUrl,
      image_url: imageUrl,
    });
  } catch (err) {
    console.error('❌ Error updating image:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: err.message,
    });
  }
});

// ✅ 3. رفع ملف الـ CV PDF إلى Cloudinary (POST /api/information/pdf)
router.post('/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار ملف PDF' });
    }

    const [rows] = await db.query('SELECT cv_file FROM information WHERE id = 1');
    const oldPdfUrl = rows[0]?.cv_file;

    if (oldPdfUrl) {
      await deleteOldCloudinaryFile(oldPdfUrl, 'raw');
    }

    const pdfUrl = req.file.path;
    const query = 'UPDATE information SET cv_file = ? WHERE id = 1';
    await db.query(query, [pdfUrl]);

    return res.json({
      success: true,
      message: '✅ PDF uploaded to Cloudinary successfully',
      filename: pdfUrl,
      pdf_url: pdfUrl,
    });
  } catch (err) {
    console.error('❌ Error uploading PDF:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload PDF',
      error: err.message,
    });
  }
});

// ✅ 4. تحديث البيانات كاملة (PUT /api/information)
router.put('/', async (req, res) => {
  const data = { ...req.body };

  delete data.created_at;
  delete data.updated_at;
  delete data.image_url;
  delete data.pdf_url;

  try {
    const query = 'UPDATE information SET ? WHERE id = 1';
    await db.query(query, [data]);

    return res.json({
      success: true,
      message: '✅ Information updated successfully',
    });
  } catch (err) {
    console.error('❌ Error updating information:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update information',
      error: err.message,
    });
  }
});

export default router;