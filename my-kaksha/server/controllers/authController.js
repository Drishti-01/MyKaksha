import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ensureDatabaseConnection } from "../config/database.js";
import { createSessionForUser, deleteSession } from "../services/sessionStore.js";
import {
  AUTH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions,
  getClearCookieOptions,
} from "../utils/auth.js";
import { createHttpError } from "../utils/httpError.js";

export async function signup(req, res) {
  const { name, email, password } = req.validatedAuth;

  await ensureDatabaseConnection();

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw createHttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const createdUser = await User.create({ name, email, passwordHash });

  const normalizedUser = {
    id: String(createdUser._id),
    email: createdUser.email,
    name: createdUser.name,
  };

  const session = await createSessionForUser(normalizedUser);
  const token = createAuthToken({
    sub: normalizedUser.id,
    email: normalizedUser.email,
    name: normalizedUser.name,
    sessionId: session.id,
  });

  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.cookie(SESSION_COOKIE_NAME, session.id, getAuthCookieOptions());
  res.status(201).json({
    ok: true,
    message: "Signup successful",
    user: normalizedUser,
  });
}

export async function login(req, res) {
  const { email, password } = req.validatedAuth;

  await ensureDatabaseConnection();

  const user = await User.findOne({ email }).lean();
  if (!user || !(await bcrypt.compare(password, user.passwordHash || ""))) {
    throw createHttpError(401, "Invalid email or password");
  }

  const normalizedUser = {
    id: String(user._id),
    email: user.email,
    name: user.name,
  };

  const session = await createSessionForUser(normalizedUser);
  const token = createAuthToken({
    sub: normalizedUser.id,
    email: normalizedUser.email,
    name: normalizedUser.name,
    sessionId: session.id,
  });

  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.cookie(SESSION_COOKIE_NAME, session.id, getAuthCookieOptions());
  res.status(200).json({
    ok: true,
    message: "Login successful",
    user: normalizedUser,
  });
}

export async function me(req, res) {
  res.status(200).json({ ok: true, user: req.auth.user });
}

export async function logout(req, res) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    await deleteSession(sessionId);
  }

  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
  res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
  res.status(200).json({ ok: true, message: "Logged out" });
}
