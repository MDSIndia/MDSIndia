"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";

/** Makes the highway itself feel engineered rather than a bare plane:
 * low glass-like energy guard rails running both edges, plus small
 * floating diamond-shaped lane-indicator markers hovering just above
 * the surface with a shared pulsing glow suggesting live embedded
 * lighting. Fixed world positions, animated only via opacity, so
 * there's no per-frame position math to get wrong — both are cheap
 * instanced passes. */
export function RoadDetails({ isMobile }: { isMobile: boolean }) {
  const railCount = isMobile ? 26 : 46;
  const chevronCount = isMobile ? 14 : 26;

  const railRef = useRef<THREE.InstancedMesh>(null);
  const railGlowRef = useRef<THREE.InstancedMesh>(null);
  const chevronRef = useRef<THREE.InstancedMesh>(null);

  const railData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const bodyMatrices: THREE.Matrix4[] = [];
    const glowMatrices: THREE.Matrix4[] = [];
    for (let i = 0; i < railCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * 8.15;
      const z = 42 - (i / railCount) * 165;

      dummy.position.set(x, 0.45, z);
      dummy.scale.set(0.05, 0.9, 1.7);
      dummy.updateMatrix();
      bodyMatrices.push(dummy.matrix.clone());

      dummy.position.set(x, 0.06, z);
      dummy.scale.set(0.09, 0.03, 1.7);
      dummy.updateMatrix();
      glowMatrices.push(dummy.matrix.clone());
    }
    return { bodyMatrices, glowMatrices };
  }, [railCount]);

  const chevronMatrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < chevronCount; i++) {
      const z = 40 - (i / chevronCount) * 160;
      dummy.position.set(0, 0.28, z);
      dummy.scale.set(0.22, 0.22, 0.22);
      dummy.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
    return matrices;
  }, [chevronCount]);

  useLayoutEffect(() => {
    const body = railRef.current;
    if (body) {
      railData.bodyMatrices.forEach((m, i) => body.setMatrixAt(i, m));
      body.instanceMatrix.needsUpdate = true;
    }
    const glow = railGlowRef.current;
    if (glow) {
      railData.glowMatrices.forEach((m, i) => glow.setMatrixAt(i, m));
      glow.instanceMatrix.needsUpdate = true;
    }
  }, [railData]);

  useLayoutEffect(() => {
    const mesh = chevronRef.current;
    if (!mesh) return;
    chevronMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [chevronMatrices]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const reveal = windowProgress(t, 1.9, 3.5);

    const glowMat = railGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (glowMat) glowMat.opacity = (0.55 + Math.sin(t * 1.4) * 0.2) * reveal;

    const railMat = railRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (railMat) railMat.opacity = 0.3 * reveal;

    const chevronMat = chevronRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (chevronMat) chevronMat.opacity = (0.4 + Math.sin(t * 3) * 0.2) * reveal;
  });

  return (
    <group>
      <instancedMesh ref={railRef} args={[undefined, undefined, railCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#0a1c33"
          transparent
          opacity={0.3}
          fog={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      <instancedMesh ref={railGlowRef} args={[undefined, undefined, railCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={chevronRef} args={[undefined, undefined, chevronCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#8fe6ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
