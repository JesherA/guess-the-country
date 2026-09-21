import { useMemo } from "react";
import { useCountries } from "./hooks/useCountries";
import { useGame } from "./hooks/useGame";
import { GameHeader } from "./components/GameHeader";
import { GuessInput } from "./components/GuessInput";
import { GuessList } from "./components/GuessList";
import { WorldMap } from "./map/WorldMap";
import "./App.css";

function App() {
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const { gameState, isLoadingGame, isStartingGame, newGame, submitGuess, isGuessing, guessError } = useGame();

  const guessedIsos = useMemo(
    () => new Set(gameState?.guesses.map((g) => g.countryIso) ?? []),
    [gameState]
  );

  if (isLoadingCountries || isLoadingGame || isStartingGame || !gameState) {
    return (
      <main className="app app--centered">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="app">
      <GameHeader
        guessCount={gameState.guesses.length}
        won={gameState.won}
        targetCountryIso={gameState.targetCountryIso}
        countries={countries ?? []}
        onNewGame={newGame}
      />

      {!gameState.won && (
        <GuessInput
          countries={countries ?? []}
          guessedIsos={guessedIsos}
          disabled={isGuessing}
          onGuess={submitGuess}
        />
      )}
      {guessError && <p className="app__error">{guessError.message}</p>}

      <WorldMap guesses={gameState.guesses} />

      <GuessList guesses={gameState.guesses} countries={countries ?? []} />
    </main>
  );
}

export default App;
