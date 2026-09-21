import { scaleLinear } from "d3-scale";

// Validated sequential blue ramp (magnitude encoding): lightest = near zero,
// darkest = far. In dark mode the anchor flips so "near zero" still recedes
// toward the (dark) surface instead of toward white.
const SEQUENTIAL_BLUE_LIGHT = [
  "#cde2fb",
  "#b7d3f6",
  "#9ec5f4",
  "#86b6ef",
  "#6da7ec",
  "#5598e7",
  "#3987e5",
  "#2a78d6",
  "#256abf",
  "#1c5cab",
  "#184f95",
  "#104281",
  "#0d366b",
];
const SEQUENTIAL_BLUE_DARK = [...SEQUENTIAL_BLUE_LIGHT].reverse();

// Status color (a discrete "correct" state, not a magnitude) — kept off the
// sequential ramp so the answer never reads as merely "a very close guess".
export const STATUS_GOOD = "#0ca30c";

export const UNGUESSED_FILL_LIGHT = "#e1e0d9";
export const UNGUESSED_FILL_DARK = "#2c2c2a";

export const OCEAN_FILL_LIGHT = "#eef3f8";
export const OCEAN_FILL_DARK = "#15171a";

export function sequentialRamp(prefersDark: boolean): string[] {
  return prefersDark ? SEQUENTIAL_BLUE_DARK : SEQUENTIAL_BLUE_LIGHT;
}

export function makeDistanceColorScale(maxDistanceKm: number, prefersDark: boolean) {
  const ramp = sequentialRamp(prefersDark);
  const domainMax = Math.max(maxDistanceKm, 1);
  const domain = ramp.map((_, i) => (i / (ramp.length - 1)) * domainMax);
  return scaleLinear<string, string>().domain(domain).range(ramp).clamp(true);
}
