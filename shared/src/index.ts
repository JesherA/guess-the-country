// Types shared between the backend API and the frontend client.

export interface CountryMeta {
  /** ISO 3166-1 alpha-2 code, used as the stable id everywhere */
  iso: string;
  iso3: string;
  name: string;
  /** Alternate names/spellings that should also match this country when guessing */
  aliases: string[];
}

export interface StartGameResponse {
  gameId: string;
}

export interface GuessRequest {
  countryIso: string;
}

export interface GuessResponse {
  countryIso: string;
  distanceKm: number;
  isCorrect: boolean;
  guessCount: number;
}

export interface GameStateResponse {
  gameId: string;
  won: boolean;
  guesses: GuessResponse[];
  /** Only populated once the game has been won (or otherwise revealed) */
  targetCountryIso?: string;
}

export interface StatsResponse {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  averageGuesses: number;
  currentStreak: number;
  bestStreak: number;
}
