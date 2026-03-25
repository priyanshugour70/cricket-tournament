import "dotenv/config";
import { defineConfig } from "@prisma/config";

const fallbackDatabaseUrl =
  // Used only for `prisma generate` / build-time typechecking.
  // In real runtime, set `DATABASE_URL` to your actual Postgres.
  "postgresql://user:pass@localhost:5432/db?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "pnpm run seed",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});

