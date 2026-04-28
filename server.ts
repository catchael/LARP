// ═══════════════════════════════════════════════════════════
// 伺服器入口
// ═══════════════════════════════════════════════════════════

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import * as dotenv from "dotenv";
dotenv.config();

import apiRouter from "./server/routes.js";
import { registerSocketHandlers } from "./server/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  try {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: "*" },
      // 保留預設 polling → websocket 升級流程，避免在 Vite middleware 模式下連線失敗
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6,
    });

    app.use(express.json());

    // REST API（全部掛在 /api 前綴下）
    app.use("/api", apiRouter);

    // Socket.IO 事件
    registerSocketHandlers(io);

    // 靜態資源 / Vite dev middleware
    if (process.env.NODE_ENV !== "production") {
      try {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (viteErr) {
        console.error("Vite server creation failed:", viteErr);
      }
    } else {
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      });
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();
