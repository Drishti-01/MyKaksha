// REST API — Representational State Transfer
// Uses HTTP methods to define operation type
// GET=read, POST=create, PUT=update, DELETE=remove
// Stateless: each request contains all needed information

import express from "express";
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

export function createApp({ io } = {}) {
  const app = express();

  // Morgan logger — logs every HTTP request (method, url, status, response time)
  // Helps debug and monitor all incoming requests during development
  app.use(morgan("dev"));

  // Body parser — parses incoming JSON request bodies
  // Without this, req.body would be undefined on POST/PUT routes
  app.use(express.json());

  // URL-encoded body parser — parses form submissions (application/x-www-form-urlencoded)
  // extended: true allows nested objects in form data
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware — allows cross-origin requests from the Vite frontend
  // credentials: true is required so cookies (auth_token, session_id) are sent
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Express Session — server-side session storage
  // Session ID stored in cookie, session data on server
  // Different from JWT: JWT is stateless, session is stateful
  // Cookie is httpOnly so JavaScript cannot access it
  // This prevents XSS attacks on session tokens
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

  // Custom request timestamp middleware — attaches ISO timestamp to every request
  // Useful for logging, auditing, and debugging request timing
  app.use((req, _res, next) => {
    req.requestTimestamp = new Date().toISOString();
    next();
  });

  // No-cache middleware for all /api routes — prevents 304 "Not Modified" responses
  // Browser caches GET responses using ETags; this forces fresh data every request
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

  // REST API routes — each resource has its own router
  // GET=read, POST=create, PUT=update, DELETE=remove
  app.use("/api/auth", authRoutes);
  app.use("/api/study-data", studyDataRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/analytics", analyticsRoutes);

  // Demo routes — shows blocking vs non-blocking I/O for evaluation
  app.use("/api/demo", demoRoutes);

  // Study Resources — PostgreSQL + Prisma (isolated; MongoDB unchanged)
  app.use("/api/study-resources", studyResourceRoutes);

  // 404 handler — catches any route not matched above
  app.use(notFoundHandler);

  // Global error handler — MUST be last middleware (4 params: err, req, res, next)
  // Catches all errors thrown by asyncHandler or next(error) calls
  app.use(errorHandler);

  return app;
}
