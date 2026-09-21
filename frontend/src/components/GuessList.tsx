import { useMemo } from "react";
import type { CountryMeta, GuessResponse } from "@guess-the-country/shared";
import "./GuessList.css";

interface GuessListProps {
  guesses: GuessResponse[];
  countries: CountryMeta[];
}

export function GuessList({ guesses, countries }: GuessListProps) {
  const nameByIso = useMemo(() => new Map(countries.map((c) => [c.iso, c.name])), [countries]);

  if (guesses.length === 0) {
    return <p className="guess-list__empty">Your guesses will show up here.</p>;
  }

  const closestFirst = [...guesses].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <table className="guess-list">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Country</th>
          <th>Distance</th>
          <th>Guess #</th>
        </tr>
      </thead>
      <tbody>
        {closestFirst.map((g, i) => (
          <tr key={g.guessCount} className={g.isCorrect ? "guess-list__correct" : undefined}>
            <td>{i + 1}</td>
            <td>{nameByIso.get(g.countryIso) ?? g.countryIso}</td>
            <td>{g.isCorrect ? "Correct!" : `${g.distanceKm.toLocaleString()} km`}</td>
            <td className="guess-list__muted">{g.guessCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
