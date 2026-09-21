import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { CountryMeta } from "@guess-the-country/shared";
import "./GuessInput.css";

const MIN_QUERY_LENGTH = 3;
const MAX_SUGGESTIONS = 8;

interface GuessInputProps {
  countries: CountryMeta[];
  guessedIsos: Set<string>;
  disabled?: boolean;
  onGuess: (iso: string) => void;
}

export function GuessInput({ countries, guessedIsos, disabled, onGuess }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < MIN_QUERY_LENGTH) return [];

    return countries
      .filter((c) => !guessedIsos.has(c.iso))
      .filter((c) => c.name.toLowerCase().includes(q) || c.aliases.some((a) => a.includes(q)))
      .slice(0, MAX_SUGGESTIONS);
  }, [query, countries, guessedIsos]);

  function pick(country: CountryMeta) {
    onGuess(country.iso);
    setQuery("");
    setActiveIndex(0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="guess-input">
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder="Type a country name..."
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        aria-label="Guess a country"
        aria-autocomplete="list"
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <ul className="guess-input__suggestions" role="listbox">
          {suggestions.map((c, i) => (
            <li
              key={c.iso}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? "active" : undefined}
              onMouseDown={() => pick(c)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
