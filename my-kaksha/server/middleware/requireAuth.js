// JWT Authentication Flow:
// 1. User logs in → server creates JWT with userId payload
// 2. JWT sent to client in cookie or response body
// 3. Client sends JWT in every protected request (via httpOnly cookie)
// 4. This middleware verifies JWT signature and expiry
// 5. If valid: sets req.auth (with user info) and calls next()
// 6. If invalid: returns 401 Unauthorized
//
// Concept 5 — JWT Authentication (Backend Engineering-I Eval-II)
// JWT is stateless: the server does NOT store the token
// The token itself contains the payload (userId, email, name, sessionId)
// Signature verification ensures the token was not tampered with

import { asyncHandler } from "../utils/asyncHandler.js";
import { AUTH_COOKIE_NAME, SESSION_COOKIE_NAME, verifyAuthToken } from "../utils/auth.js";
import { createHttpError } from "../utils/httpError.js";
import { readSession, touchSession } from "../services/sessionStore.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  // Read JWT from httpOnly cookie (set at login)
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || !sessionId) {
    throw createHttpError(401, "Authentication required");
  }

  // Verify JWT signature and expiry — throws if invalid or expired
  const payload = verifyAuthToken(token);
  if (!payload?.sub || payload.sessionId !== sessionId) {
    throw createHttpError(401, "Your login session is invalid");
  }

  // Double-check session exists in MongoDB (allows server-side logout)
  const session = await readSession(sessionId);
  if (!session || session.userId !== payload.sub) {
    throw createHttpError(401, "Your login session has expired");
  }

  // Refresh session last-seen timestamp
  await touchSession(sessionId);

  // Attach decoded user info to request — available in all downstream handlers
  req.auth = {
    sessionId,
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    },
  };

  next();
});
