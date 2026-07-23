"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const ZERO_SCALE = new THREE.Matrix4().makeScale(0, 0, 0);
const ZERO_COLOR = new THREE.Color(0, 0, 0);

/** A backdrop layer of huge, distant building silhouettes set far
 * beyond the flanking skyline, spanning a much wider stretch of the
 * horizon. Being both further away and much taller than the near
 * skyline, they naturally read as a second depth plane — the near
 * towers slide past quickly while these barely seem to move, which is
 * exactly what real parallax looks like, for free, just from being
 * far away. Flat silhouettes (fog does the atmospheric-haze fading)
 * with only a sparse scatter of tiny window lights so they stay a
 * backdrop, not a competing layer of detail. */
export function DistantSkyline({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 34 : 60;
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const bodyMatrices: THREE.Matrix4[] = [];
    const bodyColors: THREE.Color[] = [];
    const lightMatrices: THREE.Matrix4[] = [];
    const lightColors: THREE.Color[] = [];
    const palette = ["#00D4FF", "#7B2FBE", "#0055FF"];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (55 + seeded(i, 71) * 70);
      const z = 90 - seeded(i, 72) * 260;
      const height = 26 + seeded(i, 73) * 70;
      const width = 6 + seeded(i, 74) * 12;

      dummy.position.set(x, height / 2, z);
      dummy.scale.set(width, height, width);
      dummy.rotation.set(0, seeded(i, 75) * Math.PI, 0);
      dummy.updateMatrix();
      bodyMatrices.push(dummy.matrix.clone());
      const haze = 0.03 + seeded(i, 76) * 0.02;
      bodyColors.push(new THREE.Color(haze, haze, haze + 0.015));

      // A sparse handful of tiny window lights per silhouette — just
      // enough to read as "distant lit city," not enough to compete
      // with the detailed near skyline.
      const lightCount = 2 + Math.floor(seeded(i, 77) * 3);
      for (let l = 0; l < lightCount; l++) {
        dummy.position.set(
          x + (seeded(i * 7 + l, 78) - 0.5) * width * 0.7,
          height * (0.2 + seeded(i * 7 + l, 79) * 0.7),
          z + (seeded(i * 7 + l, 80) - 0.5) * width * 0.7
        );
        dummy.scale.set(0.35, 0.35, 0.35);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        lightMatrices.push(dummy.matrix.clone());
        lightColors.push(new THREE.Color(palette[(i + l) % palette.length]));
      }
    }

    // The light-instance mesh is sized for the worst case (every
    // building rolling the max light count); pad any unused capacity
    // with zero-scale placeholders so no stray instance sits at the
    // default identity matrix (which would render as a visible box
    // at the origin).
    while (lightMatrices.length < count * 5) {
      lightMatrices.push(ZERO_SCALE.clone());
      lightColors.push(ZERO_COLOR.clone());
    }

    return { bodyMatrices, bodyColors, lightMatrices, lightColors };
  }, [count]);

  useLayoutEffect(() => {
    const mesh = bodyRef.current;
    if (!mesh) return;
    data.bodyMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    data.bodyColors.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  useLayoutEffect(() => {
    const mesh = lightsRef.current;
    if (!mesh) return;
    data.lightMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    data.lightColors.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mat = lightsRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (mat) mat.opacity = 0.5 + Math.sin(t * 0.7) * 0.2;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors fog />
      </instancedMesh>
      <instancedMesh
        ref={lightsRef}
        args={[undefined, undefined, count * 5]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
