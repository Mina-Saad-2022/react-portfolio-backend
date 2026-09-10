// ============================================================
// 📁 backend/routes/dashboard/visits.js
// ============================================================
import express from "express";
import db from "../../config/db.js";

const router = express.Router();

router.post("/record", async (req, res) => {
  try {
    let ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
    }

    const { deviceType, osName, browserName, connectionSpeed, referrerUrl } =
      req.body || {};

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    let country = "Egypt";
    let region = "Cairo Gov";
    let city = "Cairo";

    if (ip !== "127.0.0.1" && !ip.startsWith("192.168.")) {
      try {
        const geoRes = await fetch(`http://ipwho.is/${ip}`);
        const geoData = await geoRes.json();

        if (geoData && geoData.success) {
          country = geoData.country || "Egypt";
          region = geoData.region || "Cairo";

          let ispName =
            geoData.connection?.isp || geoData.connection?.org || "";
          let baseCity = geoData.city || "Cairo";

          if (ispName.toLowerCase().includes("vodafone")) {
            city = `${baseCity} (Vodafone)`;
          } else if (ispName.toLowerCase().includes("orange")) {
            city = `${baseCity} (Orange)`;
          } else if (ispName.toLowerCase().includes("etisalat")) {
            city = `${baseCity} (Etisalat)`;
          } else if (
            ispName.toLowerCase().includes("we") ||
            ispName.toLowerCase().includes("telecom egypt")
          ) {
            city = `${baseCity} (WE)`;
          } else {
            city = baseCity;
          }
        }
      } catch (geoError) {
        console.error("❌ Error fetching IP location:", geoError.message);
      }
    } else {
      city = "Local Development";
    }

    const sql = `
      INSERT INTO visits (ip_address, country, region, city, device_type, os_name, browser_name, connection_speed, referrer_url, visit_date, last_visit_time, visit_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE 
        visit_count = visit_count + 1,
        last_visit_time = VALUES(last_visit_time),
        country = VALUES(country),
        region = VALUES(region),
        city = VALUES(city),
        device_type = VALUES(device_type),
        os_name = VALUES(os_name),
        browser_name = VALUES(browser_name),
        connection_speed = VALUES(connection_speed),
        referrer_url = VALUES(referrer_url)
    `;

    await db.query(sql, [
      ip,
      country,
      region,
      city,
      deviceType || "Unknown",
      osName || "Unknown",
      browserName || "Unknown",
      connectionSpeed || "Standard",
      referrerUrl || "Direct Visit",
      today,
      now,
    ]);

    return res.json({ success: true, message: "Visit recorded successfully" });
  } catch (error) {
    console.error("❌ Error recording visit:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to record visit" });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM visits ORDER BY last_visit_time DESC";
    const [rows] = await db.query(query);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ Error fetching visits:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch visits" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [todayRows] = await db.query(
      "SELECT COUNT(*) AS todayVisitors FROM visits WHERE visit_date = ?",
      [today],
    );
    const [weekRows] = await db.query(
      "SELECT COUNT(*) AS weekVisitors FROM visits WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
    );
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
    console.error("❌ Error fetching stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch stats" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM visits WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Visit deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete visit" });
  }
});

export default router;
