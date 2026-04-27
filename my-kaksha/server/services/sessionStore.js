import { randomUUID } from "node:crypto";
import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

const sessionsFile = resolveDataFile("sessions.json");

function normalizeSessionContainer(payload) {
  return {
    sessions: payload?.sessions && typeof payload.sessions === "object" ? payload.sessions : {},
  };
}

export async function createSessionForUser(user) {
  const payload = await readJsonFile(sessionsFile, { sessions: {} });
  const container = normalizeSessionContainer(payload);
  const now = new Date().toISOString();
  const sessionId = randomUUID();

  container.sessions[sessionId] = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: now,
    lastSeenAt: now,
  };

  await writeJsonFile(sessionsFile, container);
  return container.sessions[sessionId];
}

export async function readSession(sessionId) {
  const payload = await readJsonFile(sessionsFile, { sessions: {} });
  const container = normalizeSessionContainer(payload);
  return container.sessions[sessionId] || null;
}

export async function touchSession(sessionId) {
  const payload = await readJsonFile(sessionsFile, { sessions: {} });
  const container = normalizeSessionContainer(payload);

  if (!container.sessions[sessionId]) {
    return null;
  }

  container.sessions[sessionId] = {
    ...container.sessions[sessionId],
    lastSeenAt: new Date().toISOString(),
  };

  await writeJsonFile(sessionsFile, container);
  return container.sessions[sessionId];
}

export async function deleteSession(sessionId) {
  const payload = await readJsonFile(sessionsFile, { sessions: {} });
  const container = normalizeSessionContainer(payload);

  if (!container.sessions[sessionId]) {
    return false;
  }

  delete container.sessions[sessionId];
  await writeJsonFile(sessionsFile, container);
  return true;
}
