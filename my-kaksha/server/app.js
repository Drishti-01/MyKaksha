import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import studyDataRoutes from "./routes/studyDataRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { login, signup } from "./controllers/authController.js";
import { validateLogin, validateSignup } from "./middleware/validation.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

export function createApp({ io } = {}) {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  if (io) {
    app.use((req, _res, next) => {
      req.io = io;
      next();
    });
  }

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/signup", validateSignup, asyncHandler(signup));
  app.post("/login", validateLogin, asyncHandler(login));
  app.use("/api/auth", authRoutes);
  app.use("/api/study-data", studyDataRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

