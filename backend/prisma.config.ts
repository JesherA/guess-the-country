import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

if (existsSync(new URL("./.env", import.meta.url))) {
  process.loadEnvFile(new URL("./.env", import.meta.url));
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
