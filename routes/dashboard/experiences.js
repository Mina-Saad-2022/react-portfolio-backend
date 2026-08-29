// ============================================================
// 📁 backend/routes/dashboard/information.js
// ============================================================
import express from 'express';
import db from '../../config/db.js';

const router = express.Router();

// ✅ جلب البيانات المعرفية الشخصية
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM information LIMIT 1';
    const [results] = await db.query(query);

    return res.json({
      success: true,
      data: results[0] || null,
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

// ✅ تحديث البيانات المعرفية الكاملة
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

// ✅ تحديث حقل معينة
router.patch('/field', async (req, res) => {
  const { field, value } = req.body;

  if (!field) {
    return res.status(400).json({
      success: false,
      message: 'Field name is required',
    });
  }

  try {
    const query = `UPDATE information SET \`${field}\` = ? WHERE id = 1`;
    await db.query(query, [value]);

    return res.json({
      success: true,
      message: `✅ Field ${field} updated successfully`,
    });
  } catch (err) {
    console.error('❌ Error updating field:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update field',
      error: err.message,
    });
  }
});

export default router;