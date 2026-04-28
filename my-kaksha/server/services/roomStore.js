import { randomBytes, randomUUID } from "node:crypto";
import { ensureDatabaseConnection } from "../config/database.js";
import Room from "../models/Room.js";
import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

const ROOMS_FILE = resolveDataFile("rooms.json");
const NOTES_OVERLAY_FILE = resolveDataFile("room-notes-overlay.json");

/** @type {Promise<boolean> | null} */
let mongoReadyPromise = null;

async function isMongoUsable() {
  if (!process.env.MONGODB_URI) {
    return false;
  }
  if (!mongoReadyPromise) {
    mongoReadyPromise = ensureDatabaseConnection()
      .then(() => true)
      .catch(() => false);
  }
  return mongoReadyPromise;
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .slice(0, 6);
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = randomBytes(6);
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out;
}

/** Default lobby seed rooms (always listed for demo / empty DB). */
export const SEED_ROOMS = [
  {
    id: "seed-dsa",
    name: "DSA Practice",
    type: "public",
    focusStyle: "discussion",
    code: "DSPRC1",
    createdBy: "system",
    creatorName: "My Kaksha",
    members: [],
    weeklyGoalHours: null,
    sharedNotes: "",
    activityScore: 142,
    focusPoints: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-dbms",
    name: "DBMS Prep",
    type: "public",
    focusStyle: "discussion",
    code: "DBMS01",
    createdBy: "system",
    creatorName: "My Kaksha",
    members: [],
    weeklyGoalHours: 10,
    sharedNotes: "",
    activityScore: 118,
    focusPoints: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-os",
    name: "OS Revision",
    type: "public",
    focusStyle: "discussion",
    code: "OSREV1",
    createdBy: "system",
    creatorName: "My Kaksha",
    members: [],
    weeklyGoalHours: null,
    sharedNotes: "",
    activityScore: 96,
    focusPoints: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-web",
    name: "Web Dev Zone",
    type: "public",
    focusStyle: "discussion",
    code: "WEBDVZ",
    createdBy: "system",
    creatorName: "My Kaksha",
    members: [],
    weeklyGoalHours: null,
    sharedNotes: "",
    activityScore: 130,
    focusPoints: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-silent",
    name: "Silent Focus",
    type: "public",
    focusStyle: "silent",
    code: "SILENT",
    createdBy: "system",
    creatorName: "My Kaksha",
    members: [],
    weeklyGoalHours: null,
    sharedNotes: "",
    activityScore: 88,
    focusPoints: {},
    createdAt: new Date().toISOString(),
  },
];

function toPlainRoom(doc) {
  const fp = doc.focusPoints instanceof Map ? Object.fromEntries(doc.focusPoints) : doc.focusPoints || {};
  return {
    id: doc._id,
    name: doc.name,
    type: doc.type,
    focusStyle: doc.focusStyle,
    code: doc.code,
    createdBy: doc.createdBy,
    creatorName: doc.creatorName || "",
    members: Array.isArray(doc.members) ? [...doc.members] : [],
    weeklyGoalHours: doc.weeklyGoalHours ?? null,
    sharedNotes: doc.sharedNotes || "",
    activityScore: doc.activityScore ?? 0,
    focusPoints: fp,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  };
}

async function readFileStore() {
  const data = await readJsonFile(ROOMS_FILE, { rooms: [] });
  return { rooms: Array.isArray(data.rooms) ? data.rooms : [] };
}

async function writeFileStore(payload) {
  await writeJsonFile(ROOMS_FILE, { rooms: payload.rooms });
}

function mergeRooms(dynamicRooms) {
  const seedIds = new Set(SEED_ROOMS.map((r) => r.id));
  const seedCodes = new Set(SEED_ROOMS.map((r) => r.code));
  const extra = dynamicRooms.filter((r) => !seedIds.has(r.id) && !seedCodes.has(r.code));
  return [...SEED_ROOMS.map((s) => ({ ...s, members: Array.isArray(s.members) ? [...s.members] : [] })), ...extra];
}

export async function listRoomsMerged() {
  const mongo = await isMongoUsable();
  if (mongo) {
    const docs = await Room.find({}).lean();
    const dynamic = docs.map(toPlainRoom);
    return mergeRooms(dynamic);
  }
  const { rooms } = await readFileStore();
  return mergeRooms(rooms);
}

async function readNotesOverlay() {
  return readJsonFile(NOTES_OVERLAY_FILE, {});
}

async function writeNotesOverlay(data) {
  await writeJsonFile(NOTES_OVERLAY_FILE, data);
}

export async function findRoomById(roomId) {
  const seedHit = SEED_ROOMS.find((r) => r.id === roomId);
  if (seedHit) {
    const overlay = await readNotesOverlay();
    const extra = overlay[roomId];
    return { ...seedHit, sharedNotes: extra ?? seedHit.sharedNotes ?? "" };
  }

  const mongo = await isMongoUsable();
  if (mongo) {
    const doc = await Room.findById(roomId).lean();
    if (doc) return toPlainRoom(doc);
  }
  const merged = await listRoomsMerged();
  return merged.find((r) => r.id === roomId) ?? null;
}

export async function findRoomByCode(code) {
  const normalized = normalizeCode(code);
  const merged = await listRoomsMerged();
  return merged.find((r) => r.code === normalized) ?? null;
}

async function ensureUniqueCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateCode();
    const existing = await findRoomByCode(code);
    if (!existing) return code;
  }
  throw new Error("Could not allocate a unique room code");
}

