// C:\laragon\www\react-portfolio-backend\routes\dashboard\skillsFrontend.js
import express from "express";
import pool from "../../config/db.js"; // أو مسار ملف db حسب ترتيبك

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // اتأكد إن اسم الجدول صح في TiDB (مثلاً skills_frontend أو frontend_skills)
    const [rows] = await pool.query("SELECT * FROM skills_frontend");
    res.json(rows);
  } catch (error) {
    console.error("Database Error in skillsFrontend:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
