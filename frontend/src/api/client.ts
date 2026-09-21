import type { CountryMeta, GameStateResponse, GuessResponse, StartGameResponse } from "@guess-the-country/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getCountries(): Promise<CountryMeta[]> {
  return request("/api/countries");
}

export function startGame(): Promise<StartGameResponse> {
  return request("/api/games", { method: "POST" });
}

export function submitGuess(gameId: string, countryIso: string): Promise<GuessResponse> {
  return request(`/api/games/${gameId}/guesses`, {
    method: "POST",
    body: JSON.stringify({ countryIso }),
  });
}

export function getGameState(gameId: string): Promise<GameStateResponse> {
  return request(`/api/games/${gameId}`);
}
