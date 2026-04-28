import { ensureDatabaseConnection } from "../config/database.js";
import Project from "../models/Project.js";

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

function toClientProject(project) {
  return {
    id: project._id,
    title: project.title,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    technologies: Array.isArray(project.technologies) ? project.technologies : [],
    status: ALLOWED_STATUSES.has(project.status) ? project.status : "In Progress",
    link: project.link || "",
    createdAt: new Date(project.createdAt).toISOString(),
    updatedAt: new Date(project.updatedAt).toISOString(),
  };
}

export async function readProjectsForUser(userId) {
  await ensureDatabaseConnection();

  const projects = await Project.find({ userId }).sort({ updatedAt: -1 }).lean();
  return projects.map(toClientProject);
}

export async function createProjectForUser(userId, project) {
  await ensureDatabaseConnection();

  const nextProject = await Project.create({
    userId,
    ...normalizeProject(project),
  });

  return toClientProject(nextProject);
}

export async function replaceProjectForUser(userId, projectId, project) {
  await ensureDatabaseConnection();

  const updated = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    {
      ...normalizeProject(project),
      updatedAt: new Date(),
    },
    { new: true }
  ).lean();

  if (!updated) {
    return null;
  }

  return toClientProject(updated);
}

export async function patchProjectStatusForUser(userId, projectId, status) {
  await ensureDatabaseConnection();

  const updated = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    {
      status: ALLOWED_STATUSES.has(status) ? status : "In Progress",
      updatedAt: new Date(),
    },
    { new: true }
  ).lean();

  if (!updated) {
    return null;
  }

  return toClientProject(updated);
}

export async function deleteProjectForUser(userId, projectId) {
  await ensureDatabaseConnection();

  const result = await Project.deleteOne({ _id: projectId, userId });
  return result.deletedCount > 0;
}
