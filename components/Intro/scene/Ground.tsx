"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** A patchy concrete/pavement texture rather than one flat fill color —
 * a real sidewalk/plaza surface has uneven staining, seams and grime,
 * and a perfectly uniform color underneath the whole skyline is a big
 * part of what reads as a rendered floor rather than actual ground. */
function buildGroundTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#070b14";
  ctx.fillRect(0, 0, size, size);

  // Blotchy patches of slightly lighter/darker concrete — weathering
  // and staining rather than a single uniform tone.
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 14 + Math.random() * 46;
    const shade = Math.random() > 0.5 ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)";
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, shade);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Fine per-pixel grain on top for close-up detail. Composited via a
  // separate offscreen canvas + drawImage rather than ctx.putImageData
  // directly onto the ground canvas — putImageData overwrites pixels
  // outright (it ignores alpha compositing entirely), which would have
  // erased the blotchy weathering patches just drawn instead of
  // texturing over them; drawImage honors globalAlpha like any other
  // draw call.
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = size;
  grainCanvas.height = size;
  const grainCtx = grainCanvas.getContext("2d")!;
  const grain = grainCtx.createImageData(size, size);
  for (let p = 0; p < grain.data.length; p += 4) {
    const n = Math.random() * 255;
    grain.data[p] = n;
    grain.data[p + 1] = n;
    grain.data[p + 2] = n;
    grain.data[p + 3] = 255;
  }
  grainCtx.putImageData(grain, 0, 0);
  ctx.globalAlpha = 0.07;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;

  // Occasional expansion-joint seams, the way real paved plazas are
  // poured/cut in sections rather than one continuous slab.
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const pos = (i / 6) * size + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 26);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Seen almost edge-on toward the horizon — the grazing-angle case
  // that blurs heavily under Three's default mipmap filtering without
  // this.
  texture.anisotropy = 16;
  return texture;
}

/** A wide ground plane beneath the whole city corridor. Without it,
 * everything outside the narrow 16-unit road — which is every
 * building, since they all sit at x >= 11 — has nothing physically
 * connecting it to the street; the skyline reads as floating rather
 * than standing on anything. A single cheap plane fixes that for the
 * whole scene at once, lit by the same rig light as the buildings so
 * it picks up a soft gradient across it rather than sitting as a flat,
 * disconnected color underneath everything. */
export function Ground() {
  const material = useMemo(() => {
    const map = buildGroundTexture();
    return new THREE.MeshLambertMaterial({ map, fog: true });
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -30]} material={material}>
      <planeGeometry args={[260, 260]} />
    </mesh>
  );
}
