import { useMemo, useRef, useState } from "react";
import type { ComponentProps, PointerEvent as ReactPointerEvent } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Sphere, ZoomableGroup } from "react-simple-maps";
import type { ZoomPanCallbackProps } from "react-simple-maps";

type GeographyItem = ComponentProps<typeof Geography>["geography"];
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import type { GuessResponse } from "@guess-the-country/shared";
import worldTopology from "world-atlas/countries-110m.json";
import numericToIso from "../data/numeric-to-iso.json";
import { usePrefersDark } from "../hooks/usePrefersDark";
import {
  makeDistanceColorScale,
  sequentialRamp,
  STATUS_GOOD,
  UNGUESSED_FILL_LIGHT,
  UNGUESSED_FILL_DARK,
  OCEAN_FILL_LIGHT,
  OCEAN_FILL_DARK,
} from "./colorScale";
import "./WorldMap.css";

const topology = worldTopology as unknown as Topology;
const worldGeoJson = feature(topology, topology.objects.countries as GeometryCollection) as FeatureCollection<Geometry>;
const numericToIsoMap = numericToIso as Record<string, string>;

interface WorldMapProps {
  guesses: GuessResponse[];
}

interface HoverInfo {
  name: string;
  detail: string;
}

type MapStyle = "flat" | "globe";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const DEFAULT_VIEW = { coordinates: [0, 0] as [number, number], zoom: 1 };

const MIN_GLOBE_SCALE = 200;
const MAX_GLOBE_SCALE = 700;
const DEFAULT_GLOBE_SCALE = 300;
const DEFAULT_ROTATION: [number, number, number] = [0, 0, 0];
const ROTATE_SENSITIVITY = 0.25;

