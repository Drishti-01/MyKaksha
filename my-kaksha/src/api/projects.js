async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function fetchProjects() {
  const response = await fetch("/api/projects", {
    credentials: "include",
  });

  const payload = await parseResponse(response);
  return Array.isArray(payload.projects) ? payload.projects : [];
}

export async function createProject(payload) {
  const response = await fetch("/api/projects", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);
  return parsed.project;
}

export async function replaceProject(projectId, payload) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);
  return parsed.project;
}

export async function patchProjectStatus(projectId, status) {
  const response = await fetch(`/api/projects/${projectId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const parsed = await parseResponse(response);
  return parsed.project;
}

export async function removeProject(projectId) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
    credentials: "include",
  });

  await parseResponse(response);
}
