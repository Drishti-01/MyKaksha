async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.error || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return payload;
}

export async function fetchRoomsList() {
  const response = await fetch("/api/rooms", { credentials: "include" });
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

export async function fetchRoomMessages(roomId) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
    credentials: "include",
  });
  return parseJson(response);
}

export async function saveRoomNotesApi(roomId, content) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/notes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return parseJson(response);
}

export async function addFocusPointApi(roomId, delta = 1) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/focus-point`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  return parseJson(response);
}
