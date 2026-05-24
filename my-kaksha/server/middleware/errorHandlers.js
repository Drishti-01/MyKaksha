// Global Error Handling Middleware
// This is the LAST middleware registered in app.js
// Any error passed via next(error) or thrown inside asyncHandler lands here
// Concept 4 — Error Handling Middleware (Backend Engineering-I Eval-II)
//
// Why global error handling matters:
// - Centralises all error responses in one place
// - Prevents unhandled promise rejections from crashing the server
// - Returns consistent JSON shape: { success: false, message, error }
// - Maps known error types (Mongoose, JWT, duplicate key) to correct HTTP status codes

import { createHttpError } from "../utils/httpError.js";

// 404 handler — catches requests that matched no route
export function notFoundHandler(req, _res, next) {
  next(createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Global error handler — must have exactly 4 parameters (err, req, res, next)
// Express identifies it as error middleware by the 4-param signature
export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  // Determine HTTP status code from error type
  const status =
    typeof error?.status === "number"
      ? error.status
      : error?.name === "ValidationError"
        ? 400
        : error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError"
          ? 401
          : error?.code === 11000 || error?.code === "P2002"
            ? 409
            : error?.code === "P2025"
              ? 404
              : 500;

  const message =
    status >= 500
      ? error?.message || "Internal server error"
      : error?.message || "Request failed";

  // Log server errors for debugging — never expose stack traces to client
  if (status >= 500) {
    console.error("[ErrorHandler] 500+:", error?.message || error);
  }

  // Consistent response shape for all errors
  const payload = {
    success: false,
    message,
    error: message,
  };

  if (error?.details) {
    payload.details = error.details;
  }

  res.status(status).json(payload);
}
