import * as THREE from "three";

let cached: THREE.Texture | null = null;
let cachedRay: THREE.Texture | null = null;

/** A soft white radial-gradient sprite (opaque center fading to fully
 * transparent edge), shared and tinted per-use via material `color` —
 * this is what makes glows read as soft bloom instead of a flat,
 * hard-edged disc (which is what a lit-ignoring MeshBasicMaterial
 * sphere or an untextured Points sprite renders as by default). */
export function getRadialGlowTexture(): THREE.Texture {
  if (cached) return cached;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.75)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  cached = new THREE.CanvasTexture(canvas);
  return cached;
}

/** A thin horizontal lens-flare streak (bright center, fading to
 * transparent at both tips and along the vertical edges) — rotated per
 * instance via `spriteMaterial.rotation` to fan out into a star's
 * rays, always facing the camera since it's rendered as a sprite. */
export function getRayTexture(): THREE.Texture {
  if (cachedRay) return cachedRay;
  const w = 256;
  const h = 32;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const hGrad = ctx.createLinearGradient(0, 0, w, 0);
  hGrad.addColorStop(0, "rgba(255,255,255,0)");
  hGrad.addColorStop(0.5, "rgba(255,255,255,1)");
  hGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, w, h);

  // Fade the vertical edges too, so it reads as a soft streak rather
  // than a hard-edged bar.
  ctx.globalCompositeOperation = "destination-out";
  const vGrad = ctx.createLinearGradient(0, 0, 0, h);
  vGrad.addColorStop(0, "rgba(0,0,0,1)");
  vGrad.addColorStop(0.5, "rgba(0,0,0,0)");
  vGrad.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  cachedRay = new THREE.CanvasTexture(canvas);
  return cachedRay;
}

/** A small solid circular sprite (hard-edged), used as the alpha mask
 * for Points-based particle bursts so they render as soft dots instead
 * of the flat squares a bare PointsMaterial falls back to. */
export function getParticleDotTexture(): THREE.Texture {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}
