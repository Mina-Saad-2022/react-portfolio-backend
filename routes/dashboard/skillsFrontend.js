// ============================================================
// 📁 backend/routes/dashboard/skillsFrontend.js
// ============================================================
import express from "express";
import db from "../../config/db.js";

const router = express.Router();

// ✅ جلب جميع مهارات Front-End
router.get("/", (req, res) => {
  const query = "SELECT * FROM skills_frontend ORDER BY id DESC";

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching frontend skills:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch frontend skills",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
});

// ✅ إضافة مهارة Front-End جديدة
router.post("/", (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Title is required",
    });
  }

  const query = "INSERT INTO skills_frontend (title) VALUES (?)";

  db.query(query, [title.trim()], (err, result) => {
    if (err) {
      console.error("❌ Error creating frontend skill:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to create frontend skill",
      });
    }

    res.json({
      success: true,
      message: "✅ Frontend skill created successfully",
      data: { id: result.insertId },
    });
  });
});

// ✅ تحديث مهارة Front-End
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Title is required",
    });
  }

  const query = "UPDATE skills_frontend SET title = ? WHERE id = ?";

  db.query(query, [title.trim(), id], (err, result) => {
    if (err) {
      console.error("❌ Error updating frontend skill:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update frontend skill",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Frontend skill not found",
      });
    }

    res.json({
      success: true,
      message: "✅ Frontend skill updated successfully",
    });
  });
});

// ✅ حذف مهارة Front-End
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM skills_frontend WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("❌ Error deleting frontend skill:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to delete frontend skill",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Frontend skill not found",
      });
    }

    res.json({
      success: true,
      message: "✅ Frontend skill deleted successfully",
    });
  });
});

export default router;
