/**
 * Prisma client singleton.
 * Prevents multiple instances in development (hot-reload).
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function assertGeneratedClient(client: PrismaClient) {
  // Stale global singleton (dev hot-reload) or missing `prisma generate` leaves delegates undefined →
  // "Cannot read properties of undefined (reading 'create')" on dsarRequest.create etc.
  const c = client as unknown as {
    dsarRequest?: { create?: unknown };
    dsarActivity?: { create?: unknown };
  };
  if (typeof c.dsarRequest?.create !== "function" || typeof c.dsarActivity?.create !== "function") {
    throw new Error(
      "[Custodia] Prisma client is out of date (missing DSAR models). Run: npx prisma generate — then fully restart the dev server (stop Node, not only refresh).",
    );
  }
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

assertGeneratedClient(prisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const db = prisma;
