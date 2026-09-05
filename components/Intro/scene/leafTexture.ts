import * as THREE from "three";

let cached: THREE.Texture | null = null;

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** An organic leaf-cluster card — the actual fix for "trees look
 * artificial": every previous pass built canopies out of 3D geometric
 * primitives (spheres, icosahedrons), and no amount of subdivision or
 * lobe-count tuning changes that a *shape built from polygons* reads
 * as geometric rather than organic. Real-time trees that read as
 * natural (games, not just this scene) almost never model leaves as
 * solid geometry at all — they paint a soft, irregular leaf-cluster
 * silhouette onto a flat card and cut it out with alpha, so the
 * *silhouette* is organic even though the underlying mesh is a plane.
 * Built from several overlapping soft circles (a cheap "metaball"
 * cloud) rather than one clean circle, so the alpha edge itself is
 * lumpy/irregular — that irregular edge is what actually reads as
 * foliage instead of a shape. White/neutral rather than pre-colored so
 * callers can still tint per-instance via color/instanceColor, same as
 * every other tinted texture in this scene. */
export function getLeafCardTexture(): THREE.Texture {
  if (cached) return cached;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Build the cluster from several overlapping soft blobs rather than
  // one circle — the union of irregular, off-center blobs is what
  // gives the alpha silhouette its lumpy, non-geometric edge. Steeper
  // falloff near the edge (was a gradual 0.7->1 taper) than the first
  // pass — at explicit "well defined" request: alphaTest cuts a hard
  // line wherever the gradient crosses its threshold, and a gradual
  // taper left that cut line landing somewhere soft/fuzzy-looking
  // depending on exactly where 0.45 fell; a sharper shoulder keeps the
  // cut crisp while the underlying blob shape stays organic.
  const blobCount = 9;
  for (let i = 0; i < blobCount; i++) {
    const angle = (i / blobCount) * Math.PI * 2 + seeded(i, 801) * 0.6;
    const dist = seeded(i, 802) * size * 0.24;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;
    const r = size * (0.26 + seeded(i, 803) * 0.16);
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.98)");
    grad.addColorStop(0.82, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A branching glow-vein pattern radiating from the base — the
  // bioluminescent "lit circuitry" language every other part of this
  // scene's trees already carries (trunk veins, roots, crystal leaves),
  // extended onto the leaf silhouette itself so individual leaf cards
  // read as glowing organic-tech foliage rather than plain cutouts, at
  // explicit "futuristic" request. Drawn with "lighter" so the veins
  // only brighten, never punch new alpha holes.
  ctx.globalCompositeOperation = "lighter";
  const drawVein = (x0: number, y0: number, angle: number, len: number, depth: number) => {
    if (depth <= 0 || len < size * 0.03) return;
    const x1 = x0 + Math.cos(angle) * len;
    const y1 = y0 + Math.sin(angle) * len;
    ctx.strokeStyle = `rgba(190,255,225,${0.28 + depth * 0.06})`;
    ctx.lineWidth = size * 0.006 * (depth + 1);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    // Two branches, narrower and shorter, continuing roughly the same
    // direction — a leaf's own vein structure forks rather than
    // running as single straight lines.
    drawVein(x1, y1, angle - 0.4 - seeded(depth, 821) * 0.3, len * 0.62, depth - 1);
    drawVein(x1, y1, angle + 0.4 + seeded(depth, 822) * 0.3, len * 0.62, depth - 1);
  };
  // Kept short/close to center rather than reaching toward the blob
  // cluster's own outer edge — "lighter" adds alpha as well as color,
  // so a vein stroke landing on a fully-transparent area outside the
  // blobs' actual coverage would show up as a stray glowing line
  // floating past the leaf's own silhouette instead of staying inside
  // it.
  const veinBaseAngle = -Math.PI / 2 + (seeded(1, 823) - 0.5) * 0.6;
  drawVein(cx, cy + size * 0.16, veinBaseAngle, size * 0.12, 3);

  // Darker internal patches — real foliage clumps have visible shadow
  // gaps between leaf clusters, not one flat lit surface. Drawn with
  // "multiply" so they only darken where the cluster is already
  // opaque, never punch new holes in the alpha silhouette.
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 10; i++) {
    const angle = seeded(i, 811) * Math.PI * 2;
    const dist = seeded(i, 812) * size * 0.3;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const r = size * (0.08 + seeded(i, 813) * 0.1);
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    const shade = 0.55 + seeded(i, 814) * 0.25;
    grad.addColorStop(0, `rgba(${shade * 255},${shade * 255},${shade * 255},0.8)`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cached = texture;
  return texture;
}
