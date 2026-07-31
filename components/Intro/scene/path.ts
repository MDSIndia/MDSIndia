import * as THREE from "three";
import { INTRO_DURATION, clamp01, easeInCubic } from "./timeline";

/**
 * Control points for the cinematic camera flight path: a straight,
 * level shot right from the start (near street height, looking
 * straight down the highway rather than down from above) -> alignment
 * with the highway -> low chase -> an extended cruise through more of
 * the skyline -> a final straight converging back to center, toward
 * the star waiting at the end of the road.
 *
 * X stays pinned at 0 the whole way — no lateral weaving — so the rig
 * travels in a single straight line down the center of the road
 * (combined with CameraRig's fixed up-vector and lack of shake, this
 * is what makes the whole flight read as stable rather than a drone
 * drifting side to side). Only y (altitude) and z (distance travelled)
 * change between points.
 *
 * The points extend the journey (previously ending at z=-62) further
 * through the same procedurally-generated city — CityScape/RoadDetails/
 * DistantSkyline/HighwayRoad already cover this whole range, so no
 * city/building files need to change to support the longer flight.
 */
export const FLIGHT_PATH_POINTS: [number, number, number][] = [
  [0, 2.4, 46],
  [0, 2.1, 28],
  [0, 1.9, 12],
  [0, 1.7, -2],
  [0, 1.5, -18],
  [0, 1.6, -34],
  [0, 1.7, -50],
  [0, 1.8, -68],
  [0, 2.0, -86],
  [0, 2.3, -102],
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
 * velocity" rather than gliding to a stop before entering the light.
 *
 * Pure cubic ease-in has zero velocity at x=0, which read as an
 * almost-motionless crawl for the first couple of seconds once the
 * flight starts already at street level (there's no longer a high
 * aerial descent to disguise it). Blending in a linear term gives the
 * camera real, noticeable speed from the very first frame while still
 * landing on the exact same u=0 at t=0 and u=1 at t=INTRO_DURATION —
 * every other effect in this cinematic keyed to those two absolute
 * endpoints (fog, star growth, the engulf) stays perfectly in sync
 * without needing its own retune. */
export function flightU(t: number): number {
  const x = clamp01(t / INTRO_DURATION);
  // More linear weight than before (was 0.6/0.4) — noticeably more
  // velocity from the first frame instead of most of the motion being
  // saved for the ease-in cubic's own acceleration later on, while
  // still landing on the exact same u=0 at t=0 and u=1 at
  // t=INTRO_DURATION every other effect in this cinematic is keyed to.
  return clamp01(easeInCubic(x) * 0.45 + x * 0.55);
}