export async function createRoomRecord({ userId, creatorName, payload }) {
  const name = String(payload.name || "").trim();
  if (!name) {
    const err = new Error("Room name is required");
    err.status = 400;
    throw err;
  }

  const type = payload.type === "private" ? "private" : "public";
  const focusStyle = payload.focusStyle === "silent" ? "silent" : "discussion";
  const weeklyGoalHours =
    payload.weeklyGoalHours === undefined || payload.weeklyGoalHours === null || payload.weeklyGoalHours === ""
      ? null
      : Number(payload.weeklyGoalHours);

  const code = await ensureUniqueCode();
  const mongo = await isMongoUsable();

  if (mongo) {
    const created = await Room.create({
      name,
      type,
      focusStyle,
      code,
      createdBy: userId,
      creatorName: String(creatorName || "").trim(),
      members: [userId],
      weeklyGoalHours: Number.isFinite(weeklyGoalHours) ? weeklyGoalHours : null,
      sharedNotes: "",
      activityScore: 1,
      focusPoints: new Map([[userId, 0]]),
    });
    return toPlainRoom(created.toObject());
  }

  const { rooms } = await readFileStore();
  const room = {
    id: randomUUID(),
    name,
    type,
    focusStyle,
    code,
    createdBy: userId,
    creatorName: String(creatorName || "").trim(),
    members: [userId],
    weeklyGoalHours: Number.isFinite(weeklyGoalHours) ? weeklyGoalHours : null,
    sharedNotes: "",
    activityScore: 1,
    focusPoints: { [userId]: 0 },
    createdAt: new Date().toISOString(),
  };
  rooms.push(room);
  await writeFileStore({ rooms });
  return room;
}

export async function joinRoomByCodeForUser(userId, code) {
  const room = await findRoomByCode(code);
  if (!room) {
    const err = new Error("Room not found");
    err.status = 404;
    throw err;
  }

  if (room.id.startsWith("seed-")) {
    return {
      ...room,
      members: Array.from(new Set([...(room.members || []), userId])),
    };
  }

  const mongo = await isMongoUsable();
  if (mongo) {
    const updated = await Room.findByIdAndUpdate(
      room.id,
      { $addToSet: { members: userId } },
      { new: true }
    ).lean();
    if (!updated) {
      const err = new Error("Room not found");
      err.status = 404;
      throw err;
    }
    return toPlainRoom(updated);
  }

  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === room.id);
  if (idx === -1) {
    const err = new Error("Room not found");
    err.status = 404;
    throw err;
  }
  const members = new Set(rooms[idx].members || []);
  members.add(userId);
  rooms[idx] = { ...rooms[idx], members: [...members] };
  await writeFileStore({ rooms });
  return rooms[idx];
}

export async function leaveRoomForUser(userId, roomId) {
  const mongo = await isMongoUsable();
  if (mongo) {
    if (roomId.startsWith("seed-")) {
      return findRoomById(roomId);
    }
    const updated = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: userId } },
      { new: true }
    ).lean();
    return updated ? toPlainRoom(updated) : null;
  }

  if (roomId.startsWith("seed-")) {
    return findRoomById(roomId);
  }
  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return null;
  rooms[idx] = {
    ...rooms[idx],
    members: (rooms[idx].members || []).filter((id) => id !== userId),
  };
  await writeFileStore({ rooms });
  return rooms[idx];
}

export async function saveRoomSharedNotes(roomId, content) {
  const text = String(content ?? "");
  if (roomId.startsWith("seed-")) {
    const overlay = await readNotesOverlay();
    overlay[roomId] = text;
    await writeNotesOverlay(overlay);
    return findRoomById(roomId);
  }

  const mongo = await isMongoUsable();
  if (mongo) {
    const updated = await Room.findByIdAndUpdate(roomId, { sharedNotes: text }, { new: true }).lean();
    if (!updated) {
      const err = new Error("Room not found");
      err.status = 404;
      throw err;
    }
    return toPlainRoom(updated);
  }

  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) {
    const err = new Error("Room not found");
    err.status = 404;
    throw err;
  }
  rooms[idx] = { ...rooms[idx], sharedNotes: text };
  await writeFileStore({ rooms });
  return rooms[idx];
}

export async function bumpRoomActivity(roomId, delta = 1) {
  const mongo = await isMongoUsable();
  if (mongo && !roomId.startsWith("seed-")) {
    await Room.findByIdAndUpdate(roomId, { $inc: { activityScore: delta } });
    return;
  }
  if (roomId.startsWith("seed-")) return;
  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return;
  rooms[idx].activityScore = (rooms[idx].activityScore || 0) + delta;
  await writeFileStore({ rooms });
}

export async function addFocusPoints(roomId, userId, delta = 1) {
  if (!userId) return;
  const mongo = await isMongoUsable();
  if (mongo && !roomId.startsWith("seed-")) {
    await Room.findByIdAndUpdate(roomId, { $inc: { [`focusPoints.${userId}`]: delta } });
    return;
  }
  const room = await findRoomById(roomId);
  if (!room || roomId.startsWith("seed-")) return;
  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return;
  const fp = { ...(rooms[idx].focusPoints || {}) };
  fp[userId] = (fp[userId] || 0) + delta;
  rooms[idx] = { ...rooms[idx], focusPoints: fp };
  await writeFileStore({ rooms });
}

export async function getLeaderboard(roomId) {
  const room = await findRoomById(roomId);
  if (!room) return [];
  const entries = Object.entries(room.focusPoints || {}).map(([uid, points]) => ({
    userId: uid,
    points: Number(points) || 0,
  }));
  return entries.sort((a, b) => b.points - a.points);
}
