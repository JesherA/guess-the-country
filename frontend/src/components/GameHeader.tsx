import type { CountryMeta } from "@guess-the-country/shared";
import "./GameHeader.css";

interface GameHeaderProps {
  guessCount: number;
  won: boolean;
  revealed: boolean;
  targetCountryIso: string | undefined;
  countries: CountryMeta[];
  onNewGame: () => void;
}

export function GameHeader({ guessCount, won, revealed, targetCountryIso, countries, onNewGame }: GameHeaderProps) {
  const targetName = countries.find((c) => c.iso === targetCountryIso)?.name ?? targetCountryIso;

  return (
    <div className="game-header">
      <div>
        <h1>Guess the Country</h1>
        {won ? (
          <p className="game-header__banner">
            You got it — <strong>{targetName}</strong> — in {guessCount} {guessCount === 1 ? "guess" : "guesses"}!
          </p>
        ) : revealed ? (
          <p className="game-header__status">
            The answer was <strong>{targetName}</strong>.
          </p>
        ) : (
          <p className="game-header__status">Guesses so far: {guessCount}</p>
        )}
      </div>
      <button type="button" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
