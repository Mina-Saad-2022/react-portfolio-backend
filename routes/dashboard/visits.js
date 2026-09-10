// ============================================================
// 📁 backend/routes/dashboard/visits.js
// ============================================================
import express from "express";
import db from "../../config/db.js";

const router = express.Router();

// 🛠️ 1. تسجيل زيارة جديدة (تُستدعى تلقائياً من الموقع العام)
router.post("/record", async (req, res) => {
  try {
    // استخراج IP الزائر (سواء عبر بروكسي Vercel/Cloudflare أو مباشر)
    let ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // إزالة البورت أو صيغة IPv6 المحلية للـ localhost
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // جلب معلومات الموقع الجغرافي من API خفيف (ip-api.com)
    let country = "Local / Unknown";
    let region = "Local";
    let city = "Local";

    if (ip !== "127.0.0.1" && !ip.startsWith("192.168.")) {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`,
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.status === "success") {
          country = geoData.country || "Unknown";
          region = geoData.regionName || "Unknown";
          city = geoData.city || "Unknown";
        }
      } catch (geoError) {
        console.error("❌ Error fetching IP location:", geoError.message);
      }
    }

    // إضافة الزيارة أو تحديث عدد الزيارات إذا كان نفس الـ IP في نفس اليوم
    const sql = `
      INSERT INTO visits (ip_address, country, region, city, visit_date, last_visit_time, visit_count)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE 
        visit_count = visit_count + 1,
        last_visit_time = VALUES(last_visit_time),
        country = VALUES(country),
        region = VALUES(region),
        city = VALUES(city)
    `;

    await db.query(sql, [ip, country, region, city, today, now]);

    return res.json({ success: true, message: "Visit recorded successfully" });
  } catch (error) {
    console.error("❌ Error recording visit:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to record visit",
        error: error.message,
      });
  }
});

// 🛠️ 2. جلب جميع الزيارات للجدول (GET /api/visits)
router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM visits ORDER BY last_visit_time DESC";
    const [rows] = await db.query(query);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ Error fetching visits:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch visits",
        error: error.message,
      });
  }
});

// 🛠️ 3. جلب الإحصائيات (عدد زوار اليوم - عدد زوار الأسبوع)
router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // زوار اليوم
    const [todayRows] = await db.query(
      "SELECT COUNT(*) AS todayVisitors FROM visits WHERE visit_date = ?",
      [today],
    );

    // زوار الأسبوع (آخر 7 أيام)
    const [weekRows] = await db.query(
      "SELECT COUNT(*) AS weekVisitors FROM visits WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
    );

    // قائمة آخر الزيارات للإشعارات (زيارات اليوم فقط)
    const [notificationsRows] = await db.query(
      "SELECT * FROM visits WHERE visit_date = ? ORDER BY last_visit_time DESC LIMIT 10",
      [today],
    );

    return res.json({
      success: true,
      data: {
        todayVisitors: todayRows[0]?.todayVisitors || 0,
        weekVisitors: weekRows[0]?.weekVisitors || 0,
        recentVisitsToday: notificationsRows || [],
      },
    });
  } catch (error) {
    console.error("❌ Error fetching visit stats:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch stats",
        error: error.message,
      });
  }
});

export default router;
