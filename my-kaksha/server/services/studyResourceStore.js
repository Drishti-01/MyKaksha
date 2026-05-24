// Study Resources — PostgreSQL via Prisma (isolated from MongoDB)

import { createHttpError } from "../utils/httpError.js";
import { isPrismaConfigured, prisma } from "../lib/prisma.js";

const DEFAULT_CATEGORIES = [
  { name: "Videos", slug: "videos" },
  { name: "Articles", slug: "articles" },
  { name: "Documentation", slug: "docs" },
  { name: "Other", slug: "other" },
];

function assertPrismaReady() {
  if (!isPrismaConfigured()) {
    throw createHttpError(
      503,
      "PostgreSQL is not configured. Add DATABASE_URL to .env and run: npx prisma migrate dev"
    );
  }
}

export async function checkPostgresConnection() {
  if (!isPrismaConfigured()) {
    return { configured: false, connected: false };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { configured: true, connected: true };
  } catch (error) {
    return { configured: true, connected: false, error: error.message };
  }
}

export async function ensureDefaultCategories() {
  assertPrismaReady();

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.resourceCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {},
    });
  }
}

export async function listCategories() {
  assertPrismaReady();
  await ensureDefaultCategories();

  return prisma.resourceCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listResourcesForUser(userId) {
  assertPrismaReady();
  await ensureDefaultCategories();

  return prisma.studyResource.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function createResourceForUser(userId, payload) {
  assertPrismaReady();
  await ensureDefaultCategories();

  const category = await prisma.resourceCategory.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw createHttpError(400, "Invalid category");
  }

  return prisma.studyResource.create({
    data: {
      userId,
      title: payload.title,
      url: payload.url,
      notes: payload.notes || null,
      categoryId: payload.categoryId,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateResourceForUser(userId, resourceId, payload) {
  assertPrismaReady();

  const existing = await prisma.studyResource.findFirst({
    where: { id: resourceId, userId },
  });

  if (!existing) {
    return null;
  }

  const category = await prisma.resourceCategory.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw createHttpError(400, "Invalid category");
  }

  return prisma.studyResource.update({
    where: { id: resourceId },
    data: {
      title: payload.title,
      url: payload.url,
      notes: payload.notes || null,
      categoryId: payload.categoryId,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function deleteResourceForUser(userId, resourceId) {
  assertPrismaReady();

  const result = await prisma.studyResource.deleteMany({
    where: { id: resourceId, userId },
  });

  return result.count > 0;
}

export async function countResourcesByCategory(userId) {
  assertPrismaReady();

  return prisma.studyResource.groupBy({
    by: ["categoryId"],
    where: { userId },
    _count: { _all: true },
  });
}
