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
  // Landed between the original 4x10 (panes read as chunky flat
  // blocks) and a since-tried 7x14 (so many small panes at once that
  // it stopped reading as individual windows and became a speckled
  // texture instead — a real tower's floor count and window bays are
  // nowhere near that dense at the distances this city is viewed
  // from). 5 columns keeps individual panes identifiable as windows
  // without either extreme.
  //
  // 60 rows rather than the original 11: this canvas is the *only*
  // window pattern every building in a given height bucket shares
  // (CityScape clones it per-bucket and just changes `.repeat`), so a
  // short base tile means the same handful of floors gets stamped out
  // over and over up a single tower — with the old 11-row tile, the
  // tallest bucket repeated it 20 times top to bottom, which is what
  // actually read as a printed/wallpaper pattern rather than distinct
  // floors. 60 unique rows cuts that down to under 4 repeats even for
  // the tallest bucket (see CityScape's repeat values), while still
  // being one cheap canvas built once and cached.
  const cols = 5;
  const rows = 60;
  const cell = 40;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;

  // Neutral dark grey rather than a blue-tinted base — real curtain
  // wall/concrete cladding is fundamentally grey; the blue cast here
  // was compounding with the (already blue) accent lerp on the body
  // color to make every facade read as molded from blue plastic.
  ctx.fillStyle = "#34363c";
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
    // A per-floor occupancy bias, on top of the per-pane roll below —
    // real towers read as whole floors that are dark (unoccupied,
    // after-hours) next to floors that are mostly lit, not every
    // single pane rolling independently. Without this, an all-panes-
    // iid grid lands on a uniform speckle at any density (the "TV
    // static" look), no matter how the per-pane rate is tuned, because
    // there's never a large lit or dark region for the eye to latch
    // onto. +-0.3 swing around the base 0.46 threshold below.
    const floorBias = (seeded(r, 141) - 0.5) * 0.6;
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
      ctx.fillStyle = "#131417";
      ctx.fillRect(x + pad - 2, y + pad - 2, w + 4, h + 4);

      // A real occupied tower at night is a mix, not uniformly lit and
      // not mostly dark either — a third read as too empty (blank,
      // abandoned-looking voids across the facade), all-lit read as a
      // stadium. Roughly half lit lands on an actually inhabited-
      // looking building, with floorBias above clustering that mix
      // into whole lit/dark floors rather than independent noise.
      const lit = seeded(idx, 41) > 0.46 - floorBias;
      if (lit) {
        // Blue-dominant, techie-cyberpunk mix rather than a realistic
        // warm-incandescent skyline — most panes read as cool
        // fluorescent/LED office blue, with a warm exception (an
        // incandescent lamp, a branded sign) kept in the minority so
        // the facade still reads as lit variety rather than monotone.
        const bright = seeded(idx, 42) > 0.5;
        const warm = seeded(idx, 90) > 0.7;
        if (warm) {
          // Pale warm white rather than a saturated orange — a real
          // incandescent/warm-LED window at night reads as off-white
          // with a warm cast, not construction-vest orange; the old
          // "#ffb15e" was far too saturated to pass as room light.
          ctx.fillStyle = bright ? "#fff3dc" : "#ffe3b0";
        } else {
          // A real, saturated techie blue rather than near-white with
          // just a faint cool cast — this is the dominant pane color
          // now, so it needs to actually read as blue rather than
          // disappear into off-white.
          ctx.fillStyle = bright ? "#9fd8ff" : "#5fa8dd";
        }
      } else {
        // Blue-black rather than neutral black, so even the "off"
        // panes still carry the city's blue cast instead of reading as
        // pure neutral gaps in the facade — but a real dark window
        // at night doesn't read as flat matte black, it reads as
        // glass: a faint diagonal sky/cloud reflection streak across
        // each pane, angled the same way on every pane so it reads as
        // one continuous reflection sweeping across the facade rather
        // than per-pane noise.
        const reflectStop = Math.min(1, Math.max(0, 0.45 + 0.25 * Math.sin(idx * 0.7)));
        const reflectGrad = ctx.createLinearGradient(x, y, x + cell, y + cell);
        reflectGrad.addColorStop(0, "#0b0c0f");
        reflectGrad.addColorStop(reflectStop, "#23262c");
        reflectGrad.addColorStop(1, "#0b0c0f");
        ctx.fillStyle = reflectGrad;
      }
      ctx.fillRect(x + pad, y + pad, w, h);

      // A little per-pane brightness jitter — real curtain-wall panels
      // never come out perfectly identical (batch variation, dirt,
      // reflections), and a texture where every pane is bit-for-bit
      // the same fill color is a big part of what reads as a printed
      // pattern instead of a photographed facade.
      const jitter = seeded(idx, 91) * 0.16;
      ctx.fillStyle = seeded(idx, 92) > 0.5 ? `rgba(255,255,255,${jitter})` : `rgba(0,0,0,${jitter})`;
      ctx.fillRect(x + pad, y + pad, w, h);
    }
  }

  // Fine per-pixel grain over the whole facade, breaking up the flat,
  // vector-clean edges a canvas fill otherwise produces. Built on a
  // separate offscreen canvas and composited in with drawImage rather
  // than ctx.putImageData directly onto the facade canvas — putImageData
  // overwrites pixels outright (color *and* alpha) instead of blending,
  // which would erase the window pattern just drawn instead of subtly
  // texturing it; drawImage honors globalAlpha like any other draw call.
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = canvas.width;
  grainCanvas.height = canvas.height;
  const grainCtx = grainCanvas.getContext("2d")!;
  const grain = grainCtx.createImageData(canvas.width, canvas.height);
  for (let p = 0; p < grain.data.length; p += 4) {
    const n = Math.random() * 255;
    grain.data[p] = n;
    grain.data[p + 1] = n;
    grain.data[p + 2] = n;
    grain.data[p + 3] = 255;
  }
  grainCtx.putImageData(grain, 0, 0);
  ctx.globalAlpha = 0.05;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;

  cachedWindowGrid = new THREE.CanvasTexture(canvas);
  cachedWindowGrid.wrapS = THREE.RepeatWrapping;
  cachedWindowGrid.wrapT = THREE.RepeatWrapping;
  cachedWindowGrid.colorSpace = THREE.SRGBColorSpace;
  // Without this, a tiled texture viewed at a grazing angle (a tower
  // facade seen nearly edge-on, or a sharply tapered surface like the
  // faceted archetype) blurs heavily in one direction under Three's
  // default mipmap filtering — that smeared look is what read as a
  // rendering glitch rather than a window grid. A fixed value rather
  // than reading the renderer's actual capability: this module has no
  // renderer reference, and any hardware exceeding this just clamps
  // to its own max, so it's a safe upper bound either way.
  cachedWindowGrid.anisotropy = 16;
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
  const cols = 5;
  const rows = 60;
  const cell = 40;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    if (r % 4 === 3) continue; // spandrel band — no window on this floor
    // Same per-floor bias as getWindowGridTexture, same salt, so the
    // emissive mask stays pixel-aligned with which panes the diffuse
    // map actually drew as lit.
    const floorBias = (seeded(r, 141) - 0.5) * 0.6;
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const lit = seeded(idx, 41) > 0.46 - floorBias;
      if (!lit) continue;
      const x = c * cell;
      const y = r * cell;
      const pad = cell * 0.2;
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      // Same warm/cool split and thresholds as the diffuse map's lit
      // panes (same salts, so the two stay pixel-aligned) — this is
      // what actually glows, pulled back from full saturation so it
      // survives the emissiveIntensity multiply below as a real lamp
      // color rather than clipping to flat white.
      const bright = seeded(idx, 42) > 0.5;
      const warm = seeded(idx, 90) > 0.7;
      ctx.fillStyle = warm ? (bright ? "#ffedc7" : "#ffdb9e") : bright ? "#bfe4ff" : "#7fb8e8";
      ctx.fillRect(x + pad, y + pad, w, h);
    }
  }

  cachedWindowEmissive = new THREE.CanvasTexture(canvas);
  cachedWindowEmissive.wrapS = THREE.RepeatWrapping;
  cachedWindowEmissive.wrapT = THREE.RepeatWrapping;
  cachedWindowEmissive.colorSpace = THREE.SRGBColorSpace;
  cachedWindowEmissive.anisotropy = 16;
  return cachedWindowEmissive;
}

