"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";
import {
  ASPHALT_COLOR,
  ROAD_EDGE_LINE_COLOR,
  ROAD_DASH_LINE_COLOR,
  paintAsphaltGrain,
  applyRoadTextureDefaults,
} from "./roadSurface";

function buildRoadTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Plain dark asphalt rather than glossy black glass — a real road
  // surface is matte and slightly uneven, not a mirrored panel. Same
  // shared color/grain every paved surface in the scene uses, so the
  // highway and the cross streets read as one continuous material.
  ctx.fillStyle = ASPHALT_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  paintAsphaltGrain(ctx, canvas.width, canvas.height);

  // Solid white shoulder lines along both edges of the two-lane carriageway.
  ctx.strokeStyle = ROAD_EDGE_LINE_COLOR;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(14, canvas.height);
  ctx.moveTo(canvas.width - 14, 0);
  ctx.lineTo(canvas.width - 14, canvas.height);
  ctx.stroke();

  // Dashed white lane divider down the center — standard highway
  // road-marking proportions rather than an "energy" line.
  ctx.strokeStyle = ROAD_DASH_LINE_COLOR;
  ctx.lineWidth = 4;
  ctx.setLineDash([34, 26]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 48);
  applyRoadTextureDefaults(texture);
  return texture;
}

export function HighwayRoad() {
  const texture = useMemo(() => buildRoadTexture(), []);
  // fog: false — with it on, the road fades toward the (dark early,
  // then brightening) fog color as it recedes into the distance, which
  // combined with ACES tone mapping's non-linear response made the
  // same asphalt color read as very different shades depending on how
  // far down the road a given patch was from the camera. Turning fog
  // off here means the road always shows its true, consistent color —
  // the one surface in the scene where matching color mattered more
  // than atmospheric distance-fade.
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, fog: false }),
    [texture]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Peak scroll speed is deliberately higher than the raw camera
    // velocity would justify — road light streaks moving fast is one
    // of the strongest "we are going fast" cues cinema uses, and it's
    // free to tune independently of how fast the camera actually
    // translates through the world.
    const speed = 0.6 + windowProgress(t, 2.6, 8.0) * 7.2;
    texture.offset.y -= speed * delta;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      // y=0.025 — slightly above CrossStreets' own y=0.02 (itself above
      // CityScape's per-building contact-shadow discs at y=0.01, or a
      // building near the road would darken the asphalt right through
      // it). Two coplanar road meshes overlapping at an intersection
      // z-fight: with equal depth, which one wins is decided by
      // Three's internal opaque render-order sort, not JSX order, so
      // it isn't safe to just leave both at the same height and hope —
      // that non-deterministic fight (not a real texture/color
      // difference) was what made the cross streets read as a
      // different shade of asphalt in the overlap. A small, deliberate
      // epsilon makes the through-road win every time, the same way a
      // real intersection's main route reads as continuous.
      position={[0, 0.025, -30]}
      material={material}
    >
      <planeGeometry args={[16, 220]} />
    </mesh>
  );
}
