import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString =
  process.env.DATABASE_URL ??
  // Allows `next build` to typecheck/compile without a real DB.
  // Replace with your real DATABASE_URL at runtime.
  "postgresql://user:pass@localhost:5432/db?schema=public";

const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

// Prevent exhausting DB connections during dev/hot-reload.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

