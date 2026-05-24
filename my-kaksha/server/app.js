// REST API — Representational State Transfer
// Uses HTTP methods to define operation type
// GET=read, POST=create, PUT=update, DELETE=remove
// Stateless: each request contains all needed information

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import authRoutes from "./routes/authRoutes.js";
import studyDataRoutes from "./routes/studyDataRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
import studyResourceRoutes from "./routes/studyResourceRoutes.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { login, signup } from "./controllers/authController.js";
import { validateLogin, validateSignup } from "./middleware/validation.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");

export function createApp({ io } = {}) {
  const app = express();


  app.use(morgan("dev"));


  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );


  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mykaksha-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(cookieParser());


  app.use((req, _res, next) => {
    req.requestTimestamp = new Date().toISOString();
    next();
  });


  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    next();
  });

  // Rate limiting for API endpoints
  app.use("/api", apiLimiter);

  if (io) {
    app.use((req, _res, next) => {
      req.io = io;
      next();
    });
  }

  // Health check — quick ping to verify server is running
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Auth routes mounted directly (legacy paths kept for compatibility)
  app.post("/signup", authLimiter, validateSignup, asyncHandler(signup));
  app.post("/login", authLimiter, validateLogin, asyncHandler(login));

  app.use("/api/auth", authRoutes);
  app.use("/api/study-data", studyDataRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use("/api/demo", demoRoutes);

  // Study Resources — PostgreSQL + Prisma (isolated; MongoDB unchanged)
  app.use("/api/study-resources", studyResourceRoutes);

  // Production: serve Vite build (same origin as API + Socket.io)
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(distPath));
    app.get(/^(?!\/api|\/socket\.io).*/, (req, res, next) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  // 404 handler — catches any route not matched above
  app.use(notFoundHandler);


  app.use(errorHandler);

  return app;
}
