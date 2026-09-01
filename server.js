// ============================================================
// 📁 server.js
// ============================================================
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ✅ تحميل متغيرات البيئة
dotenv.config();

// ✅ استيراد الـ Routes
import informationRoutes from "./routes/dashboard/information.js";
import tasksRoutes from "./routes/dashboard/tasks.js";
import worksRoutes from "./routes/dashboard/works.js";
import skillsFrontendRoutes from "./routes/dashboard/skillsFrontend.js";
import skillsBackendRoutes from "./routes/dashboard/skillsBackend.js";
import experiencesRoutes from "./routes/dashboard/experiences.js";
import projectsRoutes from "./routes/dashboard/projects.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ إعداد الـ CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ زيادة مساحة استقبال الـ Base64 لـ 10MB (ضروري جداً يكون هنا قبل الـ Routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ خدمة الملفات الثابتة (Uploads)
app.use(
  "/dashboard/assets/images/information",
  express.static(path.join(__dirname, "uploads/images"))
);
app.use(
  "/dashboard/assets/pdf",
  express.static(path.join(__dirname, "uploads/pdf"))
);
app.use(
  "/dashboard/assets/images/projects",
  express.static(path.join(__dirname, "uploads/projects"))
);

// ✅ مسار فحص حالة السيرفر (Health Check)
app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "Backend Server is Running!" });
});

// ✅ تسجيل الـ Routes الخاصة بالـ API
app.use("/api/information", informationRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/works", worksRoutes);
app.use("/api/skills/frontend", skillsFrontendRoutes);
app.use("/api/skills/backend", skillsBackendRoutes);
app.use("/api/experiences", experiencesRoutes);
app.use("/api/projects", projectsRoutes);

// ✅ تشغيل السيرفر محلياً
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال محلياً على: http://localhost:${PORT}`);
  });
}

// ✅ تصدير التطبيق لتشغيله على Vercel
export default app;