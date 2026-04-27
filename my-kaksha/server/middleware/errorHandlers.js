import { createHttpError } from "../utils/httpError.js";

export function notFoundHandler(req, _res, next) {
  next(createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status =
    typeof error?.status === "number"
      ? error.status
      : error?.name === "ValidationError"
        ? 400
        : error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError"
          ? 401
          : error?.code === 11000
            ? 409
            : 500;

  const message = status >= 500 ? error?.message || "Internal server error" : error?.message || "Request failed";
  const payload = { ok: false, error: message };

  if (error?.details) {
    payload.details = error.details;
  }

  res.status(status).json(payload);
}
