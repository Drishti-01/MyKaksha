/**
 * In-memory study presence for socket-connected clients.
 * Used by GET /api/rooms (online counts) and Socket.io join/leave flows.
 * Resets on server restart.
 */

/** @typedef {'focusing'|'break'|'online'|'away'|'invisible'|'offline'} StudyStatus */

/**
 * @typedef {object} RoomMemberMeta
 * @property {string} socketId
 * @property {string} userId
 * @property {string} name
 * @property {StudyStatus} status
 * @property {boolean} showOnline
 * @property {boolean} showFocus
 * @property {boolean} appearInLeaderboard
 */

/** @type {Map<string, Map<string, RoomMemberMeta>>} */
const roomPresence = new Map();

/** @type {Set<string>} */
const lobbySocketIds = new Set();

function ensureRoomMap(roomId) {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }
  return roomPresence.get(roomId);
}

export function registerLobbySocket(socketId) {
  lobbySocketIds.add(socketId);
}

export function unregisterLobbySocket(socketId) {
  lobbySocketIds.delete(socketId);
}

export function getLobbySocketCount() {
  return lobbySocketIds.size;
}

/** Unique user count: lobby sockets + any socket present in a room (approximation for demo). */
export function getGlobalStudyingApproxCount() {
  const seen = new Set([...lobbySocketIds]);
  for (const map of roomPresence.values()) {
    for (const m of map.values()) {
      seen.add(m.socketId);
    }
  }
  return seen.size;
}

export function upsertRoomMember(roomId, meta) {
  const map = ensureRoomMap(roomId);
  map.set(meta.socketId, { ...meta });
}

export function removeRoomMember(roomId, socketId) {
  const map = roomPresence.get(roomId);
  if (!map) return;
  map.delete(socketId);
  if (map.size === 0) {
    roomPresence.delete(roomId);
  }
}

export function removeSocketEverywhere(socketId) {
  unregisterLobbySocket(socketId);
  for (const [roomId, map] of roomPresence.entries()) {
    map.delete(socketId);
    if (map.size === 0) {
      roomPresence.delete(roomId);
    }
  }
}

export function updateMemberStatus(roomId, socketId, status) {
  const map = roomPresence.get(roomId);
  if (!map?.has(socketId)) return;
  const prev = map.get(socketId);
  map.set(socketId, { ...prev, status });
}

function displayStatusForViewer(meta, isSelf) {
  if (isSelf) {
    return meta.status === "invisible" ? "offline" : meta.status;
  }
  if (!meta.showOnline) return "offline";
  if (meta.status === "invisible") return "offline";
  if (!meta.showFocus && (meta.status === "focusing" || meta.status === "break")) {
    return "online";
  }
  return meta.status;
}

export function getRoomMembersForClient(roomId, viewerSocketId) {
  const map = roomPresence.get(roomId);
  if (!map) return [];

  return [...map.values()].map((m) => {
    const isSelf = Boolean(viewerSocketId) && m.socketId === viewerSocketId;
    const status = displayStatusForViewer(m, isSelf);

    return {
      socketId: m.socketId,
      userId: m.userId,
      name: m.name,
      status,
      appearInLeaderboard: m.appearInLeaderboard,
      isSelf,
    };
  });
}

export function getVisibleOnlineCountForRoom(roomId) {
  const map = roomPresence.get(roomId);
  if (!map) return 0;
  let n = 0;
  for (const m of map.values()) {
    const status = displayStatusForViewer(m, false);
    if (status !== "offline") n += 1;
  }
  return n;
}

export function getPresenceStripCounts(roomId) {
  const members = getRoomMembersForClient(roomId, "__none__");
  let focusing = 0;
  let onBreak = 0;
  let away = 0;
  let online = 0;
  for (const m of members) {
    if (m.status === "offline") continue;
    if (m.status === "focusing") focusing += 1;
    else if (m.status === "break") onBreak += 1;
    else if (m.status === "away") away += 1;
    else online += 1;
  }
  return { focusing, onBreak, away, online };
}
