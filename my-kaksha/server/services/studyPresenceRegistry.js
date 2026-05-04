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

const STATUS_PRIORITY = {
  offline: 0,
  invisible: 0,
  away: 1,
  online: 2,
  break: 3,
  focusing: 4,
};

function ensureRoomMap(roomId) {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }
  return roomPresence.get(roomId);
}

function statusPriority(status) {
  return STATUS_PRIORITY[status] ?? STATUS_PRIORITY.online;
}

function displayStatusForViewer(meta, isSelf) {
  if (isSelf) {
    return meta.status === "invisible" ? "offline" : meta.status;
  }
  // "Hide online status" does not apply inside a shared room — people studying together
  // should see who is present; only explicit invisible is hidden from peers.
  if (meta.status === "invisible") return "offline";
  if (!meta.showFocus && (meta.status === "focusing" || meta.status === "break")) {
    return "online";
  }
  return meta.status;
}

function aggregateRoomMembers(roomId, viewerSocketId) {
  const map = roomPresence.get(roomId);
  if (!map) return [];

  const viewerUserId = map.get(viewerSocketId)?.userId || "";
  const byUserId = new Map();

  for (const meta of map.values()) {
    const userId = String(meta.userId || meta.socketId || "");
    if (!userId) continue;

    const isSelf = Boolean(viewerUserId) && userId === viewerUserId;
    const displayedStatus = displayStatusForViewer(meta, isSelf);
    const current = byUserId.get(userId);

    if (!current) {
      byUserId.set(userId, {
        socketId: meta.socketId,
        userId,
        name: meta.name,
        status: displayedStatus,
        appearInLeaderboard: meta.appearInLeaderboard !== false,
        isSelf,
        _priority: statusPriority(displayedStatus),
      });
      continue;
    }

    const nextPriority = statusPriority(displayedStatus);
    const shouldReplaceStatus = nextPriority > current._priority;

    byUserId.set(userId, {
      ...current,
      socketId: meta.socketId || current.socketId,
      name: meta.name || current.name,
      status: shouldReplaceStatus ? displayedStatus : current.status,
      appearInLeaderboard: current.appearInLeaderboard || meta.appearInLeaderboard !== false,
      isSelf: current.isSelf || isSelf,
      _priority: shouldReplaceStatus ? nextPriority : current._priority,
    });
  }

  return [...byUserId.values()].map(({ _priority, ...member }) => member);
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

/** Count of unique users actually in study rooms (not just browsing lobby).
 * Lobby browsers are excluded — only users who have joined a room are counted. */
export function getGlobalStudyingApproxCount() {
  let count = 0;
  for (const roomId of roomPresence.keys()) {
    const visibleMembers = aggregateRoomMembers(roomId, "");
    count += visibleMembers.filter((member) => member.status !== "offline").length;
  }
  return count;
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

export function updateMemberPrivacy(roomId, socketId, privacy = {}) {
  const map = roomPresence.get(roomId);
  if (!map?.has(socketId)) return;
  const prev = map.get(socketId);
  map.set(socketId, {
    ...prev,
    showOnline: privacy.showOnline !== false,
    showFocus: privacy.showFocus !== false,
    appearInLeaderboard: privacy.appearInLeaderboard !== false,
  });
}

export function getRoomMembersForClient(roomId, viewerSocketId) {
  return aggregateRoomMembers(roomId, viewerSocketId);
}

export function getVisibleOnlineCountForRoom(roomId) {
  return aggregateRoomMembers(roomId, "").filter((member) => member.status !== "offline").length;
}

export function getPresenceStripCounts(roomId) {
  const members = aggregateRoomMembers(roomId, "");
  let focusing = 0;
  let onBreak = 0;
  let away = 0;
  let online = 0;
  for (const member of members) {
    if (member.status === "offline") continue;
    if (member.status === "focusing") focusing += 1;
    else if (member.status === "break") onBreak += 1;
    else if (member.status === "away") away += 1;
    else online += 1;
  }
  return { focusing, onBreak, away, online };
}
