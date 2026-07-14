"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";

function buildRoadTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04040f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // reflective black-glass sheen bands
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(0, i * 90, canvas.width, 3);
  }

  // glowing cyan edge strips
  ctx.strokeStyle = "rgba(0,212,255,0.95)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(9, canvas.height);
  ctx.moveTo(canvas.width - 9, 0);
  ctx.lineTo(canvas.width - 9, canvas.height);
  ctx.stroke();

  // dashed energy divider down the center
  ctx.strokeStyle = "rgba(170,240,255,0.85)";
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 24]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  // faint speed cross-ties
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(0,150,255,0.16)";
  ctx.lineWidth = 2;
  for (let y = 0; y < canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 48);
  return texture;
}

export function HighwayRoad() {
  const texture = useMemo(() => buildRoadTexture(), []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture }),
    [texture]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Peak scroll speed is deliberately higher than the raw camera
    // velocity would justify — road light streaks moving fast is one
    // of the strongest "we are going fast" cues cinema uses, and it's
    // free to tune independently of how fast the camera actually
    // translates through the world.
    const speed = 0.4 + windowProgress(t, 2.6, 8.0) * 4.8;
    texture.offset.y -= speed * delta;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, -30]}
      material={material}
    >
      <planeGeometry args={[16, 220]} />
    </mesh>
  );
}
