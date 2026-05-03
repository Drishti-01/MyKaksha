import { randomBytes, randomUUID } from "node:crypto";
import { ensureDatabaseConnection } from "../config/database.js";
import Room from "../models/Room.js";
import RoomSession from "../models/RoomSession.js";
import UserRoomStats from "../models/UserRoomStats.js";
import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

const ROOMS_FILE = resolveDataFile("rooms.json");
const NOTES_OVERLAY_FILE = resolveDataFile("room-notes-overlay.json");
const ROOM_SESSIONS_FILE = resolveDataFile("room-sessions.json");
const USER_ROOM_STATS_FILE = resolveDataFile("user-room-stats.json");

// Stable UUIDs for the 5 seed rooms — fixed so they never change between restarts
// These are the real MongoDB _id values stored in the rooms collection
export const SEED_ROOM_IDS = {
  dsa:    "a1b2c3d4-0001-0001-0001-000000000001",
  dbms:   "a1b2c3d4-0001-0001-0001-000000000002",
  os:     "a1b2c3d4-0001-0001-0001-000000000003",
  web:    "a1b2c3d4-0001-0001-0001-000000000004",
  silent: "a1b2c3d4-0001-0001-0001-000000000005",
};

export const SEED_ROOMS_SPEC = [
  { id: SEED_ROOM_IDS.dsa,    name: "DSA Practice", type: "public", focusStyle: "discussion", code: "DSPRC1" },
  { id: SEED_ROOM_IDS.dbms,   name: "DBMS Prep",    type: "public", focusStyle: "discussion", code: "DBMS01" },
  { id: SEED_ROOM_IDS.os,     name: "OS Revision",  type: "public", focusStyle: "discussion", code: "OSREV1" },
  { id: SEED_ROOM_IDS.web,    name: "Web Dev Zone",  type: "public", focusStyle: "discussion", code: "WEBDVZ" },
  { id: SEED_ROOM_IDS.silent, name: "Silent Focus",  type: "public", focusStyle: "silent",     code: "SILENT" },
];

let mongoReadyPromise = null;

async function isMongoUsable() {
  if (!process.env.MONGODB_URI) return false;
  if (!mongoReadyPromise) {
    mongoReadyPromise = ensureDatabaseConnection()
      .then(() => true)
      .catch(() => false);
  }
  return mongoReadyPromise;
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase().slice(0, 6);
}

function nowIso() {
  return new Date().toISOString();
}

function todayKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function minutesBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(0, Math.round(ms / 60000));
}

function focusPointsFromDelta({ sessionsCompleted = 0, focusMinutes = 0 }) {
  return Math.round((sessionsCompleted * 10) + (focusMinutes / 5));
}

function buildMember(userId, name, joinedAt = new Date()) {
  return {
    userId: String(userId || "").trim(),
    name: String(name || "Student").trim() || "Student",
    joinedAt,
  };
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out;
}

function toPlainRoom(doc) {
  const fp = doc.focusPoints instanceof Map ? Object.fromEntries(doc.focusPoints) : doc.focusPoints || {};
  const members = Array.isArray(doc.members) ? doc.members.map((m) => ({
    userId: m.userId,
    name: m.name,
    joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : nowIso(),
  })) : [];

  const createdBy = doc.createdBy && typeof doc.createdBy === "object"
    ? { userId: doc.createdBy.userId || "", name: doc.createdBy.name || "" }
    : { userId: doc.createdBy || "", name: doc.creatorName || "" };

  return {
    id: String(doc._id || doc.id),
    name: doc.name,
    type: doc.type,
    focusStyle: doc.focusStyle,
    code: doc.code,
    createdBy,
    members,
    weeklyGoalHours: doc.weeklyGoalHours ?? null,
    sharedNotes: doc.sharedNotes || "",
    activityScore: doc.activityScore ?? 0,
    focusPoints: fp,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : nowIso(),
    lastActiveAt: doc.lastActiveAt ? new Date(doc.lastActiveAt).toISOString() : nowIso(),
  };
}

