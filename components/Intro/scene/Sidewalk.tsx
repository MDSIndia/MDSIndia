"use client";

import { useMemo } from "react";
import * as THREE from "three";

// Matches the road's own half-width (HighwayRoad's plane is 16 units
// wide, centered on x=0 — see the x >= 11 invariant CityScape and every
// street-level scatter (StreetTrees, Pedestrians) already build around)
// and the building line those files start at. Nothing new is being
// invented here — trees and pedestrians already confine themselves to
// roughly this x band — this just gives that already-implied strip an
// actual paved surface instead of it being unmarked ground texture
// indistinguishable from the plaza floor stretching off to the horizon.
const ROAD_HALF_WIDTH = 8;
const CURB_WIDTH = 0.14;
const SIDEWALK_OUTER_X = 10.9;
const ROAD_LENGTH = 220;
const ROAD_CENTER_Z = -30;

/** Light poured-concrete paving with a regular grid of expansion-joint
 * seams in both directions — a real sidewalk is laid in square/
 * rectangular slabs, unlike the road's own long, one-directional seams
 * (see roadSurface.ts), so this needs its own texture rather than
 * reusing that one. Noticeably lighter than both the dark asphalt and
 * the darker plaza/ground texture, the way poured concrete actually
 * reads next to worn blacktop. */
function buildSidewalkTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#565f68";
  ctx.fillRect(0, 0, size, size);

  // Blotchy staining, same technique Ground.tsx uses — a flat fill
  // reads as a rendered floor, not weathered concrete.
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 26;
    const shade = Math.random() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.06)";
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, shade);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Fine per-pixel grain for close-up detail.
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
  ctx.globalAlpha = 0.05;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;

  // Slab joints running both directions — one seam across the strip's
  // own width, several along its length, the grid a real poured
  // sidewalk is scored into (control joints every few feet so it
  // cracks predictably), rather than the road's one-directional seams.
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  for (let i = 1; i < 4; i++) {
    const pos = (i / 4) * size;
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 46);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

/** A faint wet-concrete sheen for the sidewalk — the road's own wet
 * reflection layer (HighwayRoad.tsx) stopped at the curb, so the
 * pavement looked bone-dry right next to a glistening street, which
 * reads as two different weather conditions in the same shot. Much
 * fainter than the road's own sheen (concrete holds far less standing
 * water/gloss than worn asphalt) and, learning from the road's own
 * fix, symmetric (0 -> peak -> 0) rather than a one-directional ramp —
 * a monotonic gradient snaps back to fully transparent at every tile
 * wrap, which is exactly the hard seam that read as blocky panels on
 * the road before that was fixed. */
function buildSidewalkSheenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
  grad.addColorStop(0, "rgba(120,170,220,0)");
  grad.addColorStop(0.5, "rgba(150,200,240,0.05)");
  grad.addColorStop(1, "rgba(120,170,220,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 22);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The paved strip between the road and the building line — a curb
 * (raised, distinctly lit geometry, not just a paint line) plus a
 * lighter concrete sidewalk surface with its own slab-joint texture.
 * Without this, the dark asphalt road ran directly into the same
 * generic plaza-floor texture that covers the entire ground plane out
 * to the horizon, with nothing marking where the street actually ends
 * and a walkable sidewalk begins — one of the more obvious "this is a
 * rendered floor, not a real street" gaps once you look for it. Static
 * geometry (four long meshes total, two per side), no animation
 * needed. */
export function Sidewalk() {
  const sidewalkTexture = useMemo(() => buildSidewalkTexture(), []);
  const sidewalkMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ map: sidewalkTexture, fog: true }),
    [sidewalkTexture]
  );
  const curbMaterial = useMemo(
    () => new THREE.MeshPhongMaterial({ color: "#7a828c", specular: "#aab4c0", shininess: 40, fog: true }),
    []
  );
  const sheenTexture = useMemo(() => buildSidewalkSheenTexture(), []);
  const sheenMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: sheenTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [sheenTexture]
  );

  const sidewalkWidth = SIDEWALK_OUTER_X - (ROAD_HALF_WIDTH + CURB_WIDTH);
  const sidewalkCenterX = ROAD_HALF_WIDTH + CURB_WIDTH + sidewalkWidth / 2;
  const curbCenterX = ROAD_HALF_WIDTH + CURB_WIDTH / 2;

  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Raised curb — real geometry standing slightly proud of
              both the road and the sidewalk slab, so it actually reads
              as a physical edge rather than a paint stripe. */}
          <mesh
            position={[side * curbCenterX, 0.045, ROAD_CENTER_Z]}
            material={curbMaterial}
          >
            <boxGeometry args={[CURB_WIDTH, 0.09, ROAD_LENGTH]} />
          </mesh>
          {/* Sidewalk paving. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[side * sidewalkCenterX, 0.018, ROAD_CENTER_Z]}
            material={sidewalkMaterial}
          >
            <planeGeometry args={[sidewalkWidth, ROAD_LENGTH]} />
          </mesh>
          {/* Faint wet sheen, sitting a hair above the paving so it
              never z-fights it. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[side * sidewalkCenterX, 0.02, ROAD_CENTER_Z]}
            material={sheenMaterial}
          >
            <planeGeometry args={[sidewalkWidth, ROAD_LENGTH]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
