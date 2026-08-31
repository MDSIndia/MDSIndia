import * as THREE from "three";

let cached: THREE.Texture | null = null;

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A vertical bark-streak texture — a flat solid brown reads as
 * painted plastic rather than wood; real bark has irregular vertical
 * ridges and tonal variation running with the grain. Shared and tiled
 * across every tree trunk in the scene (StreetTrees, TreeOfLife,
 * Biodome, SkyBridges, CityScape's rooftop trees) rather than each
 * building its own, so a single cached canvas covers all of them. */
export function getBarkTexture(): THREE.Texture {
  if (cached) return cached;
  const w = 64;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#2a1f14";
  ctx.fillRect(0, 0, w, h);

  // Irregular vertical ridges of varying width/tone running the full
  // height, wrapping around the trunk's own circumference.
  for (let i = 0; i < 40; i++) {
    const x = seeded(i, 701) * w;
    const rw = 1 + seeded(i, 702) * 3;
    const tone = seeded(i, 703);
    const shade =
      tone > 0.6
        ? "rgba(90,65,40,0.5)"
        : tone > 0.3
          ? "rgba(15,10,6,0.4)"
          : "rgba(50,36,22,0.35)";
    ctx.fillStyle = shade;
    ctx.fillRect(x, 0, rw, h);
  }

  // Faint horizontal grain breaks so the ridges don't read as
  // perfectly ruled lines.
  for (let i = 0; i < 30; i++) {
    const y = seeded(i, 704) * h;
    ctx.fillStyle = `rgba(10,7,4,${0.08 + seeded(i, 705) * 0.1})`;
    ctx.fillRect(0, y, w, 1.5 + seeded(i, 706) * 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  cached = texture;
  return texture;
}