// Seed the 5 default rooms into MongoDB using stable UUIDs as _id
// Uses upsert by CODE so it always runs regardless of collection state
// This means CASA and other user rooms are never affected
export async function seedDefaultRooms() {
  const mongo = await isMongoUsable();
  if (!mongo) return;
  for (const spec of SEED_ROOMS_SPEC) {
    // Upsert by code — if room with this code exists, do nothing ($setOnInsert only runs on insert)
    // If it doesn't exist, create it with the stable UUID _id
    await Room.findOneAndUpdate(
      { code: spec.code },
      {
        $setOnInsert: {
          _id: spec.id,
          name: spec.name,
          type: spec.type,
          focusStyle: spec.focusStyle,
          code: spec.code,
          createdBy: { userId: "system", name: "My Kaksha" },
          members: [],
          weeklyGoalHours: null,
          sharedNotes: "",
          activityScore: 0,
          focusPoints: new Map(),
          isActive: true,
          lastActiveAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );
  }
  console.log("[roomStore] Default rooms seeded/verified in MongoDB");
}

async function readFileStore() {
  const data = await readJsonFile(ROOMS_FILE, { rooms: [] });
  return { rooms: Array.isArray(data.rooms) ? data.rooms : [] };
}

async function writeFileStore(payload) {
  await writeJsonFile(ROOMS_FILE, { rooms: payload.rooms });
}

async function readNotesOverlay() {
  return readJsonFile(NOTES_OVERLAY_FILE, {});
}

async function writeNotesOverlay(data) {
  await writeJsonFile(NOTES_OVERLAY_FILE, data);
}

async function readRoomSessionsFallback() {
  return readJsonFile(ROOM_SESSIONS_FILE, { sessions: [] });
}

async function writeRoomSessionsFallback(payload) {
  await writeJsonFile(ROOM_SESSIONS_FILE, payload);
}

async function readUserRoomStatsFallback() {
  return readJsonFile(USER_ROOM_STATS_FILE, { stats: [] });
}

async function writeUserRoomStatsFallback(payload) {
  await writeJsonFile(USER_ROOM_STATS_FILE, payload);
}

// MongoDB verified — Room.find() reads all rooms from MongoDB
// No in-memory seed injection — everything comes from MongoDB
export async function listRoomsMerged() {
  const mongo = await isMongoUsable();
  if (mongo) {
    const docs = await Room.find({}).lean();
    return docs.map(toPlainRoom);
  }
  // Fallback: JSON file + in-memory seeds when MongoDB is unavailable
  const { rooms } = await readFileStore();
  const seedIds = new Set(SEED_ROOMS_SPEC.map((r) => r.id));
  const extra = rooms.filter((r) => !seedIds.has(r.id));
  const fallbackSeeds = SEED_ROOMS_SPEC.map((s) => ({
    ...s,
    createdBy: { userId: "system", name: "My Kaksha" },
    members: [],
    weeklyGoalHours: null,
    sharedNotes: "",
    activityScore: 0,
    focusPoints: {},
    isActive: true,
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  }));
  return [...fallbackSeeds, ...extra];
}

// MongoDB verified — Room.findById() reads single room from MongoDB
export async function findRoomById(roomId) {
  const mongo = await isMongoUsable();
  if (mongo) {
    const doc = await Room.findById(roomId).lean();
    if (doc) return toPlainRoom(doc);
    return null;
  }
  // Fallback when MongoDB unavailable
  const all = await listRoomsMerged();
  return all.find((r) => r.id === roomId) ?? null;
}

export async function findRoomByCode(code) {
  const normalized = normalizeCode(code);
  const mongo = await isMongoUsable();
  if (mongo) {
    const doc = await Room.findOne({ code: normalized }).lean();
    return doc ? toPlainRoom(doc) : null;
  }
  const all = await listRoomsMerged();
  return all.find((r) => r.code === normalized) ?? null;
}

async function ensureUniqueCode() {
  for (let i = 0; i < 20; i += 1) {
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
  const weeklyGoalHours = payload.weeklyGoalHours === undefined || payload.weeklyGoalHours === null || payload.weeklyGoalHours === ""
    ? null
    : Number(payload.weeklyGoalHours);
  const code = await ensureUniqueCode();
  const newId = randomUUID();

  const mongo = await isMongoUsable();
  if (mongo) {
    const created = await Room.create({
      _id: newId,
      name,
      type,
      focusStyle,
      code,
      createdBy: { userId, name: String(creatorName || "Student").trim() || "Student" },
      members: [buildMember(userId, creatorName || "Student", new Date())],
      weeklyGoalHours: Number.isFinite(weeklyGoalHours) ? weeklyGoalHours : null,
      sharedNotes: "",
      activityScore: 1,
      focusPoints: new Map([[userId, 0]]),
      isActive: true,
      lastActiveAt: new Date(),
    });
    return toPlainRoom(created.toObject());
  }

  const newRoom = {
    id: newId,
    name,
    type,
    focusStyle,
    code,
    createdBy: { userId, name: String(creatorName || "Student").trim() || "Student" },
    members: [buildMember(userId, creatorName || "Student", new Date())],
    weeklyGoalHours: Number.isFinite(weeklyGoalHours) ? weeklyGoalHours : null,
    sharedNotes: "",
    activityScore: 1,
    focusPoints: { [userId]: 0 },
    isActive: true,
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  };
  const { rooms } = await readFileStore();
  rooms.push(newRoom);
  await writeFileStore({ rooms });
  return newRoom;
}

export async function joinRoomByCodeForUser(userId, userName, code) {
  const room = await findRoomByCode(code);
  if (!room) {
    const err = new Error("Room not found");
    err.status = 404;
    throw err;
  }

  const member = buildMember(userId, userName || "Student", new Date());
  const mongo = await isMongoUsable();
  if (mongo) {
    await Room.updateOne(
      { _id: room.id, "members.userId": { $ne: userId } },
      { $push: { members: member }, $set: { lastActiveAt: new Date(), isActive: true }, $inc: { activityScore: 1 } }
    );
    const updated = await Room.findById(room.id).lean();
    return updated ? toPlainRoom(updated) : room;
  }

  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === room.id);
  if (idx === -1) return room;
  const exists = (rooms[idx].members || []).some((m) => m.userId === userId);
  const members = exists ? rooms[idx].members : [...(rooms[idx].members || []), member];
  rooms[idx] = { ...rooms[idx], members, activityScore: (rooms[idx].activityScore || 0) + 1, lastActiveAt: nowIso(), isActive: true };
  await writeFileStore({ rooms });
  return rooms[idx];
}

export async function leaveRoomForUser(userId, roomId) {
  const mongo = await isMongoUsable();
  if (mongo) {
    const updated = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: { userId } }, $set: { lastActiveAt: new Date() } },
      { returnDocument: "after" }
    ).lean();
    return updated ? toPlainRoom(updated) : null;
  }

  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return null;
  rooms[idx] = { ...rooms[idx], members: (rooms[idx].members || []).filter((m) => m.userId !== userId), lastActiveAt: nowIso() };
  await writeFileStore({ rooms });
  return rooms[idx];
}

