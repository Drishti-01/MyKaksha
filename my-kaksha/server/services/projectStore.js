import { randomUUID } from "node:crypto";
import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

const projectsFile = resolveDataFile("projects.json");
const ALLOWED_STATUSES = new Set(["In Progress", "Completed"]);

function normalizeTechnologies(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  return list.map((item) => item.trim()).filter(Boolean);
}

function normalizeProject(project = {}) {
  return {
    title: String(project.title || "").trim(),
    description: String(project.description || "").trim(),
    startDate: String(project.startDate || "").trim(),
    endDate: String(project.endDate || "").trim(),
    technologies: normalizeTechnologies(project.technologies),
    status: ALLOWED_STATUSES.has(project.status) ? project.status : "In Progress",
    link: String(project.link || "").trim(),
  };
}

function normalizeProjectContainer(payload) {
  return {
    users: payload?.users && typeof payload.users === "object" ? payload.users : {},
  };
}

export async function readProjectsForUser(userId) {
  const payload = await readJsonFile(projectsFile, { users: {} });
  const container = normalizeProjectContainer(payload);
  const userProjects = Array.isArray(container.users[userId]) ? container.users[userId] : [];
  return userProjects.map((project) => ({
    ...normalizeProject(project),
    id: String(project.id || ""),
    createdAt: project.createdAt || "",
    updatedAt: project.updatedAt || "",
  }));
}

export async function createProjectForUser(userId, project) {
  const payload = await readJsonFile(projectsFile, { users: {} });
  const container = normalizeProjectContainer(payload);
  const existingProjects = Array.isArray(container.users[userId]) ? container.users[userId] : [];
  const now = new Date().toISOString();

  const nextProject = {
    id: randomUUID(),
    ...normalizeProject(project),
    createdAt: now,
    updatedAt: now,
  };

  container.users[userId] = [...existingProjects, nextProject];
  await writeJsonFile(projectsFile, container);
  return nextProject;
}

export async function replaceProjectForUser(userId, projectId, project) {
  const payload = await readJsonFile(projectsFile, { users: {} });
  const container = normalizeProjectContainer(payload);
  const existingProjects = Array.isArray(container.users[userId]) ? container.users[userId] : [];
  const projectIndex = existingProjects.findIndex((entry) => entry.id === projectId);

  if (projectIndex === -1) {
    return null;
  }

  const previous = existingProjects[projectIndex];
  const nextProject = {
    id: previous.id,
    createdAt: previous.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...normalizeProject(project),
  };

  existingProjects[projectIndex] = nextProject;
  container.users[userId] = existingProjects;
  await writeJsonFile(projectsFile, container);
  return nextProject;
}

export async function patchProjectStatusForUser(userId, projectId, status) {
  const payload = await readJsonFile(projectsFile, { users: {} });
  const container = normalizeProjectContainer(payload);
  const existingProjects = Array.isArray(container.users[userId]) ? container.users[userId] : [];
  const projectIndex = existingProjects.findIndex((entry) => entry.id === projectId);

  if (projectIndex === -1) {
    return null;
  }

  existingProjects[projectIndex] = {
    ...existingProjects[projectIndex],
    status: ALLOWED_STATUSES.has(status) ? status : "In Progress",
    updatedAt: new Date().toISOString(),
  };

  container.users[userId] = existingProjects;
  await writeJsonFile(projectsFile, container);
  return existingProjects[projectIndex];
}

export async function deleteProjectForUser(userId, projectId) {
  const payload = await readJsonFile(projectsFile, { users: {} });
  const container = normalizeProjectContainer(payload);
  const existingProjects = Array.isArray(container.users[userId]) ? container.users[userId] : [];
  const nextProjects = existingProjects.filter((entry) => entry.id !== projectId);

  if (nextProjects.length === existingProjects.length) {
    return false;
  }

  container.users[userId] = nextProjects;
  await writeJsonFile(projectsFile, container);
  return true;
}
