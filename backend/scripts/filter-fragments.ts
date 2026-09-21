// Natural Earth's admin-0 boundaries bundle a country's remote territories
// into the same MultiPolygon as its main landmass (e.g. France includes
// French Guiana, Réunion, Mayotte, Guadeloupe and Martinique). For a border-
// distance game that makes a guess of "France" look deceptively close to
// South America or the Indian Ocean. This drops parts that are both far
// from the country's main cluster of land and too small to plausibly be
// "the country" on their own — while leaving genuinely large disconnected
// territories (e.g. Alaska, Russia's Kaliningrad/Sakhalin, Chile's islands)
// intact, since those are exactly what a player would expect.

import { area } from "@turf/area";
import { centroid } from "@turf/centroid";
import { distance } from "@turf/distance";
import type { Position } from "geojson";

const CLUSTER_DISTANCE_KM = 700;
const MIN_AREA_FRACTION = 0.05;

// French Guiana alone is ~13% of "France"'s total mapped area, so it
// survives the generic area-fraction filter above even though it's on a
// different continent from metropolitan France. Restrict France to its
// European extent explicitly instead of trying to generalize this case.
const REGION_OVERRIDES: Record<string, [minLng: number, minLat: number, maxLng: number, maxLat: number]> = {
  FR: [-10, 40, 15, 52], // metropolitan France + Corsica
};

function ringBboxCenter(ring: Position[]): Position {
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
}

function toPolygonFeature(rings: Position[][]) {
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: rings } };
}

export function filterDisconnectedFragments(iso: string, multiPolygonCoords: Position[][][]): Position[][][] {
  if (multiPolygonCoords.length < 2) return multiPolygonCoords;

  let parts = multiPolygonCoords;
  const region = REGION_OVERRIDES[iso];
  if (region) {
    const [minLng, minLat, maxLng, maxLat] = region;
    const kept = parts.filter((rings) => {
      const [cx, cy] = ringBboxCenter(rings[0]);
      return cx >= minLng && cx <= maxLng && cy >= minLat && cy <= maxLat;
    });
    if (kept.length > 0) parts = kept;
  }

  if (parts.length < 2) return parts;

  const areas = parts.map((rings) => area(toPolygonFeature(rings)));
  const centroids = parts.map((rings) => centroid(toPolygonFeature(rings)).geometry.coordinates);

  // Single-linkage clustering: parts within CLUSTER_DISTANCE_KM of each
  // other, directly or via a chain of islands, count as one landmass.
  const n = parts.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (distance(centroids[i], centroids[j], { units: "kilometers" }) < CLUSTER_DISTANCE_KM) {
        parent[find(i)] = find(j);
      }
    }
  }

  const totalArea = areas.reduce((sum, a) => sum + a, 0);
  const clusterArea = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    clusterArea.set(root, (clusterArea.get(root) ?? 0) + areas[i]);
  }

  const filtered = parts.filter((_, i) => (clusterArea.get(find(i))! / totalArea) >= MIN_AREA_FRACTION);
  return filtered.length > 0 ? filtered : parts;
}
