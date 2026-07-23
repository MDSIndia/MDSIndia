import * as THREE from "three";
import { INTRO_DURATION, clamp01, easeInCubic } from "./timeline";

/**
 * Control points for the cinematic camera flight path:
 * high aerial establishing shot -> descent into the city -> alignment
 * with the highway -> low chase -> an extended cruise through more of
 * the skyline -> a final straight converging back to center, toward
 * the star waiting at the end of the road.
 *
 * The first six points (through z=-34) are load-bearing for the
 * beginning/middle of the sequence and must not change. The remaining
 * points extend the journey (previously ending at z=-62) further
 * through the same procedurally-generated city — CityScape/RoadDetails/
 * DistantSkyline/HighwayRoad already cover this whole range, so no
 * city/building files need to change to support the longer flight.
 */
export const FLIGHT_PATH_POINTS: [number, number, number][] = [
  [0, 16, 46],
  [0, 10, 28],
  [0, 4, 12],
  [0, 1.7, -2],
  [0.4, 1.5, -18],
  [1.6, 1.6, -34],
  [2.1, 1.7, -50],
  [1.7, 1.8, -68],
  [0.8, 2.0, -86],
  [0.3, 2.3, -102],
  [0, 2.6, -116],
];

/** Where the star sits — just beyond the curve's final point, so the
 * camera never has to geometrically reach it; the star's own growing
 * glow radius engulfs the camera well before it would. */
export const STAR_POSITION: [number, number, number] = [0, 2.9, -122];

export function createFlightCurve() {
  return new THREE.CatmullRomCurve3(
    FLIGHT_PATH_POINTS.map((p) => new THREE.Vector3(...p)),
    false,
    "catmullrom",
    0.4
  );
}

/** Normalized [0,1] position along the flight curve for a given elapsed
 * time. Uses an ease-*in* curve (not ease-in-out): the camera never
 * decelerates as it approaches u=1 — it's still accelerating right up
 * to the moment it reaches the star, matching "races toward it at full
 * velocity" rather than gliding to a stop before entering the light. */
export function flightU(t: number): number {
  return clamp01(easeInCubic(clamp01(t / INTRO_DURATION)));
}
