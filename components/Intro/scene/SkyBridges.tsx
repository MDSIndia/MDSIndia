"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Glass sky bridges spanning the highway between towers, with a
 * glowing underside strip — cheap instanced geometry, subtle pulse. */
export function SkyBridges({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 5 : 9;
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const bodyMatrices: THREE.Matrix4[] = [];
    const edgeMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < count; i++) {
      const z = 30 - seeded(i, 31) * 120;
      const y = 10 + seeded(i, 32) * 28;
      const span = 30 + seeded(i, 33) * 14;
      const tilt = (seeded(i, 34) - 0.5) * 0.06;

      dummy.position.set(0, y, z);
      dummy.rotation.set(0, tilt, 0);
      dummy.scale.set(span, 0.18, 0.55);
      dummy.updateMatrix();
      bodyMatrices.push(dummy.matrix.clone());

      dummy.position.set(0, y - 0.13, z);
      dummy.scale.set(span - 1, 0.03, 0.62);
      dummy.updateMatrix();
      edgeMatrices.push(dummy.matrix.clone());
    }

    return { bodyMatrices, edgeMatrices };
  }, [count]);

  useLayoutEffect(() => {
    const mesh = bodyRef.current;
    if (!mesh) return;
    data.bodyMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [data]);

  useLayoutEffect(() => {
    const mesh = edgeRef.current;
    if (!mesh) return;
    data.edgeMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [data]);

  useFrame(() => {
    const mat = edgeRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.16;
  });

  return (
    <group>
      {/* Lit (Lambert) rather than flat MeshBasicMaterial — an unlit
          panel this dark reads as nearly invisible against a night
          sky, which is exactly what let the additive edge strip below
          dominate as a stray glowing bar instead of a physical
          structure. A lit, more opaque body actually catches the rig
          light and reads as glass/metal spanning the road. */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial
          color="#26364f"
          transparent
          opacity={0.75}
          fog
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* A subtle underside accent, not the dominant element — pulled
          back in both opacity and size so it reads as trim on the
          bridge rather than a bright line floating on its own. */}
      <instancedMesh ref={edgeRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#8fb4d8"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
