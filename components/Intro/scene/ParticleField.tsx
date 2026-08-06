"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const AMBIENT_COUNT_DESKTOP = 200;
const AMBIENT_COUNT_MOBILE = 90;

/** A slow ambient drift of dust/haze motes establishing the night air
 * along the corridor. Used to include a second system of huge bright
 * streaking "warp speed" lines blasting down the highway — a leftover
 * from this cinematic's original sci-fi concept that reads as a
 * rendering glitch more than atmosphere once the rest of the scene
 * moved toward a natural, realistic city, so it's gone; ambient dust
 * is the only motion cue this layer contributes now. */
export function ParticleField({ isMobile }: { isMobile: boolean }) {
  const ambientCount = isMobile ? AMBIENT_COUNT_MOBILE : AMBIENT_COUNT_DESKTOP;

  const ambientRef = useRef<THREE.Points>(null);

  const ambientGeo = useMemo(() => {
    const positions = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      positions[i * 3] = (seeded(i, 1) - 0.5) * 42;
      positions[i * 3 + 1] = seeded(i, 2) * 22;
      positions[i * 3 + 2] = 46 - seeded(i, 3) * 110;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [ambientCount]);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const ambientMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.14,
        color: "#dfe6ee",
        transparent: true,
        opacity: 0,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: circleTexture,
        alphaMap: circleTexture,
        alphaTest: 0.05,
      }),
    [circleTexture]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    ambientMaterial.opacity = windowProgress(t, 0, 2.0) * 0.4;
    if (ambientRef.current) ambientRef.current.rotation.y += delta * 0.01;
  });

  return <points ref={ambientRef} geometry={ambientGeo} material={ambientMaterial} />;
}
