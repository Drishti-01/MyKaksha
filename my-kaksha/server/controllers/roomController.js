import {
  addFocusPoints,
  bumpRoomActivity,
  createRoomRecord,
  findRoomByCode,
  findRoomById,
  getLeaderboard,
  joinRoomByCodeForUser,
  leaveRoomForUser,
  listRoomsMerged,
  saveRoomSharedNotes,
} from "../services/roomStore.js";
import { readRecentChatMessages } from "../services/chatStore.js";
import {
  getGlobalStudyingApproxCount,
  getLobbySocketCount,
  getVisibleOnlineCountForRoom,
} from "../services/studyPresenceRegistry.js";

function roomStatus(room, onlineCount) {
  const cap = 24;
  const memberCount = (room.members || []).length;
  if (memberCount >= cap) return "Full";
  if (onlineCount < 2) return "Quiet";
  return "Active";
}

function memberPreview(room, limit = 4) {
  const members = room.members || [];
  return {
    shown: members.slice(0, limit),
    extra: Math.max(0, members.length - limit),
  };
}

export async function listRooms(req, res) {
  const rooms = await listRoomsMerged();
  const publicRooms = rooms.filter(
    (r) =>
      r.type === "public" ||
      r.createdBy === req.auth.user.id ||
      (r.members || []).includes(req.auth.user.id)
  );

  const payload = publicRooms.map((room) => {
    const onlineCount = getVisibleOnlineCountForRoom(room.id);
    const preview = memberPreview(room);
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
      creatorName: room.creatorName || "",
      memberIdsPreview: preview.shown,
      memberPreviewExtra: preview.extra,
    };
  });

  const trending = [...payload]
    .sort((a, b) => (b.activityScore || 0) - (a.activityScore || 0))
    .slice(0, 3);

  res.status(200).json({
    rooms: payload,
    trending,
    lobbyLiveCount: getLobbySocketCount(),
    globalStudyingApprox: getGlobalStudyingApproxCount(),
  });
}

export async function createRoom(req, res) {
  const room = await createRoomRecord({
    userId: req.auth.user.id,
    creatorName: req.auth.user.name,
    payload: req.body ?? {},
  });
  res.status(201).json({ room });
}

export async function getRoom(req, res) {
  const { id } = req.params;
  const room = await findRoomById(id);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const isMember = (room.members || []).includes(req.auth.user.id);
  const isCreator = room.createdBy === req.auth.user.id;
  if (room.type === "private" && !isMember && !isCreator) {
    res.status(403).json({ error: "This is a private room" });
    return;
  }

  const onlineCount = getVisibleOnlineCountForRoom(room.id);
  const leaderboard = await getLeaderboard(room.id);

  res.status(200).json({
    room: {
      ...room,
      onlineCount,
      status: roomStatus(room, onlineCount),
    },
    leaderboard,
  });
}

export async function joinRoomByCode(req, res) {
  const code = req.params.code;
  try {
    const room = await joinRoomByCodeForUser(req.auth.user.id, code);
    await bumpRoomActivity(room.id, 1);
    res.status(200).json({ room });
  } catch (e) {
    if (e.status === 404) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    throw e;
  }
}

export async function leaveRoom(req, res) {
  const { id } = req.params;
  await leaveRoomForUser(req.auth.user.id, id);
  res.status(200).json({ ok: true });
}

export async function listMessages(req, res) {
  const { id } = req.params;
  const room = await findRoomById(id);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  const messages = await readRecentChatMessages(id, 50);
  res.status(200).json({ messages });
}

export async function saveNotes(req, res) {
  const { id } = req.params;
  const room = await findRoomById(id);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  const content = req.body?.content ?? "";
  const updated = await saveRoomSharedNotes(id, content);
  res.status(200).json({ room: updated });
}

export async function awardFocusPoint(req, res) {
  const { id } = req.params;
  const delta = Number(req.body?.delta) || 1;
  await addFocusPoints(id, req.auth.user.id, delta);
  const leaderboard = await getLeaderboard(id);
  res.status(200).json({ leaderboard });
}
