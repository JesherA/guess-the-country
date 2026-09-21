// Manual sanity check for the border-distance algorithm against country
// pairs with an obvious expected answer. Run with:
//   npx tsx scripts/verify-distance.ts

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { borderDistanceKm } from "../src/geo/distance.js";
import type { Feature, Geometry } from "geojson";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type BorderProperties = { iso: string; iso3: string; name: string };

const borders: { features: Feature<Geometry, BorderProperties>[] } = JSON.parse(
  readFileSync(path.join(__dirname, "..", "data", "borders.geo.json"), "utf-8")
);

const byIso = new Map(borders.features.map((f) => [f.properties.iso, f]));

function check(isoA: string, isoB: string, expectation: string) {
  const a = byIso.get(isoA);
  const b = byIso.get(isoB);
  if (!a || !b) {
    console.log(`${isoA}-${isoB}: MISSING GEOMETRY`);
    return;
  }
  const start = performance.now();
  const km = borderDistanceKm(a as any, b as any);
  const ms = performance.now() - start;
  console.log(`${isoA} <-> ${isoB}: ${km.toFixed(1)} km (${ms.toFixed(1)}ms) -- expect: ${expectation}`);
}

check("FR", "DE", "~0 km, they border each other");
check("ZA", "LS", "0 km, Lesotho is an enclave inside South Africa");
check("US", "CA", "~0 km, they border each other");
check("FR", "AU", "very large, ~16000+ km apart");
check("GB", "IE", "small but >0, separated by sea");
check("JP", "KR", "a few hundred km, separated by sea");
check("RU", "US", "small, close via the Bering Strait (Alaska)");
check("ID", "MY", "small/0, share land border on Borneo and are close by sea elsewhere");
