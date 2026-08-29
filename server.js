// ============================================================
// 📁 backend/server.js
// ============================================================
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ✅ استيراد Routes
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ خدمة الملفات الثابتة
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

// ✅ استخدام Routes
app.use("/api/information", informationRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/works", worksRoutes);
app.use("/api/skills/frontend", skillsFrontendRoutes);
app.use("/api/skills/backend", skillsBackendRoutes);
app.use("/api/experiences", experiencesRoutes);
app.use("/api/projects", projectsRoutes);

// ✅ تشغيل السيرفر محلياً فقط لو مش على بيئة الإنتاج (Vercel Production)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
    console.log(`📁 Images: ${path.join(__dirname, "uploads/images")}`);
    console.log(`📁 PDF: ${path.join(__dirname, "uploads/pdf")}`);
    console.log(`📁 Projects: ${path.join(__dirname, "uploads/projects")}`);
  });
}

// ✅ تصدير app لتتمكن Vercel Serverless Functions من تشغيله
export default app;