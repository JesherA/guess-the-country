import { useQuery } from "@tanstack/react-query";
import { getCountries } from "../api/client";

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
    staleTime: Infinity,
  });
}
