import * as THREE from "three";

interface ProfilePoint {
  z: number;
  h: number;
  w: number;
}

// One profile shared by every vehicle's lower body (flying, driving,
// parked): low, pinched nose and tail with a raised shoulder in the
// middle where the cabin sits, instead of a plain rectangular box —
// callers still add their own distinct cabin box on top (see
// CABIN_HEIGHT below), the taper here is just what makes the body
// itself read as a car rather than a brick. Z runs from -0.5 (tail) to
// 0.5 (nose); h/w are fractions of the instance's own scale.y/scale.x,
// sampled with smoothstep easing between keyframes so the surface
// curves rather than kinking at each control point.
// Rounder, fuller ends (nose/tail w/h both raised) at explicit
// "use this type of car" reference — a bulbous, wheel-less-looking
// concept-car pod rather than a pinched sports-car taper. The old
// profile's nose/tail pulled in tight and low (w 0.56-0.62, h 0.16-0.2);
// this keeps the same six-point shape but fills them out toward a
// continuous, egg-like cross-section so the whole body reads as one
// flowing blob rather than a wedge with a distinct point at each end.
const PROFILE: ProfilePoint[] = [
  { z: -0.5, h: 0.3, w: 0.74 }, // tail — rounded, not pinched
  { z: -0.34, h: 0.34, w: 0.92 }, // rear shoulder, into the cabin
  { z: -0.14, h: 1.0, w: 1.0 }, // roof peak
  { z: 0.14, h: 0.94, w: 0.96 }, // windshield base
  { z: 0.32, h: 0.46, w: 0.86 }, // hood — fuller
  { z: 0.5, h: 0.26, w: 0.68 }, // nose — rounded, blunter
];

/** The roof-peak/cabin stretch of PROFILE above (roughly where h stays
 * above half height) — exported so callers can position a window band
 * exactly over the actual bulge instead of eyeballing it. */
// Recomputed for the rounder PROFILE above (where h crosses 0.5 on each
// side) — the fuller nose/tail pushed these outward from the old
// -0.3/0.16, which also means the cabin box every caller sizes off
// these now spans a wider, more panoramic stretch of the body.
export const CABIN_Z_START = -0.27;
export const CABIN_Z_END = 0.29;

