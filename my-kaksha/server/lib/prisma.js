// Prisma client singleton — PostgreSQL only (Study Resources feature)
// Concept — PostgreSQL + Prisma (evaluation showcase, separate from MongoDB)

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isPrismaConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
