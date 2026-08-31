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
  // gives the alpha silhouette its lumpy, non-geometric edge.
  const blobCount = 9;
  for (let i = 0; i < blobCount; i++) {
    const angle = (i / blobCount) * Math.PI * 2 + seeded(i, 801) * 0.6;
    const dist = seeded(i, 802) * size * 0.24;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;
    const r = size * (0.26 + seeded(i, 803) * 0.16);
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.7, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

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
