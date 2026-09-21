# Express + Prisma (SQLite) API.
#
# Built from the monorepo root so npm workspaces (shared/backend/frontend)
# resolve correctly:
#   docker build -f backend/Dockerfile .

FROM node:24-bookworm-slim
WORKDIR /app

# better-sqlite3 may need to compile from source if no prebuilt binary
# matches this Node/OS/arch combination.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
# backend's postinstall runs `prisma generate`, which needs the schema —
# copied here (ahead of the rest of the source) so this layer only
# invalidates on dependency or schema changes, not on every source edit.
COPY backend/prisma backend/prisma
COPY backend/prisma.config.ts backend/prisma.config.ts
RUN npm ci

COPY shared shared
COPY backend backend

RUN npm run build:data -w backend
RUN npm run build -w backend

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 3001

# Runs on every container start, not just on deploy: the free plan's
# filesystem is ephemeral, so the SQLite file needs to be (re)created each
# time a fresh container boots, not only when a new image is deployed.
# Both steps are idempotent (migrate deploy only applies pending migrations;
# the seed script checks for an existing default user before creating one).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/index.js"]