export async function saveRoomSharedNotes(roomId, content) {
  const text = String(content ?? "");
  const mongo = await isMongoUsable();
  if (mongo) {
    const updated = await Room.findByIdAndUpdate(
      roomId,
      { sharedNotes: text, lastActiveAt: new Date() },
      { returnDocument: "after" }
    ).lean();
    if (!updated) {
      const err = new Error("Room not found");
      err.status = 404;
      throw err;
    }
    return toPlainRoom(updated);
  }

  // Fallback: overlay file for when MongoDB is unavailable
  const overlay = await readNotesOverlay();
  overlay[roomId] = text;
  await writeNotesOverlay(overlay);
  const all = await listRoomsMerged();
  return all.find((r) => r.id === roomId) ?? null;
}

export async function getRoomSharedNotes(roomId) {
  const room = await findRoomById(roomId);
  return room?.sharedNotes || "";
}

export async function createRoomSessionEntry({ roomId, userId, userName }) {
  const joinedAt = new Date();
  const date = todayKey(joinedAt);
  const mongo = await isMongoUsable();
  if (mongo) {
    // $setOnInsert: only runs on INSERT (new document) — no overlap with $set
    // $set: always runs on both insert and update
    // Fields must NOT appear in both operators — MongoDB throws ConflictingUpdateOperators
    return RoomSession.findOneAndUpdate(
      { roomId, userId, date },
      {
        $setOnInsert: {
          roomId,
          userId,
          date,
          totalFocusMinutes: 0,
          totalMinutes: 0,
          sessionsCompleted: 0,
        },
        $set: {
          userName,
          joinedAt,
          leftAt: null,
          lastActive: joinedAt,
        },
      },
      { upsert: true, returnDocument: "after" }
    ).lean();
  }

  const data = await readRoomSessionsFallback();
  data.sessions = Array.isArray(data.sessions) ? data.sessions : [];
  const existing = data.sessions.find((s) => s.roomId === roomId && s.userId === userId && s.date === date);
  if (existing) {
    existing.userName = userName;
    existing.joinedAt = joinedAt.toISOString();
    existing.leftAt = null;
    existing.lastActive = joinedAt.toISOString();
    await writeRoomSessionsFallback(data);
    return existing;
  }
  const row = { id: randomUUID(), roomId, userId, userName, date, joinedAt: joinedAt.toISOString(), leftAt: null, totalFocusMinutes: 0, totalMinutes: 0, sessionsCompleted: 0, lastActive: joinedAt.toISOString() };
  data.sessions.push(row);
  await writeRoomSessionsFallback(data);
  return row;
}

