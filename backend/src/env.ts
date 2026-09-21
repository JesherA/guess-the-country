// Side-effect-only module: loads backend/.env into process.env.
// Import this before anything that reads process.env (e.g. the Prisma client).

import { existsSync } from "node:fs";
import path from "node:path";

// Resolved from cwd rather than __dirname — see countryStore.ts for why.
const envPath = path.join(process.cwd(), ".env");

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
