"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getParticleDotTexture } from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Glinting motes scattered through the corridor the camera flies down
 * toward the portal. The sky dome is infinitely far and never parallaxes,
 * so without nearby objects a flight through empty space has nothing to
 * show speed against; these static points sweep past the lens and supply
 * it. Fully static (no per-frame work): the motion comes from the camera.
 * Kept out of a clear tunnel around the flight axis so none can pop
 * through the lens. */
export function SpaceDust({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 220 : 480;
  const dot = useMemo(() => getParticleDotTexture(), []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const tmp = new THREE.Color();
    const palette = ["#ffffff"];
    for (let i = 0; i < count; i++) {
      const angle = seeded(i, 1) * Math.PI * 2;
      // 6 .. 36 units off the axis, weighted toward the inner part. The
      // inner clearance is wide enough that no mote ever passes close
      // enough to the lens to swell into a big grey disc.
      const radius = 6 + Math.pow(seeded(i, 2), 1.6) * 30;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 2.5 + Math.sin(angle) * radius;
      positions[i * 3 + 2] = 50 - seeded(i, 3) * 175;
      tmp.set(palette[i % palette.length]).multiplyScalar(0.55 + seeded(i, 4) * 0.45);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.11}
        map={dot}
        alphaMap={dot}
        alphaTest={0.05}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}
