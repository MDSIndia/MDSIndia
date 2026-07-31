import * as THREE from "three";

let cached: THREE.Texture | null = null;
let cachedRay: THREE.Texture | null = null;
let cachedWindowGrid: THREE.Texture | null = null;

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

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

/** A tileable grid of lit/unlit window panes on a facade base, applied
 * as a `map` on the structural building materials — without this, a
 * lit box's whole face is one flat color regardless of shading, which
 * reads as an abstract block rather than a building. Beyond the raw
 * window grid, this also lays down the cues that make a facade read
 * as *constructed* rather than a printed pattern: a darker mullion
 * frame inset around each pane, alternating pilaster bays (the
 * structural columns real curtain-wall panels hang off), and a
 * spandrel band every few floors where the grid breaks for a
 * mechanical/structural level instead of more glass. Wrapped with
 * RepeatWrapping so cloning the texture and setting a different
 * `.repeat` per consumer (box towers vs. round towers vs. podiums)
 * reuses the same canvas without redrawing it. Multiplies against each
 * building's own per-instance tint/albedo, so windows still end up
 * colored per-building rather than one fixed hue. */
export function getWindowGridTexture(): THREE.Texture {
  if (cachedWindowGrid) return cachedWindowGrid;
  const cols = 4;
  const rows = 10;
  const cell = 40;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#4d4d57";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Alternating pilaster bays — a slightly different tone every other
  // column, reading as the structural columns a facade hangs off
  // rather than one continuous, materially-uniform sheet.
  for (let c = 0; c < cols; c += 2) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(c * cell, 0, cell, canvas.height);
  }

  // A spandrel/mechanical band every fourth row — real towers break
  // their glass into distinct floors, not one uninterrupted lattice.
  for (let r = 0; r < rows; r++) {
    if (r % 4 !== 3) continue;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, r * cell, canvas.width, cell * 0.42);
  }

  for (let r = 0; r < rows; r++) {
    if (r % 4 === 3) continue; // spandrel band — no window on this floor
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = c * cell;
      const y = r * cell;
      const pad = cell * 0.2;
      const w = cell - pad * 2;
      const h = cell - pad * 2;

      // Mullion frame: a darker inset border so each pane reads as
      // glass set into a frame rather than a flat rectangle floating
      // on the facade.
      ctx.fillStyle = "#242429";
      ctx.fillRect(x + pad - 2, y + pad - 2, w + 4, h + 4);

      const lit = seeded(idx, 41) > 0.3;
      if (lit) {
        // Both lit variants stay in the same cyan/blue family — no
        // warm/cream option — so the skyline reads as one coherent
        // techie-blue futuristic city rather than a mix of warm office
        // light and cool neon. Kept clearly saturated (not near-white)
        // even in the "bright" variant — a pane this close to white
        // clips to flat white the instant it's pushed through the
        // emissive intensity below, which is what read as a plain white
        // city instead of a blue one.
        const bright = seeded(idx, 42) > 0.5;
        ctx.fillStyle = bright ? "#8fd6ff" : "#3fb0ff";
      } else {
        ctx.fillStyle = "#17171c";
      }
      ctx.fillRect(x + pad, y + pad, w, h);
    }
  }

  cachedWindowGrid = new THREE.CanvasTexture(canvas);
  cachedWindowGrid.wrapS = THREE.RepeatWrapping;
  cachedWindowGrid.wrapT = THREE.RepeatWrapping;
  cachedWindowGrid.colorSpace = THREE.SRGBColorSpace;
  return cachedWindowGrid;
}

let cachedWindowEmissive: THREE.Texture | null = null;

/** Same grid, same lit/unlit seed as getWindowGridTexture (so the two
 * stay pixel-aligned when applied to the same UVs at the same
 * `.repeat`), but rendered as a pure emissive mask: black everywhere
 * except the lit panes, which are pushed to full brightness. Used as
 * an `emissiveMap` rather than `map` — emissive output is added on
 * top of a material's lit/tinted diffuse color rather than multiplied
 * into it, so a lit window glows at full brightness regardless of how
 * dark that particular building's own body tint is, the way an actual
 * light behind glass would outshine the concrete around it instead of
 * being dimmed by it. */
export function getWindowEmissiveTexture(): THREE.Texture {
  if (cachedWindowEmissive) return cachedWindowEmissive;
  const cols = 4;
  const rows = 10;
  const cell = 40;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    if (r % 4 === 3) continue; // spandrel band — no window on this floor
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const lit = seeded(idx, 41) > 0.3;
      if (!lit) continue;
      const x = c * cell;
      const y = r * cell;
      const pad = cell * 0.2;
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      // Same cyan/blue family as the diffuse map's lit panes (no
      // warm/white option) — this is what actually glows, so it's
      // what determines whether the city reads as "techie blue" or
      // as plain white office light. Pulled back from near-white so it
      // survives the emissiveIntensity multiply below as blue rather
      // than clipping to flat white.
      const bright = seeded(idx, 42) > 0.5;
      ctx.fillStyle = bright ? "#6fd2ff" : "#0fa0ff";
      ctx.fillRect(x + pad, y + pad, w, h);
    }
  }

  cachedWindowEmissive = new THREE.CanvasTexture(canvas);
  cachedWindowEmissive.wrapS = THREE.RepeatWrapping;
  cachedWindowEmissive.wrapT = THREE.RepeatWrapping;
  cachedWindowEmissive.colorSpace = THREE.SRGBColorSpace;
  return cachedWindowEmissive;
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
