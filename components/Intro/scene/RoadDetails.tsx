"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Makes the highway itself feel engineered rather than a bare plane:
 * plain metal guard rails running both edges (with a dim reflective
 * strip along the top, the way real galvanized rail catches headlights)
 * plus small amber reflective road studs set into the lane divider.
 * Fixed world positions, animated only via a faint reflective flicker,
 * so there's no per-frame position math to get wrong — both are cheap
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
      dummy.position.set(0, 0.03, z);
      dummy.scale.set(0.16, 0.03, 0.16);
      dummy.rotation.set(0, Math.PI / 4, 0);
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

    // A faint, irregular sparkle rather than a smooth pulse — real
    // galvanized rail catches passing headlight glints unevenly, not a
    // uniform breathing glow.
    const glowMat = railGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (glowMat) glowMat.opacity = 0.22 + Math.max(0, Math.sin(t * 3.1)) * 0.12;

    const railMat = railRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (railMat) railMat.opacity = 0.85;

    // Reflective road studs catch light steadily, no visible pulse.
    const chevronMat = chevronRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (chevronMat) chevronMat.opacity = 0.7;
  });

  return (
    <group>
      <instancedMesh ref={railRef} args={[undefined, undefined, railCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial
          color="#5a5f68"
          transparent
          opacity={0.85}
          fog
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Thin top edge of the rail — a dim highlight strip rather than
          an additive neon glow. */}
      <instancedMesh ref={railGlowRef} args={[undefined, undefined, railCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#c7cdd6"
          transparent
          opacity={0.3}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* Amber reflective road studs set into the lane divider. */}
      <instancedMesh ref={chevronRef} args={[undefined, undefined, chevronCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.7} fog={false} />
      </instancedMesh>
    </group>
  );
}
