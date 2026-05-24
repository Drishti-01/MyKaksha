// Study Resources API — PostgreSQL + Prisma only (no MongoDB)

import { createHttpError } from "../utils/httpError.js";
import {
  checkPostgresConnection,
  countResourcesByCategory,
  createResourceForUser,
  deleteResourceForUser,
  listCategories,
  listResourcesForUser,
  updateResourceForUser,
} from "../services/studyResourceStore.js";

function ok(res, data, status = 200) {
  res.status(status).json({ ok: true, ...data });
}

export async function getPostgresStatus(_req, res) {
  const status = await checkPostgresConnection();
  ok(res, { postgres: status });
}

export async function listResourceCategories(req, res) {
  const categories = await listCategories();
  ok(res, { categories });
}

export async function listStudyResources(req, res) {
  const resources = await listResourcesForUser(req.auth.user.id);
  ok(res, { resources });
}

export async function createStudyResource(req, res) {
  const resource = await createResourceForUser(req.auth.user.id, req.validatedStudyResource);
  ok(res, { resource }, 201);
}

export async function updateStudyResource(req, res) {
  const resource = await updateResourceForUser(
    req.auth.user.id,
    req.params.resourceId,
    req.validatedStudyResource
  );

  if (!resource) {
    throw createHttpError(404, "Resource not found");
  }

  ok(res, { resource });
}

export async function deleteStudyResource(req, res) {
  const deleted = await deleteResourceForUser(req.auth.user.id, req.params.resourceId);

  if (!deleted) {
    throw createHttpError(404, "Resource not found");
  }

  ok(res, { deleted: true });
}

export async function getResourceStats(req, res) {
  const grouped = await countResourcesByCategory(req.auth.user.id);
  ok(res, { stats: grouped });
}