let cachedWindowNormal: THREE.Texture | null = null;

/** The single biggest reason the facade still read as a printed decal
 * rather than a real surface, no matter how correct its colors were: a
 * `map` alone only changes color, never how light falls across the
 * face, so every pane sat perfectly flush and flat under the rig
 * light regardless of viewing angle — the exact "flat texture" tell.
 * This derives an actual bump from the same grid a real curtain wall
 * has: glass panes sit slightly proud of their recessed mullion frame.
 * Built in two passes — a greyscale heightmap (pane = raised, frame =
 * recessed, softly blurred so the bevel isn't a knife edge), then a
 * per-pixel Sobel-style finite-difference pass over that heightmap to
 * derive the actual tangent-space normal at each texel. Same
 * cols/rows/cell as getWindowGridTexture so it lines up pane-for-pane
 * when applied at the same `.repeat`. */
export function getWindowNormalTexture(): THREE.Texture {
  if (cachedWindowNormal) return cachedWindowNormal;
  const cols = 5;
  const rows = 60;
  const cell = 40;
  const width = cols * cell;
  const height = rows * cell;

  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = width;
  heightCanvas.height = height;
  const hctx = heightCanvas.getContext("2d")!;
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, width, height);
  for (let r = 0; r < rows; r++) {
    if (r % 4 === 3) continue; // spandrel band — flush with the wall, no pane
    for (let c = 0; c < cols; c++) {
      const x = c * cell;
      const y = r * cell;
      const pad = cell * 0.2;
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      hctx.fillStyle = "#d2d2d2";
      hctx.fillRect(x + pad, y + pad, w, h);
    }
  }
  // A slight blur so the derived normal ramps smoothly across a couple
  // of texels at each pane edge (a real bevel) instead of spiking at a
  // single hard-edged pixel boundary.
  hctx.filter = "blur(1.4px)";
  hctx.drawImage(heightCanvas, 0, 0);
  hctx.filter = "none";

  const heightData = hctx.getImageData(0, 0, width, height).data;
  const sampleHeight = (x: number, y: number) => {
    const xi = (x + width) % width;
    const yi = (y + height) % height;
    return heightData[(yi * width + xi) * 4] / 255;
  };

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const nctx = normalCanvas.getContext("2d")!;
  const normalImage = nctx.createImageData(width, height);
  // How pronounced the resulting bevel reads — high enough that the
  // rig light visibly rakes across each pane edge as the camera moves
  // past, low enough that it stays an architectural detail rather than
  // a corrugated washboard.
  const strength = 2.4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hl = sampleHeight(x - 1, y);
      const hr = sampleHeight(x + 1, y);
      const hu = sampleHeight(x, y - 1);
      const hd = sampleHeight(x, y + 1);
      const nx = (hl - hr) * strength;
      const ny = (hu - hd) * strength;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const p = (y * width + x) * 4;
      normalImage.data[p] = ((nx / len) * 0.5 + 0.5) * 255;
      normalImage.data[p + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      normalImage.data[p + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      normalImage.data[p + 3] = 255;
    }
  }
  nctx.putImageData(normalImage, 0, 0);

  cachedWindowNormal = new THREE.CanvasTexture(normalCanvas);
  cachedWindowNormal.wrapS = THREE.RepeatWrapping;
  cachedWindowNormal.wrapT = THREE.RepeatWrapping;
  cachedWindowNormal.anisotropy = 16;
  return cachedWindowNormal;
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
