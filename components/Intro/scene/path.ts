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

// Three-phase velocity shape for the flight's progress-over-time curve:
// a quick launch ramp, a steady cruise, then an accelerating final
// surge into the star. Replaced a single x^1.4 power curve that
// accelerated continuously for the *entire* 9s — mathematically
// smooth, but nothing that actually moves (a car, a drone, a dolly)
// keeps building speed for that long without ever settling into a
// pace; by the 4s mark that curve had only covered ~32% of the
// distance, which read as a sluggish, still-launching glide well past
// the point a real shot would already be cruising. Same standing-start
// guarantee as before (zero velocity at t=0, no snap) and the same
// still-accelerating finish into the star, but now with an actual
// cruise in between so the middle of the flight reads as *travelling*
// rather than perpetually winding up.
const LAUNCH_FRAC = 0.15; // ramp to cruise speed by ~1.35s
const SURGE_START_FRAC = 0.82; // final push begins ~7.4s in
const FINAL_SPEED_RATIO = 1.7; // surge peaks at 1.7x cruise speed

// Cruise speed solved so the three phases' areas (launch ramp +
// constant cruise + accelerating surge) sum to exactly 1 — i.e. u(1)
// lands on 1 by construction, not by clamping a mismatched curve.
const CRUISE_SPEED =
  1 /
  (1 -
    0.5 * LAUNCH_FRAC +
    ((1 - SURGE_START_FRAC) * (FINAL_SPEED_RATIO - 1)) / 3);
const FINAL_SPEED = FINAL_SPEED_RATIO * CRUISE_SPEED;

// Antiderivative of the smoothstep curve 3s^2 - 2s^3, used so the
// launch ramp's velocity (and therefore acceleration) joins both its
// neighbors — zero at x=0, cruise speed at x=LAUNCH_FRAC — with no
// kink at either end.
function smoothstepIntegral(s: number): number {
  return s * s * s - 0.5 * s * s * s * s;
}

/** Normalized [0,1] position along the flight curve for a given elapsed
 * time. See the phase constants above: launch ramp (ease-out from a
 * genuine standstill to cruise speed) -> flat cruise -> ease-in surge
 * that's still accelerating at u=1, so the camera races into the star
 * rather than gliding to a stop before it. */
export function flightU(t: number): number {
  const x = clamp01(t / INTRO_DURATION);

  if (x <= LAUNCH_FRAC) {
    const s = x / LAUNCH_FRAC;
    return clamp01(CRUISE_SPEED * LAUNCH_FRAC * smoothstepIntegral(s));
  }

  const uAtLaunchEnd = CRUISE_SPEED * LAUNCH_FRAC * 0.5;
  if (x <= SURGE_START_FRAC) {
    return clamp01(uAtLaunchEnd + CRUISE_SPEED * (x - LAUNCH_FRAC));
  }

  const uAtSurgeStart =
    uAtLaunchEnd + CRUISE_SPEED * (SURGE_START_FRAC - LAUNCH_FRAC);
  const s = (x - SURGE_START_FRAC) / (1 - SURGE_START_FRAC);
  const surgeSpan = 1 - SURGE_START_FRAC;
  return clamp01(
    uAtSurgeStart +
      surgeSpan * (CRUISE_SPEED * s + ((FINAL_SPEED - CRUISE_SPEED) * s ** 3) / 3)
  );
}
