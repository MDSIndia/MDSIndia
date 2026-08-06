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
const PROFILE: ProfilePoint[] = [
  { z: -0.5, h: 0.2, w: 0.62 }, // tail
  { z: -0.3, h: 0.28, w: 0.86 }, // rear shoulder, into the cabin
  { z: -0.14, h: 1.0, w: 1.0 }, // roof peak
  { z: 0.16, h: 0.92, w: 0.94 }, // windshield base
  { z: 0.3, h: 0.4, w: 0.78 }, // hood
  { z: 0.5, h: 0.16, w: 0.56 }, // nose
];

/** The roof-peak/cabin stretch of PROFILE above (roughly where h stays
 * above half height) — exported so callers can position a window band
 * exactly over the actual bulge instead of eyeballing it. */
export const CABIN_Z_START = -0.3;
export const CABIN_Z_END = 0.16;

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
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, 8, 28);
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
