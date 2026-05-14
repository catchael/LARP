// ═══════════════════════════════════════════════════════════
// 伺服器入口
// ═══════════════════════════════════════════════════════════
import "dotenv/config"; 

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";

import apiRouter from "./server/routes.js";          // ← 只留這一個
import { registerSocketHandlers } from "./server/socket.js";
import { initDb } from "./server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: "*" },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6,
    });

    // ✅ 加在這裡，startServer() 裡面的 app，所有路由之前
    app.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });

    app.use(express.json());

    await initDb();

    app.use("/api", apiRouter);

    registerSocketHandlers(io);

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
      app.use(express.static(path.join(__dirname, "../dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../dist/index.html"));
      });
    }

    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();