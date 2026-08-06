import * as THREE from "three";
import { INTRO_DURATION, clamp01 } from "./timeline";

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
 * A single power curve (x^1.4), not a blend of two eases. Two failed
 * attempts along the way are worth recording:
 *  - Pure cubic ease-in (x^3) has zero velocity at x=0, which read as
 *    an almost-motionless crawl for the first couple of seconds once
 *    the flight starts already at street level.
 *  - Blending in a linear term fixed the crawl but put the camera at
 *    full linear velocity in the very first rendered frame — no real
 *    rig already has momentum the instant it starts, so this read as
 *    the shot snapping straight into motion instead of launching.
 *    Fading that linear term in over a short window fixed *that*, but
 *    a weighted-sum-of-two-curves ramp isn't itself monotonic — the
 *    two terms briefly out-accelerate their own settled cruise speed
 *    before easing back down, i.e. a velocity overshoot/bump right as
 *    the ramp hands off.
 * x^1.4 sidesteps both: for any exponent n>1, d/dx[x^n] = n*x^(n-1) is
 * exactly 0 at x=0 (genuine standing start, no snap) and itself
 * monotonically non-decreasing over [0,1] (guaranteed — a single power
 * of x has no seam where two pieces could fight each other), so
 * velocity rises smoothly with no bump anywhere in the flight. 1.4 is
 * chosen empirically to closely track the old blended curve's pacing
 * from ~1s onward (so the bulk of the flight — and everything else
 * keyed to absolute time, like the FOV pushes and fog below — reads
 * the same as before), while giving the first ~second a genuine,
 * gradual liftoff instead of either extreme. */
export function flightU(t: number): number {
  const x = clamp01(t / INTRO_DURATION);
  return clamp01(Math.pow(x, 1.4));
}