export function WorldMap({ guesses }: WorldMapProps) {
  const prefersDark = usePrefersDark();
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>("flat");
  const [view, setView] = useState(DEFAULT_VIEW);
  const [globeScale, setGlobeScale] = useState(DEFAULT_GLOBE_SCALE);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);

  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  function handleMoveEnd(pos: ZoomPanCallbackProps) {
    if (pos.coordinates && pos.zoom !== undefined) {
      setView({ coordinates: pos.coordinates, zoom: pos.zoom });
    }
  }

  function zoomBy(factor: number) {
    if (mapStyle === "flat") {
      setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor)) }));
    } else {
      setGlobeScale((s) => Math.min(MAX_GLOBE_SCALE, Math.max(MIN_GLOBE_SCALE, s * factor)));
    }
  }

  function resetView() {
    if (mapStyle === "flat") {
      setView(DEFAULT_VIEW);
    } else {
      setGlobeScale(DEFAULT_GLOBE_SCALE);
      setRotation(DEFAULT_ROTATION);
    }
  }

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    draggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!draggingRef.current || !lastPointerRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setRotation(([lon, lat, roll]) => [
      lon + dx * ROTATE_SENSITIVITY,
      Math.max(-90, Math.min(90, lat - dy * ROTATE_SENSITIVITY)),
      roll,
    ]);
  }

  function handlePointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    draggingRef.current = false;
    lastPointerRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  const resultByIso = useMemo(() => {
    const map = new Map<string, GuessResponse>();
    for (const g of guesses) map.set(g.countryIso, g);
    return map;
  }, [guesses]);

  const maxDistanceKm = useMemo(() => {
    const distances = guesses.filter((g) => !g.isCorrect).map((g) => g.distanceKm);
    return distances.length > 0 ? Math.max(...distances) : 1;
  }, [guesses]);

  const colorScale = useMemo(() => makeDistanceColorScale(maxDistanceKm, prefersDark), [maxDistanceKm, prefersDark]);
  const unguessedFill = prefersDark ? UNGUESSED_FILL_DARK : UNGUESSED_FILL_LIGHT;
  const oceanFill = prefersDark ? OCEAN_FILL_DARK : OCEAN_FILL_LIGHT;
  const strokeColor = prefersDark ? "#1a1a19" : "#fcfcfb";
  const graticuleColor = prefersDark ? "#33363b" : "#d7e0ea";
  const geoStrokeWidth = mapStyle === "flat" ? 0.5 / view.zoom : 0.4;

  function renderGeography(geo: GeographyItem) {
    const iso = numericToIsoMap[String(geo.id)];
    const guess = iso ? resultByIso.get(iso) : undefined;
    const fill = guess ? (guess.isCorrect ? STATUS_GOOD : colorScale(guess.distanceKm)) : unguessedFill;
    const name = (geo.properties as { name?: string } | undefined)?.name ?? "Unknown";

    return (
      <Geography
        key={geo.rsmKey}
        geography={geo}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={geoStrokeWidth}
        onMouseEnter={() =>
          setHovered({
            name,
            detail: guess ? (guess.isCorrect ? "Correct answer" : `${guess.distanceKm.toLocaleString()} km`) : "Not guessed yet",
          })
        }
        onMouseLeave={() => setHovered(null)}
        style={{ outline: "none" }}
      />
    );
  }

  return (
    <div className="world-map">
      <div className="world-map__canvas">
        <div className="world-map__style-toggle" role="group" aria-label="Map style">
          <button
            type="button"
            className={mapStyle === "flat" ? "is-active" : ""}
            aria-pressed={mapStyle === "flat"}
            onClick={() => setMapStyle("flat")}
          >
            Flat
          </button>
          <button
            type="button"
            className={mapStyle === "globe" ? "is-active" : ""}
            aria-pressed={mapStyle === "globe"}
            onClick={() => setMapStyle("globe")}
          >
            Globe
          </button>
        </div>

        {mapStyle === "flat" ? (
          <ComposableMap projection="geoEqualEarth" className="world-map__svg">
            <ZoomableGroup
              center={view.coordinates}
              zoom={view.zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onMoveEnd={handleMoveEnd}
            >
              <Geographies geography={worldGeoJson}>{({ geographies }) => geographies.map(renderGeography)}</Geographies>
            </ZoomableGroup>
          </ComposableMap>
        ) : (
          <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{ scale: globeScale, rotate: rotation }}
            className="world-map__svg world-map__svg--globe"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <Sphere id="world-map-sphere" fill={oceanFill} stroke={strokeColor} strokeWidth={0.5} />
            <Graticule stroke={graticuleColor} strokeWidth={0.3} />
            <Geographies geography={worldGeoJson}>{({ geographies }) => geographies.map(renderGeography)}</Geographies>
          </ComposableMap>
        )}

        <div className="world-map__zoom-controls">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.5)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.5)}>
            −
          </button>
          <button type="button" aria-label="Reset view" onClick={resetView}>
            Reset
          </button>
        </div>
      </div>

      <p className="world-map__tooltip" aria-live="polite">
        {hovered
          ? `${hovered.name}: ${hovered.detail}`
          : mapStyle === "flat"
            ? "Hover a country for details — scroll or drag to zoom"
            : "Hover a country for details — drag to rotate, use the buttons to zoom"}
      </p>

      <Legend prefersDark={prefersDark} maxDistanceKm={maxDistanceKm} />
    </div>
  );
}

function Legend({ prefersDark, maxDistanceKm }: { prefersDark: boolean; maxDistanceKm: number }) {
  const gradient = `linear-gradient(to right, ${sequentialRamp(prefersDark).join(", ")})`;

  return (
    <div className="world-map__legend">
      <div className="world-map__legend-item">
        <span className="world-map__legend-swatch" style={{ background: STATUS_GOOD }} />
        Correct
      </div>
      <div className="world-map__legend-item world-map__legend-item--gradient">
        <span>0 km</span>
        <span className="world-map__legend-gradient" style={{ background: gradient }} />
        <span>{maxDistanceKm.toLocaleString()} km</span>
      </div>
    </div>
  );
}
