/** Total length of the cinematic sequence, in seconds. */
export const INTRO_DURATION = 9.0;

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInQuad(x: number): number {
  return x * x;
}

/** Slow start, continuously accelerating, reaching maximum instantaneous
 * rate right at x=1 — used for the flight path so the camera never
 * decelerates approaching the star (unlike a symmetric ease-in-out). */
export function easeInCubic(x: number): number {
  return x * x * x;
}

/** Remaps t from [0,1] against a [start,end] window of the overall timeline, eased. */
export function windowProgress(
  t: number,
  start: number,
  end: number,
  ease: (x: number) => number = easeInOutCubic
): number {
  if (t <= start) return 0;
  if (t >= end) return 1;
  return ease(clamp01((t - start) / (end - start)));
}
