// ============================================================
// 📁 backend/api/information.js (Vercel Serverless Function)
// ============================================================
const db = require('../config/db');

module.exports = async (req, res) => {
    // ✅ إعداد CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // ✅ جلب البيانات
            db.query('SELECT * FROM information WHERE id = 1', (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
                }
                res.json({ success: true, data: results[0] || {} });
            });
        } 
        else if (req.method === 'PUT') {
            // ✅ تحديث البيانات
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
                    return res.status(500).json({ success: false, message: 'خطأ في التحديث' });
                }
                res.json({ success: true, message: '✅ تم التحديث بنجاح' });
            });
        }
        else {
            res.status(405).json({ success: false, message: 'Method not allowed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};