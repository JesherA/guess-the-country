// world-atlas's TopoJSON keys each country by its ISO 3166-1 *numeric* code,
// but our game data (guesses, country list) is keyed by alpha-2. This builds
// a tiny static lookup so the map component doesn't need to ship the much
// heavier i18n-iso-countries package to the browser just for that mapping.
//
// Run with: npm run build:map-data --workspace frontend

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isoCountries = require("i18n-iso-countries");
isoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const topology = require("world-atlas/countries-110m.json");

const numericToIso = {};
for (const geometry of topology.objects.countries.geometries) {
  const alpha2 = isoCountries.numericToAlpha2(String(geometry.id));
  if (alpha2) numericToIso[geometry.id] = alpha2;
}

writeFileSync(
  path.join(__dirname, "..", "src", "data", "numeric-to-iso.json"),
  JSON.stringify(numericToIso)
);

console.log(`Wrote ${Object.keys(numericToIso).length} numeric-id -> ISO alpha-2 mappings`);
