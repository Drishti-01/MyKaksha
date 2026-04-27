import { asyncHandler } from "../utils/asyncHandler.js";
import { AUTH_COOKIE_NAME, SESSION_COOKIE_NAME, verifyAuthToken } from "../utils/auth.js";
import { createHttpError } from "../utils/httpError.js";
import { readSession, touchSession } from "../services/sessionStore.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || !sessionId) {
    throw createHttpError(401, "Authentication required");
  }

  const payload = verifyAuthToken(token);
  if (!payload?.sub || payload.sessionId !== sessionId) {
    throw createHttpError(401, "Your login session is invalid");
  }

  const session = await readSession(sessionId);
  if (!session || session.userId !== payload.sub) {
    throw createHttpError(401, "Your login session has expired");
  }

  await touchSession(sessionId);

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
