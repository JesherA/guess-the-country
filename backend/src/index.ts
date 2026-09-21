import "./env.js";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { getAllCountries } from "./data/countryStore.js";
import { gamesRouter } from "./routes/games.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Metadata only (name/iso/aliases) for the guess autocomplete list — never geometry.
app.get("/api/countries", (_req, res) => {
  res.json(getAllCountries());
});

app.use("/api/games", gamesRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
