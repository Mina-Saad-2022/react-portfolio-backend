// ============================================================
// 📁 backend/routes/dashboard/certificates.js
// ============================================================
import express from "express";
import db from "../../config/db.js";

const router = express.Router();

// ✅ جلب الشهادات
router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM certificates ORDER BY id DESC";
    const [results] = await db.query(query);
    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Error fetching certificates:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch certificates" });
  }
});

// ✅ إضافة شهادة
router.post("/", async (req, res) => {
  const { image, title, description } = req.body;
  try {
    const query =
      "INSERT INTO certificates (image, title, description) VALUES (?, ?, ?)";
    const [result] = await db.query(query, [image, title, description]);
    return res.json({
      success: true,
      message: "✅ Certificate created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error creating certificate:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create certificate" });
  }
});

// ✅ تحديث شهادة
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { image, title, description } = req.body;
  try {
    const query =
      "UPDATE certificates SET image = ?, title = ?, description = ? WHERE id = ?";
    await db.query(query, [image, title, description, id]);
    return res.json({
      success: true,
      message: "✅ Certificate updated successfully",
    });
  } catch (err) {
    console.error("❌ Error updating certificate:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update certificate" });
  }
});

// ✅ حذف شهادة
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM certificates WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: "✅ Certificate deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting certificate:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete certificate" });
  }
});

export default router;
