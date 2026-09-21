import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GameStateResponse } from "@guess-the-country/shared";
import { getGameState, startGame, submitGuess } from "../api/client";

const STORAGE_KEY = "guess-the-country:gameId";

export function useGame() {
  const queryClient = useQueryClient();
  const [gameId, setGameId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const gameQuery = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGameState(gameId!),
    enabled: gameId !== null,
  });

  const startGameMutation = useMutation({
    mutationFn: startGame,
    onSuccess: ({ gameId: newGameId }) => {
      localStorage.setItem(STORAGE_KEY, newGameId);
      queryClient.setQueryData<GameStateResponse>(["game", newGameId], {
        gameId: newGameId,
        won: false,
        guesses: [],
      });
      setGameId(newGameId);
    },
  });

  const guessMutation = useMutation({
    mutationFn: (countryIso: string) => submitGuess(gameId!, countryIso),
    onSuccess: (guess) => {
      queryClient.setQueryData<GameStateResponse>(["game", gameId], (old) => ({
        gameId: gameId!,
        won: guess.isCorrect,
        guesses: [...(old?.guesses ?? []), guess],
        targetCountryIso: guess.isCorrect ? guess.countryIso : undefined,
      }));
    },
  });

  // First-ever visit: no game yet, start one automatically.
  useEffect(() => {
    if (gameId === null && !startGameMutation.isPending) {
      startGameMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  function newGame() {
    localStorage.removeItem(STORAGE_KEY);
    setGameId(null);
    startGameMutation.mutate();
  }

  return {
    gameState: gameQuery.data,
    isLoadingGame: gameId !== null && gameQuery.isLoading,
    isStartingGame: startGameMutation.isPending,
    newGame,
    submitGuess: guessMutation.mutate,
    isGuessing: guessMutation.isPending,
    guessError: guessMutation.error,
  };
}
