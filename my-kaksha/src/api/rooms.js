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

export async function fetchRoomsList() {
  const response = await fetch("/api/rooms", { credentials: "include" });
  return parseJson(response);
}

export async function fetchMyRoomsApi() {
  const response = await fetch("/api/rooms/my-rooms", { credentials: "include" });
  return parseJson(response);
}

export async function createRoomApi(body) {
  const response = await fetch("/api/rooms", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

export async function fetchRoomDetail(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function joinRoomByCodeApi(code) {
  const response = await fetch(`/api/rooms/join/${encodeURIComponent(code)}`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson(response);
}

export async function leaveRoomApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchRoomMessages(roomId, before) {
  const q = before ? `?before=${encodeURIComponent(before)}` : "";
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages${q}`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function sendRoomMessageApi(roomId, content, type = "user") {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, type }),
  });
  return parseJson(response);
}

export async function saveRoomNotesApi(roomId, content) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/notes`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return parseJson(response);
}

export async function fetchRoomNotesApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/notes`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchRoomStatsApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/stats`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchRoomStudyTimesApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/study-times`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchRoomLeaderboardApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leaderboard`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchMyRoomStatsApi(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/my-stats`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function recordSessionCompleteApi(roomId, minutes = 25, sessions = 1) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/session-complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutesStudied: minutes, sessions }),
  });
  return parseJson(response);
}

export async function fetchWeeklySummaryApi() {
  const response = await fetch("/api/analytics/weekly-summary", {
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchRoomContributionApi() {
  const response = await fetch("/api/analytics/room-contribution", {
    credentials: "include",
  });
  return parseJson(response);
}
