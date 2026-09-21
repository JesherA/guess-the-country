// Minimum great-circle distance between two countries' borders (0 if they
// touch, overlap, or one contains the other — e.g. Lesotho inside South Africa).

import { booleanIntersects } from "@turf/boolean-intersects";
import { polygonToLine } from "@turf/polygon-to-line";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { point as turfPoint } from "@turf/helpers";
import type { Feature, LineString, MultiLineString, MultiPolygon, Polygon, Position } from "geojson";

type CountryFeature = Feature<Polygon | MultiPolygon>;
type BorderLine = Feature<MultiLineString>;

// Polygon coordinates nest as rings-of-positions; MultiPolygon as
// polygons-of-rings-of-positions. Recursing to the first numeric level
// flattens either shape into a flat list of [lng, lat] vertices.
function flattenPositions(coords: unknown): Position[] {
  if (Array.isArray(coords) && typeof coords[0] === "number") {
    return [coords as Position];
  }
  return (coords as unknown[]).flatMap(flattenPositions);
}

// polygonToLine returns a single Feature<LineString> for a Polygon, or a
// FeatureCollection<LineString> (one per sub-polygon) for a MultiPolygon.
// Normalize both into one MultiLineString feature so nearestPointOnLine
// always searches every ring in a single call.
function lineStringsOf(geometry: LineString | MultiLineString): Position[][] {
  return geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
}

function toBorderLine(country: CountryFeature): BorderLine {
  const line = polygonToLine(country);
  const coordinates =
    line.type === "FeatureCollection"
      ? line.features.flatMap((f) => lineStringsOf(f.geometry))
      : lineStringsOf(line.geometry);

  return { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates } };
}

function minDistanceFromVerticesToLine(vertices: Position[], line: BorderLine): number {
  let min = Infinity;
  for (const vertex of vertices) {
    const nearest = nearestPointOnLine(line, turfPoint(vertex));
    const dist = nearest.properties.dist as number;
    if (dist < min) min = dist;
  }
  return min;
}

export function borderDistanceKm(a: CountryFeature, b: CountryFeature): number {
  if (booleanIntersects(a, b)) {
    return 0;
  }

  const lineA = toBorderLine(a);
  const lineB = toBorderLine(b);
  const verticesA = flattenPositions(a.geometry.coordinates);
  const verticesB = flattenPositions(b.geometry.coordinates);

  // Vertex-to-line in both directions: the closest approach can land on an
  // edge of either country, not just on a vertex of the other.
  const aToB = minDistanceFromVerticesToLine(verticesA, lineB);
  const bToA = minDistanceFromVerticesToLine(verticesB, lineA);

  return Math.min(aToB, bToA);
}
