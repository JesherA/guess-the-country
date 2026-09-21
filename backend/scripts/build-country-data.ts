// Builds backend/data/countries.json and backend/data/borders.geo.json from
// public domain Natural Earth boundary data (via the world-atlas npm package),
// so we don't have to check large geometry files into git or hand-maintain them.
//
// Run with: npm run build:data --workspace backend

import { createRequire } from "node:module";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { filterDisconnectedFragments } from "./filter-fragments.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isoCountries = require("i18n-iso-countries");
isoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const topology = require("world-atlas/countries-50m.json") as Topology;

interface CountryMeta {
  iso: string;
  iso3: string;
  name: string;
  aliases: string[];
}

const aliases: Record<string, string[]> = JSON.parse(
  readFileSync(path.join(__dirname, "..", "data", "aliases.json"), "utf-8")
);

const countriesObject = topology.objects.countries as GeometryCollection;
const geojson = feature(topology, countriesObject) as FeatureCollection<Geometry, { name: string }>;

const countries: CountryMeta[] = [];
const borderFeatures: FeatureCollection["features"] = [];
const skipped: string[] = [];

for (const f of geojson.features) {
  const numericId = String(f.id);
  const iso = isoCountries.numericToAlpha2(numericId);
  const iso3 = isoCountries.numericToAlpha3(numericId);

  if (!iso || !iso3) {
    skipped.push(f.properties?.name ?? numericId);
    continue;
  }

  const name = isoCountries.getName(iso, "en") ?? f.properties?.name ?? iso;

  countries.push({
    iso,
    iso3,
    name,
    aliases: aliases[iso] ?? [],
  });

  let geometry = f.geometry;
  if (geometry.type === "MultiPolygon") {
    const filtered = filterDisconnectedFragments(iso, geometry.coordinates);
    geometry = filtered.length === 1
      ? { type: "Polygon", coordinates: filtered[0] }
      : { type: "MultiPolygon", coordinates: filtered };
  }

  borderFeatures.push({
    type: "Feature",
    properties: { iso, iso3, name },
    geometry,
  });
}

countries.sort((a, b) => a.name.localeCompare(b.name));

const dataDir = path.join(__dirname, "..", "data");
writeFileSync(path.join(dataDir, "countries.json"), JSON.stringify(countries, null, 2));
writeFileSync(
  path.join(dataDir, "borders.geo.json"),
  JSON.stringify({ type: "FeatureCollection", features: borderFeatures })
);

console.log(`Wrote ${countries.length} countries to data/countries.json and data/borders.geo.json`);
if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} non-standard entries (no ISO alpha-2 code): ${skipped.join(", ")}`);
}
