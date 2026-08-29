// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب البيانات المعرفية الشخصية (GET /api/information)
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM information LIMIT 1';
    const [results] = await db.query(query);

    // رجّع البيانات مباشرة سواء كانت موجودة أو كائن فاضي
    return res.json({
      success: true,
      data: results[0] || {}
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

// ✅ تحديث البيانات المعرفية الكاملة (PUT /api/information)
router.put('/', async (req, res) => {
  const data = req.body;

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