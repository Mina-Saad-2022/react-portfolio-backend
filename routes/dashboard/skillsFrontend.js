// ============================================================
// 📁 react-portfolio-backend/routes/dashboard/skillsFrontend.js
// ============================================================
import express from "express";
import pool from "../../config/db.js";

const router = express.Router();

// 1️⃣ جلب كل مهارات الـ Frontend
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM skills_frontend ORDER BY id DESC",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ Database Error in skillsFrontend GET:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2️⃣ إضافة مهارة جديدة
router.post("/", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const [result] = await pool.query(
      "INSERT INTO skills_frontend (title) VALUES (?)",
      [title.trim()],
    );

    res.json({
      success: true,
      data: { id: result.insertId, title: title.trim() },
    });
  } catch (error) {
    console.error("❌ Database Error in skillsFrontend POST:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3️⃣ تعديل مهارة
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const [result] = await pool.query(
      "UPDATE skills_frontend SET title = ? WHERE id = ?",
      [title.trim(), id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    }

    res.json({ success: true, message: "Skill updated successfully" });
  } catch (error) {
    console.error("❌ Database Error in skillsFrontend PUT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4️⃣ حذف مهارة
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM skills_frontend WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    }

    res.json({ success: true, message: "Skill deleted successfully" });
  } catch (error) {
    console.error("❌ Database Error in skillsFrontend DELETE:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
