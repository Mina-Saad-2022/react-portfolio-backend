// ============================================================
// 📁 backend/api/information.js (Vercel Serverless Function)
// ============================================================
const db = require('../config/db');
const cloudinary = require('cloudinary').v2;

// ⚙️ إعداد Cloudinary بالمفاتيح الخاصة بك
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'qnfujvlo',
    api_key: process.env.CLOUDINARY_API_KEY || '648639437789343',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'frluELM6NDqKm2RaQBvEheP1oK8',
});

module.exports = async (req, res) => {
    // ✅ إعدادات CORS للسماح بالطلبات من الفرونت إند
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // ----------------------------------------------------
        // 1️⃣ جلب البيانات (GET)
        // ----------------------------------------------------
        if (req.method === 'GET') {
            db.query('SELECT * FROM information WHERE id = 1', (err, results) => {
                if (err) {
                    console.error('Database Fetch Error:', err);
                    return res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
                }
                return res.status(200).json({ success: true, data: results[0] || {} });
            });
        } 
        
        // ----------------------------------------------------
        // 2️⃣ رفع الصورة إلى Cloudinary (POST)
        // ----------------------------------------------------
        else if (req.method === 'POST') {
            const { fileBase64 } = req.body; // إرسال الصورة كـ Base64 string من الفرونت

            if (!fileBase64) {
                return res.status(400).json({ success: false, message: 'لم يتم إرسال أي صورة' });
            }

            // رفع الصورة مباشرة على Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
                folder: 'portfolio_uploads',
            });

            return res.status(200).json({
                success: true,
                image_url: uploadResponse.secure_url,
                filename: uploadResponse.secure_url
            });
        }

        // ----------------------------------------------------
        // 3️⃣ تحديث البيانات في قاعدة البيانات (PUT)
        // ----------------------------------------------------
        else if (req.method === 'PUT') {
            const {
                name, title, email, phone, address,
                image, github, linkedin, facebook,
                whatsapp, cv_file, about_text
            } = req.body;

            const query = `
                UPDATE information SET 
                    name = ?, title = ?, email = ?, phone = ?, address = ?,
                    image = ?, github = ?, linkedin = ?, facebook = ?,
                    whatsapp = ?, cv_file = ?, about_text = ?
                WHERE id = 1
            `;

            db.query(query, [
                name, title, email, phone, address,
                image, github, linkedin, facebook,
                whatsapp, cv_file, about_text
            ], (err) => {
                if (err) {
                    console.error('Database Update Error:', err);
                    return res.status(500).json({ success: false, message: 'خطأ في التحديث' });
                }
                return res.status(200).json({ success: true, message: '✅ تم التحديث بنجاح' });
            });
        } 
        
        // ----------------------------------------------------
        // 4️⃣ أي Method آخر غير مدعوم
        // ----------------------------------------------------
        else {
            return res.status(405).json({ success: false, message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Serverless Error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};