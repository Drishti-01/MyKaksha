import {
  createRoomRecord,
  createRoomSessionEntry,
  findRoomByCode,
  findRoomById,
  getLeaderboard,
  getMyRoomStats,
  getRoomSharedNotes,
  getRoomStats,
  getWeeklyRoomSummary,
  joinRoomByCodeForUser,
  leaveRoomForUser,
  listRoomsMerged,
  markRoomActivity,
  saveRoomSharedNotes,
  upsertUserRoomStats,
  closeRoomSessionEntry,
} from "../services/roomStore.js";
import { createChatMessage, readRecentChatMessages } from "../services/chatStore.js";
import { getGlobalStudyingApproxCount, getLobbySocketCount, getVisibleOnlineCountForRoom } from "../services/studyPresenceRegistry.js";

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function fail(res, status, message) {
  res.status(status).json({ success: false, message });
}

function roomStatus(room, onlineCount) {
  const cap = 24;
  if ((room.members || []).length >= cap) return "Full";
  if (onlineCount < 2) return "Quiet";
  return "Active";
}

function toLobbyRoom(room) {
  const onlineCount = getVisibleOnlineCountForRoom(room.id);
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    focusStyle: room.focusStyle,
    code: room.code,
    memberCount: (room.members || []).length,
    onlineCount,
    status: roomStatus(room, onlineCount),
    activityScore: room.activityScore ?? 0,
    creatorName: room.createdBy?.name || "",
    memberPreview: (room.members || []).slice(0, 4),
    weeklyGoalHours: room.weeklyGoalHours ?? null,
    createdAt: room.createdAt,
    lastActiveAt: room.lastActiveAt,
  };
}

export async function listRooms(req, res) {
  const rooms = await listRoomsMerged();
  const visible = rooms.filter((room) => (
    room.type === "public" ||
    room.createdBy?.userId === req.auth.user.id ||
    (room.members || []).some((m) => m.userId === req.auth.user.id)
  ));

  const roomRows = visible.map(toLobbyRoom);

  const trendingRaw = await Promise.all(roomRows.map(async (room) => {
    const summary = await getWeeklyRoomSummary(room.id);
    return {
      ...room,
      weeklyMinutes: summary.totalMinutes,
      weeklyHours: Math.round((summary.totalMinutes / 60) * 10) / 10,
      weeklyMembers: summary.memberCount,
    };
  }));

  const trending = trendingRaw
    .sort((a, b) => (b.weeklyMinutes || 0) - (a.weeklyMinutes || 0))
    .slice(0, 3);

  const myRooms = roomRows
    .filter((r) => visible.find((x) => x.id === r.id)?.members?.some((m) => m.userId === req.auth.user.id))
    .slice(0, 3);

  const myStatsByRoom = await Promise.all(myRooms.map((r) => getMyRoomStats(r.id, req.auth.user.id)));
  const myTodayMinutes = (myStatsByRoom || []).reduce((sum, s) => sum + (s?.totalFocusMinutes || 0), 0);

  ok(res, {
    rooms: roomRows,
    trending,
    myRooms,
    myTodayMinutes,
    lobbyLiveCount: getLobbySocketCount(),
    globalStudyingApprox: getGlobalStudyingApproxCount(),
    mostActiveToday: [...roomRows].sort((a, b) => (b.onlineCount || 0) - (a.onlineCount || 0)).slice(0, 3),
  });
}

export async function createRoom(req, res) {
  const room = await createRoomRecord({
    userId: req.auth.user.id,
    creatorName: req.auth.user.name,
    payload: req.body ?? {},
  });
  await createRoomSessionEntry({ roomId: room.id, userId: req.auth.user.id, userName: req.auth.user.name });
  ok(res, { room }, 201);
}

export async function getRoom(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");

  const isMember = (room.members || []).some((m) => m.userId === req.auth.user.id);
  const isCreator = room.createdBy?.userId === req.auth.user.id;
  if (room.type === "private" && !isMember && !isCreator) {
    return fail(res, 403, "This is a private room");
  }

  const leaderboard = await getLeaderboard(room.id);
  const roomStats = await getRoomStats(room.id);
  ok(res, {
    room: {
      ...room,
      onlineCount: getVisibleOnlineCountForRoom(room.id),
      status: roomStatus(room, getVisibleOnlineCountForRoom(room.id)),
    },
    leaderboard,
    roomStats,
  });
}

export async function joinRoomByCode(req, res) {
  const code = req.params.code;
  const room = await joinRoomByCodeForUser(req.auth.user.id, req.auth.user.name, code);
  if (!room) return fail(res, 404, "Room not found");
  await createRoomSessionEntry({ roomId: room.id, userId: req.auth.user.id, userName: req.auth.user.name });
  await markRoomActivity(room.id);
  ok(res, { room });
}

export async function leaveRoom(req, res) {
  const roomId = req.params.id;
  await closeRoomSessionEntry({ roomId, userId: req.auth.user.id });
  await leaveRoomForUser(req.auth.user.id, roomId);
  ok(res, { roomId, left: true });
}

export async function listMessages(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");
  const before = req.query.before;
  const messages = await readRecentChatMessages(room.id, 50, before);
  ok(res, { messages });
}

export async function createMessage(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");

  const content = String(req.body?.content || "").trim();
  if (!content) return fail(res, 400, "Message content is required");

  const message = await createChatMessage({
    roomId: room.id,
    userId: req.auth.user.id,
    username: req.auth.user.name,
    text: content,
    type: req.body?.type === "system" ? "system" : "user",
  });

  await markRoomActivity(room.id);
  ok(res, { message }, 201);
}

export async function saveNotes(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");
  const updated = await saveRoomSharedNotes(room.id, req.body?.content ?? "");
  ok(res, { room: updated });
}

export async function getNotes(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");
  const content = await getRoomSharedNotes(room.id);
  ok(res, { roomId: room.id, content });
}

export async function getRoomStatsController(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");
  const stats = await getRoomStats(room.id);
  ok(res, { roomId: room.id, stats });
}

export async function getMyRoomStatsController(req, res) {
  const room = await findRoomById(req.params.id);
  if (!room) return fail(res, 404, "Room not found");
  const stats = await getMyRoomStats(room.id, req.auth.user.id);
  ok(res, { roomId: room.id, stats: stats || null });
}

export async function trackSessionComplete(req, res) {
  const roomId = req.params.id;
  const deltaSessions = Math.max(1, Number(req.body?.sessions) || 1);
  const deltaMinutes = Math.max(0, Number(req.body?.minutes) || 25);
  const stats = await upsertUserRoomStats({
    roomId,
    userId: req.auth.user.id,
    userName: req.auth.user.name,
    deltaMinutes,
    deltaSessions,
  });
  ok(res, { stats });
}
