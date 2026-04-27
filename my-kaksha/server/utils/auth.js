import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth_token";
export const SESSION_COOKIE_NAME = "session_id";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function parseDurationToMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 1000;
  }

  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const unitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMap[unit];
}

export function createAuthToken(payload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Set it in .env");
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Set it in .env");
  }

  return jwt.verify(token, JWT_SECRET);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: parseDurationToMs(JWT_EXPIRES_IN),
  };
}

export function getClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
  };
}
