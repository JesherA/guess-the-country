// Loads the pre-built country reference data (see scripts/build-country-data.ts)
// into memory once at startup. This is static, read-only data — it deliberately
// does not live in the SQL database.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { CountryMeta } from "@guess-the-country/shared";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

// Resolved from the backend package's own working directory (how both `tsx`
// and the compiled `node dist/src/index.js` are always launched) rather than
// __dirname, since tsc's compiled output sits one directory deeper (dist/src/)
// than the source it's compiled from (src/), which would make a fixed number
// of ".." segments correct for only one of the two run modes.
const dataDir = path.join(process.cwd(), "data");

type BorderProperties = { iso: string; iso3: string; name: string };
type BorderFeature = Feature<Polygon | MultiPolygon, BorderProperties>;

const countries: CountryMeta[] = JSON.parse(
  readFileSync(path.join(dataDir, "countries.json"), "utf-8")
);

const borders: FeatureCollection<Polygon | MultiPolygon, BorderProperties> = JSON.parse(
  readFileSync(path.join(dataDir, "borders.geo.json"), "utf-8")
);

const countriesByIso = new Map<string, CountryMeta>(countries.map((c) => [c.iso, c]));
const borderByIso = new Map<string, BorderFeature>(
  borders.features.map((f) => [f.properties.iso, f])
);

export function getAllCountries(): CountryMeta[] {
  return countries;
}

export function getCountryByIso(iso: string): CountryMeta | undefined {
  return countriesByIso.get(iso.toUpperCase());
}

export function getBorderGeometry(iso: string): BorderFeature | undefined {
  return borderByIso.get(iso.toUpperCase());
}

export function getRandomCountryIso(): string {
  const index = Math.floor(Math.random() * countries.length);
  return countries[index].iso;
}

console.log(`Loaded ${countries.length} countries into memory (${borders.features.length} with border geometry)`);