export async function closeRoomSessionEntry({ roomId, userId, extraCompletedSessions = 0 }) {
  const leftAt = new Date();
  const date = todayKey(leftAt);
  const mongo = await isMongoUsable();
  if (mongo) {
    const session = await RoomSession.findOne({ roomId, userId, date, leftAt: null }).lean();
    if (!session) return null;
    const segmentMinutes = session.joinedAt ? minutesBetween(session.joinedAt, leftAt) : 0;
    // Only update totalMinutes (raw time in room) — NOT totalFocusMinutes
    // totalFocusMinutes is only updated by trackSessionComplete (Pomodoro completion)
    return RoomSession.findOneAndUpdate(
      { roomId, userId, date },
      {
        $set: { leftAt, lastActive: leftAt },
        $inc: {
          totalMinutes: segmentMinutes,
          sessionsCompleted: Math.max(0, Number(extraCompletedSessions) || 0),
        },
      },
      { returnDocument: "after" }
    ).lean();
  }

  const data = await readRoomSessionsFallback();
  data.sessions = Array.isArray(data.sessions) ? data.sessions : [];
  const actualIdx = [...data.sessions].reverse().findIndex((s) => s.roomId === roomId && s.userId === userId && s.date === date && !s.leftAt);
  if (actualIdx === -1) return null;
  const row = data.sessions[data.sessions.length - 1 - actualIdx];
  row.leftAt = leftAt.toISOString();
  const segmentMinutes = minutesBetween(row.joinedAt, row.leftAt);
  row.totalMinutes = (row.totalMinutes || 0) + segmentMinutes;
  row.totalFocusMinutes = (row.totalFocusMinutes || 0) + segmentMinutes;
  row.sessionsCompleted = (row.sessionsCompleted || 0) + (Number(extraCompletedSessions) || 0);
  row.lastActive = leftAt.toISOString();
  data.sessions[data.sessions.length - 1 - actualIdx] = row;
  await writeRoomSessionsFallback(data);
  return row;
}

