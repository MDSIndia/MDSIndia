"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Slim energy pylons lining both edges of the highway with a pulsing
 * glow orb on top — cheap instanced pairs, reinforces the sense of
 * speed as they tick past. */
export function StreetLights({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 20 : 40;
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const orbRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const poleMatrices: THREE.Matrix4[] = [];
    const orbMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * 8.6;
      const z = 40 - (i / count) * 150 + (seeded(i, 51) - 0.5) * 3;

      dummy.position.set(x, 1.6, z);
      dummy.scale.set(0.045, 3.2, 0.045);
      dummy.updateMatrix();
      poleMatrices.push(dummy.matrix.clone());

      dummy.position.set(x, 3.25, z);
      dummy.scale.setScalar(0.14);
      dummy.updateMatrix();
      orbMatrices.push(dummy.matrix.clone());
    }

    return { poleMatrices, orbMatrices };
  }, [count]);

  useLayoutEffect(() => {
    const pole = poleRef.current;
    if (!pole) return;
    data.poleMatrices.forEach((m, i) => pole.setMatrixAt(i, m));
    pole.instanceMatrix.needsUpdate = true;
  }, [data]);

  useLayoutEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    data.orbMatrices.forEach((m, i) => orb.setMatrixAt(i, m));
    orb.instanceMatrix.needsUpdate = true;
  }, [data]);

  useFrame((state) => {
    const mat = orbRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.55 + Math.sin(state.clock.getElapsedTime() * 2.2) * 0.2;
  });

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#04040a" fog={false} />
      </instancedMesh>
      <instancedMesh ref={orbRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
