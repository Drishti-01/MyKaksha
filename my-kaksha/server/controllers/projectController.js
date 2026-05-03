import { createHttpError } from "../utils/httpError.js";
import {
  createProjectForUser,
  deleteProjectForUser,
  patchProjectStatusForUser,
  readProjectsForUser,
  replaceProjectForUser,
} from "../services/projectStore.js";

export async function listProjects(req, res) {
  // MongoDB verified — Project.find() reads all projects for this user from MongoDB
  const projects = await readProjectsForUser(req.auth.user.id);
  res.status(200).json({ ok: true, projects });
}

export async function createProject(req, res) {
  // MongoDB verified — Project.create() saves new project to MongoDB
  const project = await createProjectForUser(req.auth.user.id, req.validatedProject);
  res.status(201).json({ ok: true, project });
}

export async function replaceProject(req, res) {
  const project = await replaceProjectForUser(req.auth.user.id, req.params.projectId, req.validatedProject);
  if (!project) {
    throw createHttpError(404, "Project not found");
  }

  res.status(200).json({ ok: true, project });
}

export async function patchProjectStatus(req, res) {
  const project = await patchProjectStatusForUser(
    req.auth.user.id,
    req.params.projectId,
    req.validatedProjectStatus
  );

  if (!project) {
    throw createHttpError(404, "Project not found");
  }

  res.status(200).json({ ok: true, project });
}

export async function deleteProject(req, res) {
  const deleted = await deleteProjectForUser(req.auth.user.id, req.params.projectId);
  if (!deleted) {
    throw createHttpError(404, "Project not found");
  }

  res.status(200).json({ ok: true });
}
