import * as THREE from "three";
import { INTRO_DURATION, clamp01, easeInOutCubic } from "./timeline";

/**
 * Control points for the cinematic camera/rider flight path:
 * high aerial establishing shot -> descent into the city -> alignment
 * with the highway -> low chase -> a final straight converging back to
 * center, toward the star waiting at the end of the road.
 *
 * The first six points (through z=-34) are load-bearing for the
 * beginning/middle of the sequence and must not change. Only the final
 * two points were redesigned (replacing the old lateral banked-turn
 * exit) — kept close to the old tail's total length so the unchanged
 * points above are reached at essentially the same time as before.
 */
export const FLIGHT_PATH_POINTS: [number, number, number][] = [
  [0, 16, 46],
  [0, 10, 28],
  [0, 4, 12],
  [0, 1.7, -2],
  [0.4, 1.5, -18],
  [1.6, 1.6, -34],
  [0.6, 1.85, -48],
  [0, 2.3, -62],
];

/** Where the star sits — just beyond the curve's final point, so the
 * camera never has to geometrically reach it; the star's own growing
 * glow radius engulfs the camera well before it would. */
export const STAR_POSITION: [number, number, number] = [0, 2.6, -68];

export function createFlightCurve() {
  return new THREE.CatmullRomCurve3(
    FLIGHT_PATH_POINTS.map((p) => new THREE.Vector3(...p)),
    false,
    "catmullrom",
    0.4
  );
}

/** Normalized [0,1] position along the flight curve for a given elapsed time. */
export function flightU(t: number): number {
  return clamp01(easeInOutCubic(clamp01(t / INTRO_DURATION)));
}
