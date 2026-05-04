import { randomUUID } from "node:crypto";
import { ensureDatabaseConnection } from "../config/database.js";
import Session from "../models/Session.js";

export async function createSessionForUser(user) {
  await ensureDatabaseConnection();

  const now = new Date();
  const sessionId = randomUUID();

  const session = await Session.create({
    _id: sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: now,
    lastSeenAt: now,
  });

  return {
    id: session._id,
    userId: session.userId,
    email: session.email,
    name: session.name,
    createdAt: session.createdAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
  };
}

export async function readSession(sessionId) {
  await ensureDatabaseConnection();

  const session = await Session.findById(sessionId).lean();
  if (!session) {
    return null;
  }

  return {
    id: session._id,
    userId: session.userId,
    email: session.email,
    name: session.name,
    createdAt: new Date(session.createdAt).toISOString(),
    lastSeenAt: new Date(session.lastSeenAt).toISOString(),
  };
}

export async function touchSession(sessionId) {
  await ensureDatabaseConnection();

  const session = await Session.findByIdAndUpdate(
    sessionId,
    { lastSeenAt: new Date() },
    { returnDocument: "after" }
  ).lean();

  if (!session) {
    return null;
  }

  return {
    id: session._id,
    userId: session.userId,
    email: session.email,
    name: session.name,
    createdAt: new Date(session.createdAt).toISOString(),
    lastSeenAt: new Date(session.lastSeenAt).toISOString(),
  };
}

export async function deleteSession(sessionId) {
  await ensureDatabaseConnection();

  const result = await Session.deleteOne({ _id: sessionId });
  return result.deletedCount > 0;
}