export async function upsertUserRoomStats({ roomId, userId, userName, deltaMinutes = 0, deltaSessions = 0 }) {
  const safeMinutes = Math.max(0, Number(deltaMinutes) || 0);
  const safeSessions = Math.max(0, Number(deltaSessions) || 0);
  const deltaPoints = focusPointsFromDelta({ sessionsCompleted: safeSessions, focusMinutes: safeMinutes });

  const mongo = await isMongoUsable();
  if (mongo) {
    const doc = await UserRoomStats.findOneAndUpdate(
      { userId, roomId },
      {
        $setOnInsert: { userId, roomId },
        $inc: { totalFocusMinutes: safeMinutes, sessionsCompleted: safeSessions, weeklyMinutes: safeMinutes, focusPoints: deltaPoints },
        $set: { lastActive: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    ).lean();

    await Room.findByIdAndUpdate(roomId, {
      $set: { [`focusPoints.${userId}`]: doc.focusPoints, lastActiveAt: new Date() },
    });

    return doc;
  }

  const data = await readUserRoomStatsFallback();
  data.stats = Array.isArray(data.stats) ? data.stats : [];
  const idx = data.stats.findIndex((s) => s.userId === userId && s.roomId === roomId);
  if (idx === -1) {
    data.stats.push({ id: randomUUID(), userId, roomId, userName: userName || "Student", totalFocusMinutes: safeMinutes, sessionsCompleted: safeSessions, lastActive: nowIso(), weeklyMinutes: safeMinutes, focusPoints: deltaPoints, streakDays: 0 });
  } else {
    const prev = data.stats[idx];
    data.stats[idx] = { ...prev, userName: userName || prev.userName, totalFocusMinutes: (prev.totalFocusMinutes || 0) + safeMinutes, sessionsCompleted: (prev.sessionsCompleted || 0) + safeSessions, weeklyMinutes: (prev.weeklyMinutes || 0) + safeMinutes, focusPoints: (prev.focusPoints || 0) + deltaPoints, lastActive: nowIso() };
  }
  await writeUserRoomStatsFallback(data);
  return data.stats[idx === -1 ? data.stats.length - 1 : idx];
}

export async function getRoomStats(roomId) {
  const mongo = await isMongoUsable();
  if (mongo) {
    return UserRoomStats.find({ roomId }).sort({ focusPoints: -1, totalFocusMinutes: -1 }).lean();
  }
  const data = await readUserRoomStatsFallback();
  return (Array.isArray(data.stats) ? data.stats : []).filter((s) => s.roomId === roomId).sort((a, b) => (b.focusPoints || 0) - (a.focusPoints || 0));
}

export async function getMyRoomStats(roomId, userId) {
  const mongo = await isMongoUsable();
  if (mongo) {
    return UserRoomStats.findOne({ roomId, userId }).lean();
  }
  const data = await readUserRoomStatsFallback();
  return (Array.isArray(data.stats) ? data.stats : []).find((s) => s.roomId === roomId && s.userId === userId) || null;
}

export async function getLeaderboard(roomId) {
  const stats = await getRoomStats(roomId);
  return stats.map((row) => ({
    userId: row.userId,
    userName: row.userName || row.name || "Student",
    points: Number(row.focusPoints) || 0,
    sessionsCompleted: Number(row.sessionsCompleted) || 0,
    totalFocusMinutes: Number(row.totalFocusMinutes) || 0,
    streakDays: Number(row.streakDays) || 0,
  }));
}

export async function getWeeklyRoomSummary(roomId) {
  const start = startOfWeek();
  const mongo = await isMongoUsable();
  if (mongo) {
    const sessions = await RoomSession.find({ roomId, joinedAt: { $gte: start } }).lean();
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);
    const uniqueMembers = new Set(sessions.map((s) => s.userId)).size;
    return { totalMinutes, memberCount: uniqueMembers, sessionsCount: sessions.length };
  }
  const data = await readRoomSessionsFallback();
  const list = Array.isArray(data.sessions) ? data.sessions : [];
  const sessions = list.filter((s) => s.roomId === roomId && new Date(s.joinedAt) >= start);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);
  const uniqueMembers = new Set(sessions.map((s) => s.userId)).size;
  return { totalMinutes, memberCount: uniqueMembers, sessionsCount: sessions.length };
}

