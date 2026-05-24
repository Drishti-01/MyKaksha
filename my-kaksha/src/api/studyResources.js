async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function fetchPostgresStatus() {
  const response = await fetch("/api/study-resources/status");
  const payload = await parseResponse(response);
  return payload.postgres;
}

export async function fetchResourceCategories() {
  const response = await fetch("/api/study-resources/categories", {
    credentials: "include",
  });
  const payload = await parseResponse(response);
  return Array.isArray(payload.categories) ? payload.categories : [];
}

export async function fetchStudyResources() {
  const response = await fetch("/api/study-resources", {
    credentials: "include",
  });
  const payload = await parseResponse(response);
  return Array.isArray(payload.resources) ? payload.resources : [];
}

export async function createStudyResource(body) {
  const response = await fetch("/api/study-resources", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  return payload.resource;
}

export async function updateStudyResource(resourceId, body) {
  const response = await fetch(`/api/study-resources/${resourceId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  return payload.resource;
}

export async function removeStudyResource(resourceId) {
  const response = await fetch(`/api/study-resources/${resourceId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parseResponse(response);
}
