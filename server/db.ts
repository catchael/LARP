// ═══════════════════════════════════════════════════════════
// 資料庫初始化（PostgreSQL）
// 安裝：npm install pg && npm install --save-dev @types/pg
// ═══════════════════════════════════════════════════════════

import { Pool } from "pg";

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// 建立資料表（伺服器啟動時執行一次）
export async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      email     TEXT UNIQUE,
      last_played TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS surveys (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id),
      data       TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS script_records (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      script_name TEXT,
      dialogue    TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS assessment_reports (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      report_data TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("[DB] 資料表初始化完成");
}

export default db;