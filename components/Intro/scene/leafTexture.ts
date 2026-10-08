import * as THREE from "three";

let cached: THREE.Texture | null = null;

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A foliage-cluster card, cut out with alpha, built from individual
 * leaves rather than smooth blobs.
 *
 * The earlier version unioned a few soft circles into one lumpy disc
 * with a glow-vein pattern on top. Even lumpy, a disc with a smooth
 * outline reads as a plastic bush or cut-paper cloud: real foliage has
 * a *serrated* silhouette (leaf tips poking out on every side), little
 * gaps of sky showing through, and a clear light-to-dark structure —
 * sunlit leaves on top, shaded ones underneath and deeper in.
 *
 * So: a dark, mostly opaque core (so the crown has body and no big
 * see-through holes), then a few hundred small pointed leaves scattered
 * through a lumpy envelope, each at its own angle and brightness,
 * lighter toward the top of the card. The envelope is thinned toward
 * its edge, so the outline is made of leaf tips instead of a clean
 * curve. White/grey rather than pre-colored: callers tint per instance
 * (color/instanceColor), and the grey values here become the light/
 * shadow variation within that tint. */
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

  // Lumpy envelope: a handful of offset circles. A point is "inside" if
  // it falls within any of them, which gives the crown an uneven,
  // asymmetric outline to hang the leaf tips on.
  const lobes = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2 + seeded(i, 801) * 0.7;
    const dist = seeded(i, 802) * size * 0.2;
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist * 0.85,
      r: size * (0.22 + seeded(i, 803) * 0.1),
    };
  });
  const inEnvelope = (x: number, y: number) =>
    lobes.some((l) => (x - l.x) ** 2 + (y - l.y) ** 2 < l.r * l.r);

  // Dark core: a smaller solid blob so the crown reads as dense and
  // shadowed at its heart, rather than a thin screen of leaves.
  for (const l of lobes) {
    const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.82);
    grad.addColorStop(0, "rgba(96,96,96,1)");
    grad.addColorStop(0.8, "rgba(84,84,84,1)");
    grad.addColorStop(1, "rgba(84,84,84,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r * 0.82, 0, Math.PI * 2);
    ctx.fill();
  }

  // Leaves: small pointed ovals at random angles. Drawn back-to-front by
  // brightness so the lighter (sunlit, top) leaves sit over the darker
  // ones and the structure reads; the sample count falls off toward the
  // envelope's edge so the outline is ragged, not a clean curve.
  const leafCount = 520;
  const leaves: { x: number; y: number; a: number; len: number; shade: number }[] = [];
  let attempts = 0;
  for (let i = 0; leaves.length < leafCount && attempts < leafCount * 6; attempts++) {
    const x = cx + (seeded(attempts, 811) - 0.5) * size * 0.95;
    const y = cy + (seeded(attempts, 812) - 0.5) * size * 0.95;
    if (!inEnvelope(x, y)) continue;
    // Thin out near the envelope edge: reject more points the closer
    // they are to leaving it, by testing a slightly shrunk envelope.
    const nearEdge = !lobes.some((l) => (x - l.x) ** 2 + (y - l.y) ** 2 < (l.r * 0.78) ** 2);
    if (nearEdge && seeded(attempts, 813) > 0.38) continue;
    const topness = 1 - y / size; // 1 at the top of the card
    const shade = 0.5 + topness * 0.38 + (seeded(attempts, 814) - 0.5) * 0.22;
    leaves.push({
      x,
      y,
      a: seeded(attempts, 815) * Math.PI * 2,
      len: size * (0.075 + seeded(attempts, 816) * 0.07),
      shade: Math.min(1, Math.max(0.28, shade)),
    });
    i++;
  }
  leaves.sort((p, q) => p.shade - q.shade);

  for (const leaf of leaves) {
    const v = Math.round(leaf.shade * 255);
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.a);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const half = leaf.len / 2;
    const w = leaf.len * 0.27;
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.quadraticCurveTo(w, 0, 0, half);
    ctx.quadraticCurveTo(-w, 0, 0, -half);
    ctx.fill();
    // Midrib: a faint lighter line down the leaf — a tiny cue that makes
    // each shape read as a leaf instead of a grain, visible up close.
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + leaf.shade * 0.12})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.8);
    ctx.lineTo(0, half * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cached = texture;
  return texture;
}