export async function getWeeklyUserSummary(userId) {
  const start = startOfWeek();
  const mongo = await isMongoUsable();
  if (mongo) {
    const sessions = await RoomSession.find({ userId, joinedAt: { $gte: start } }).lean();
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);
    const sessionsCompleted = sessions.reduce((sum, s) => sum + (s.sessionsCompleted || 0), 0);
    const roomSet = new Set(sessions.map((s) => s.roomId));
    const byDay = {};
    for (const s of sessions) {
      const key = new Date(s.joinedAt).toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + (s.totalMinutes || 0);
    }
    let productiveDay = null;
    let max = 0;
    for (const [day, mins] of Object.entries(byDay)) {
      if (mins > max) { max = mins; productiveDay = day; }
    }
    return { totalMinutes, sessionsCompleted, goalsWorkedOn: roomSet.size, productiveDay, comparisonPercent: 0 };
  }
  const data = await readRoomSessionsFallback();
  const list = (Array.isArray(data.sessions) ? data.sessions : []).filter((s) => s.userId === userId && new Date(s.joinedAt) >= start);
  const totalMinutes = list.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);
  const sessionsCompleted = list.reduce((sum, s) => sum + (s.sessionsCompleted || 0), 0);
  const roomSet = new Set(list.map((s) => s.roomId));
  return { totalMinutes, sessionsCompleted, goalsWorkedOn: roomSet.size, productiveDay: null, comparisonPercent: 0 };
}

export async function getWeeklyRoomContribution(userId) {
  const start = startOfWeek();
  const rooms = await listRoomsMerged();
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]));

  const mongo = await isMongoUsable();
  if (mongo) {
    const sessions = await RoomSession.find({ userId, joinedAt: { $gte: start } }).lean();
    const grouped = new Map();
    for (const session of sessions) {
      const key = String(session.roomId || "");
      if (!key) continue;
      const prev = grouped.get(key) || { roomId: key, totalMinutes: 0, sessionsCompleted: 0 };
      prev.totalMinutes += Number(session.totalFocusMinutes ?? session.totalMinutes ?? 0);
      prev.sessionsCompleted += Number(session.sessionsCompleted || 0);
      grouped.set(key, prev);
    }
    return [...grouped.values()].map((row) => ({ ...row, roomName: roomNameById.get(row.roomId) || "Unknown room" })).sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
  }

  const data = await readRoomSessionsFallback();
  const sessions = (Array.isArray(data.sessions) ? data.sessions : []).filter((s) => s.userId === userId && new Date(s.joinedAt) >= start);
  const grouped = new Map();
  for (const session of sessions) {
    const key = String(session.roomId || "");
    if (!key) continue;
    const prev = grouped.get(key) || { roomId: key, totalMinutes: 0, sessionsCompleted: 0 };
    prev.totalMinutes += Number(session.totalFocusMinutes ?? session.totalMinutes ?? 0);
    prev.sessionsCompleted += Number(session.sessionsCompleted || 0);
    grouped.set(key, prev);
  }
  return [...grouped.values()].map((row) => ({ ...row, roomName: roomNameById.get(row.roomId) || "Unknown room" })).sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
}

export async function markRoomActivity(roomId) {
  if (!roomId) return;
  const mongo = await isMongoUsable();
  if (mongo) {
    await Room.findByIdAndUpdate(roomId, { $set: { lastActiveAt: new Date(), isActive: true }, $inc: { activityScore: 1 } });
    return;
  }
  const { rooms } = await readFileStore();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return;
  rooms[idx] = { ...rooms[idx], lastActiveAt: nowIso(), isActive: true, activityScore: (rooms[idx].activityScore || 0) + 1 };
  await writeFileStore({ rooms });
}
