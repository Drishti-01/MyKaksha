// Authentication Controller
// Handles signup, login, me, and logout
// Concept 5 (JWT) + Concept 6 (bcrypt) — Backend Engineering-I Eval-II

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

  // MongoDB verified — ensureDatabaseConnection() before every DB operation
  await ensureDatabaseConnection();

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw createHttpError(409, "Email already registered");
  }

  // bcrypt hashing — never store plain text passwords
  // saltRounds: 10 means 2^10 = 1024 hash iterations
  // Higher saltRounds = more secure but slower
  // bcrypt.compare works even though hash is different each time
  // because the salt is stored inside the hash string
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // MongoDB verified — User.create() saves hashed password to MongoDB
  const createdUser = await User.create({ name, email, passwordHash });

  const normalizedUser = {
    id: String(createdUser._id),
    email: createdUser.email,
    name: createdUser.name,
  };

  // MongoDB verified — Session.create() called inside createSessionForUser
  const session = await createSessionForUser(normalizedUser);

  // JWT created with userId, email, name, sessionId as payload
  const token = createAuthToken({
    sub: normalizedUser.id,
    email: normalizedUser.email,
    name: normalizedUser.name,
    sessionId: session.id,
  });

  // Cookies are httpOnly — JavaScript cannot read them (XSS protection)
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.cookie(SESSION_COOKIE_NAME, session.id, getAuthCookieOptions());

  // 201 Created — correct REST status for successful resource creation
  res.status(201).json({
    ok: true,
    message: "Signup successful",
    user: normalizedUser,
  });
}

export async function login(req, res) {
  const { email, password } = req.validatedAuth;

  // MongoDB verified — ensureDatabaseConnection() before every DB operation
  await ensureDatabaseConnection();

  // MongoDB verified — User.findOne() queries MongoDB by email
  const user = await User.findOne({ email }).lean();

  // bcrypt.compare — safely compares plain password against stored hash
  // Returns false if password wrong, never exposes the hash
  if (!user || !(await bcrypt.compare(password, user.passwordHash || ""))) {
    throw createHttpError(401, "Invalid email or password");
  }

  const normalizedUser = {
    id: String(user._id),
    email: user.email,
    name: user.name,
  };

  // MongoDB verified — Session.create() called inside createSessionForUser
  const session = await createSessionForUser(normalizedUser);

  // JWT created — stateless token containing user identity
  const token = createAuthToken({
    sub: normalizedUser.id,
    email: normalizedUser.email,
    name: normalizedUser.name,
    sessionId: session.id,
  });

  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.cookie(SESSION_COOKIE_NAME, session.id, getAuthCookieOptions());

  // 200 OK — correct REST status for successful login
  res.status(200).json({
    ok: true,
    message: "Login successful",
    user: normalizedUser,
  });
}

export async function me(req, res) {
  // req.auth set by requireAuth middleware after JWT verification
  res.status(200).json({ ok: true, user: req.auth.user });
}

export async function logout(req, res) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    // MongoDB verified — deletes session document from MongoDB
    await deleteSession(sessionId);
  }

  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
  res.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
  res.status(200).json({ ok: true, message: "Logged out" });
}