function smoothstep(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function sampleProfile(z: number): { h: number; w: number } {
  if (z <= PROFILE[0].z) return PROFILE[0];
  const last = PROFILE[PROFILE.length - 1];
  if (z >= last.z) return last;
  for (let k = 0; k < PROFILE.length - 1; k++) {
    const a = PROFILE[k];
    const b = PROFILE[k + 1];
    if (z >= a.z && z <= b.z) {
      const t = smoothstep((z - a.z) / (b.z - a.z));
      return { h: THREE.MathUtils.lerp(a.h, b.h, t), w: THREE.MathUtils.lerp(a.w, b.w, t) };
    }
  }
  return last;
}

/** Builds the shared aerodynamic vehicle shell: a subdivided unit box
 * with its vertices remapped through PROFILE above (bottom stays flush
 * at y=-0.5 always — a car's underside is flat — only the roofline and
 * width taper). Built once and shared across every instanced vehicle
 * mesh in the scene (flying cars, street traffic, parked cars) the
 * same way CityScape shares its twisted-tower geometry: cheap to
 * instance a thousand times over, expensive to build twice for no
 * reason. */
export function createAeroCarBodyGeometry(): THREE.BufferGeometry {
  // Segment counts bumped (8->10, 28->32) alongside the rounder PROFILE
  // above — a fuller, more continuously-curved body shows faceting at
  // the old resolution that the previous, straighter-sided taper didn't.
  // This is a shared, built-once/cached-by-caller geometry (see the
  // comment below), so the extra vertices cost nothing per-instance.
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, 10, 32);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const { h, w } = sampleProfile(v.z);
    const newY = -0.5 + (v.y + 0.5) * h;
    pos.setXYZ(i, v.x * w, newY, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** The shell's own peak-height fraction (1.0, at the bulge) means a
 * consumer's `scale.y` directly sets that bulge's height above the
 * ground. This is deliberately just the lower body (hood/trunk/
 * shoulder line), not the full car height — at actual render scale a
 * smoothly curved shell with no cabin reads as a featureless blob, not
 * a vehicle. A real silhouette break (the cabin box every consumer
 * adds on top, starting exactly at this height) is what actually
 * reads as "car" at a distance; CABIN_HEIGHT is that box's height. */
export const CAR_SHELL_HEIGHT = 0.4;
export const CABIN_HEIGHT = 0.22;

let cachedCabinGeometry: THREE.BufferGeometry | null = null;

/** The cabin/greenhouse sitting on top of the aero shell — every
 * vehicle (StreetCars, FlyingCars, ParkingLot) was stacking a plain
 * unit `boxGeometry` here: a perfectly vertical, unraked glass box,
 * which is exactly what read as "toy car" rather than a real or
 * concept vehicle — nothing that's actually been on a road has a
 * windshield standing straight up. This remaps the same shared
 * unit-box the aero shell itself is built from so both the front and
 * rear glass rake inward as they rise (a real greenhouse silhouette,
 * narrower at the roofline than at the beltline) with a touch of
 * tumblehome (the sides leaning in slightly too), instead of tapering
 * only the lower body and leaving the cabin a hard rectangular block on
 * top of it. Cached and shared the same way the shell geometry is —
 * every vehicle instances the one geometry. */
export function createCarCabinGeometry(): THREE.BufferGeometry {
  if (cachedCabinGeometry) return cachedCabinGeometry;
  // Height segments raised 1 -> 5 at explicit "use this type of car"
  // reference — a flat linear taper (only two rows of vertices, top and
  // bottom) can only ever read as a raked glass panel; the reference's
  // greenhouse is a genuine curved bubble canopy, which needs actual
  // interior rows to belly outward before tapering back in toward the
  // roofline.
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, 5, 6);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const topT = v.y + 0.5; // 0 at the beltline (base), 1 at the roofline
    // A gentle outward belly peaking mid-height (sin(topT*PI)) layered
    // on top of the base rake/tumblehome taper — this is what turns a
    // flat raked panel into an actual domed bubble canopy, the reference
    // car's single most distinctive feature.
    const bulge = 1 + Math.sin(topT * Math.PI) * 0.14;
    const zTaper = (1 - topT * 0.34) * bulge; // windshield/rear-glass rake + dome
    const xTaper = (1 - topT * 0.16) * bulge; // tumblehome + dome
    pos.setXYZ(i, v.x * xTaper, v.y, v.z * zTaper);
  }
  geo.computeVertexNormals();
  cachedCabinGeometry = geo;
  return geo;
}

let cachedCarPaintTexture: THREE.Texture | null = null;

/** A neutral grey-to-white vertical gradient, multiplied against each
 * instance's own solid paint color via setColorAt/instanceColor —
 * real automotive paint always shows a light/dark falloff (a bright
 * highlight along the shoulder line, a shadowed rocker panel near the
 * wheels from ambient occlusion), and a single completely flat color
 * is a big part of what reads as a toy instead of painted metal. Grey
 * rather than colored so it only modulates brightness, never shifts
 * hue away from whatever paint color the instance actually has.
 * BoxGeometry's default UVs map V to each side face's own height, so
 * this lines up as an actual highlight-at-the-shoulder gradient rather
 * than a random smear — it doesn't need the profile-remapped geometry
 * to know anything special about it. */
export function getCarPaintTexture(): THREE.Texture {
  if (cachedCarPaintTexture) return cachedCarPaintTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
  grad.addColorStop(0, "#3a3a3f"); // rocker panel / underside, shadowed
  grad.addColorStop(0.38, "#6c6c72");
  grad.addColorStop(0.68, "#eaeaee"); // shoulder line, brightest
  grad.addColorStop(0.85, "#c8c8cd");
  grad.addColorStop(1, "#9c9ca2"); // roof, slightly receded
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  cachedCarPaintTexture = new THREE.CanvasTexture(canvas);
  cachedCarPaintTexture.wrapS = THREE.ClampToEdgeWrapping;
  cachedCarPaintTexture.wrapT = THREE.ClampToEdgeWrapping;
  cachedCarPaintTexture.colorSpace = THREE.SRGBColorSpace;
  return cachedCarPaintTexture;
}
