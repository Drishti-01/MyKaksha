// All fetch calls use cache: 'no-store' to prevent 304 "Not Modified" responses
// Without this, the browser caches GET responses and returns stale data

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  if (payload?.success === false) {
    const err = new Error(payload?.message || "Request failed");
    throw err;
  }
  return payload?.data ?? payload;
}

const NO_CACHE = { credentials: "include", cache: "no-store" };

export async function fetchRoomsList() {
  const response = await fetch("/api/rooms", NO_CACHE);
  return parseJson(response);
}

export async function fetchMyRoomsApi() {
  const response = await fetch("/api/rooms/my-rooms", NO_CACHE);
  return parseJson(response);
}

export async function createRoomApi(body) {
  const response = await fetch("/api/rooms", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

export async function fetchRoomDetail(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, NO_CACHE);
  return parseJson(response);
}

export async function joinRoomByCodeApi(code) {
  const response = await fetch(`/api/rooms/join/${encodeURIComponent(code)}`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function leaveRoomApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  return parseJson(response);
}

export async function fetchRoomMessages(roomId, before) {
  const q = before ? `?before=${encodeURIComponent(before)}` : "";
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages${q}`, NO_CACHE);
  return parseJson(response);
}

export async function sendRoomMessageApi(roomId, content, type = "user") {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, type }),
  });
  return parseJson(response);
}

export async function saveRoomNotesApi(roomId, content) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/notes`, {
    method: "PUT",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return parseJson(response);
}

export async function fetchRoomNotesApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/notes`, NO_CACHE);
  return parseJson(response);
}

export async function fetchRoomStatsApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/stats`, NO_CACHE);
  return parseJson(response);
}

export async function fetchRoomStudyTimesApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/study-times`, NO_CACHE);
  return parseJson(response);
}

export async function fetchRoomLeaderboardApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leaderboard`, NO_CACHE);
  return parseJson(response);
}

export async function fetchMyRoomStatsApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/my-stats`, NO_CACHE);
  return parseJson(response);
}

export async function recordSessionCompleteApi(roomId, minutes = 25, sessions = 1) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/session-complete`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutesStudied: minutes, sessions }),
  });
  return parseJson(response);
}

export async function fetchWeeklySummaryApi() {
  const response = await fetch("/api/analytics/weekly-summary", NO_CACHE);
  return parseJson(response);
}

export async function fetchRoomContributionApi() {
  const response = await fetch("/api/analytics/room-contribution", NO_CACHE);
  return parseJson(response);
}
