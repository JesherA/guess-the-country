import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { getDefaultUserId } from "../data/defaultUser.js";
import { getCountryByIso, getBorderGeometry, getRandomCountryIso } from "../data/countryStore.js";
import { borderDistanceKm } from "../geo/distance.js";
import type { GameStateResponse, GuessResponse, StartGameResponse } from "@guess-the-country/shared";

export const gamesRouter = Router();

gamesRouter.post("/", async (_req, res) => {
  const userId = await getDefaultUserId();
  const targetCountryIso = getRandomCountryIso();

  const game = await prisma.game.create({ data: { userId, targetCountryIso } });

  const body: StartGameResponse = { gameId: game.id };
  res.status(201).json(body);
});

const guessBodySchema = z.object({ countryIso: z.string().min(2).max(2) });

gamesRouter.post("/:id/guesses", async (req, res) => {
  const parsed = guessBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "countryIso is required" });
    return;
  }

  const countryIso = parsed.data.countryIso.toUpperCase();
  if (!getCountryByIso(countryIso)) {
    res.status(400).json({ error: `Unknown country: ${countryIso}` });
    return;
  }

  const game = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.completedAt) {
    res.status(409).json({ error: "Game already completed" });
    return;
  }

  const isCorrect = countryIso === game.targetCountryIso;
  let distanceKm = 0;
  if (!isCorrect) {
    const guessGeometry = getBorderGeometry(countryIso);
    const targetGeometry = getBorderGeometry(game.targetCountryIso);
    if (!guessGeometry || !targetGeometry) {
      res.status(500).json({ error: "Missing border geometry" });
      return;
    }
    distanceKm = Math.round(borderDistanceKm(guessGeometry, targetGeometry));
  }

  const sequenceNumber = game.guessCount + 1;

  await prisma.guess.create({
    data: { gameId: game.id, sequenceNumber, guessedCountryIso: countryIso, distanceKm },
  });
  await prisma.game.update({
    where: { id: game.id },
    data: {
      guessCount: sequenceNumber,
      won: isCorrect,
      completedAt: isCorrect ? new Date() : null,
    },
  });

  const body: GuessResponse = { countryIso, distanceKm, isCorrect, guessCount: sequenceNumber };
  res.json(body);
});

gamesRouter.get("/:id", async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { id: req.params.id },
    include: { guesses: { orderBy: { sequenceNumber: "asc" } } },
  });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const body: GameStateResponse = {
    gameId: game.id,
    won: game.won,
    guesses: game.guesses.map((g) => ({
      countryIso: g.guessedCountryIso,
      distanceKm: g.distanceKm,
      isCorrect: g.guessedCountryIso === game.targetCountryIso,
      guessCount: g.sequenceNumber,
    })),
    targetCountryIso: game.won ? game.targetCountryIso : undefined,
  };
  res.json(body);
});
