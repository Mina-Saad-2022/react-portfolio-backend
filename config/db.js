// ============================================================
// 📁 backend/config/db.js
// ============================================================
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// إنشاء Pool للاتصال بالداتا بيز مع تفعيل SSL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER || 'X9YFUQchWwRNLs2.root',
  password: process.env.DB_PASSWORD || 'KM11cf03PGk08f2k',
  database: process.env.DB_NAME || 'test',
  ssl: {
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// اختبار الاتصال عند التشغيل
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ خطأ في الاتصال بـ TiDB Cloud:', err.message);
    return;
  }
  console.log('✅ تم الاتصال بنجاح بـ TiDB Cloud Database!');
  connection.release();
});

export default pool;