# Guess the Country

A daily-Wordle-style geography game: guess the target country and get back the distance (in km) from your guess's border to the target's border, plus a color-scaled world map showing how close each of your guesses was.

## Tech stack

**Monorepo:** npm workspaces (`backend`, `frontend`, `shared`), single root `package-lock.json`.

**Backend** (`backend/`)
- Node.js + TypeScript (ESM, `NodeNext`)
- Express 5 for the HTTP API
- Prisma 7 ORM + `better-sqlite3` (SQLite) for persistence (`User` / `Game` / `Guess` models)
- Zod for request validation
- Turf.js (`@turf/*`) for geospatial math — border-to-border distance between countries
- `world-atlas` + `topojson-client` for country border geometry, `i18n-iso-countries` for name/ISO lookups
- `tsx` for running TypeScript directly in dev

**Frontend** (`frontend/`)
- React 19 + TypeScript
- Vite 8 as the build tool/dev server
- TanStack Query for server-state management (game/guess API calls)
- `react-simple-maps` + `d3-scale` for the interactive, distance-colored world map
- `oxlint` for linting

**Shared** (`shared/`)
- Plain TypeScript package with types shared between backend and frontend (e.g. API response shapes like `StartGameResponse`, `GuessResponse`, `GameStateResponse`)

## How it works

1. `POST /api/games` starts a new game and picks a random target country.
2. `POST /api/games/:id/guesses` accepts a guessed country ISO code, computes the border-to-border distance to the target via Turf, and records the guess.
3. `GET /api/games/:id` returns the game state and guess history.
4. `GET /api/countries` returns country metadata (name/ISO/aliases) for the guess autocomplete — never geometry.

## Prerequisites

- Node.js 24+ (the repo was built/tested on v24.15.0)
- npm (workspaces are used, so install from the repo root)

## Setup

```bash
# from the repo root — installs and links backend, frontend, and shared
npm install
```

Create local env files (values already match the defaults, so copying is usually enough):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- `backend/.env`: `DATABASE_URL` (SQLite file path) and `PORT` (defaults to `3001`)
- `frontend/.env`: `VITE_API_URL` (backend URL, defaults to `http://localhost:3001`)

Set up the database (SQLite, via Prisma) and seed the default user:

```bash
npm run prisma:migrate -w backend
npm run prisma:seed -w backend
```

Build the static country data the backend serves (border geometry, names, ISO codes):

```bash
npm run build:data -w backend
```

## Running the app

Run backend and frontend in two separate terminals:

```bash
# terminal 1 — API server on http://localhost:3001
npm run dev -w backend

# terminal 2 — Vite dev server, defaults to http://localhost:5173
npm run dev -w frontend
```

Then open the frontend URL printed by Vite in your browser.

## Other useful scripts

| Command | Location | What it does |
|---|---|---|
| `npm run build -w backend` | backend | Type-checks and compiles to `dist/` |
| `npm run start -w backend` | backend | Runs the compiled server (`dist/index.js`) |
| `npm run build -w frontend` | frontend | Type-checks and builds a production bundle |
| `npm run preview -w frontend` | frontend | Serves the production build locally |
| `npm run lint -w frontend` | frontend | Runs oxlint |
