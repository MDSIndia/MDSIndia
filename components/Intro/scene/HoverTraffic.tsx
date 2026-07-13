"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

interface Drone {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  radius: number;
  color: THREE.Color;
}

/** Small hover vehicles / drones orbiting lazily through the skyline —
 * a body instance plus a soft additive glow halo, animated per-instance
 * via a circling path so the city reads as inhabited and moving. */
export function HoverTraffic({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 8 : 16;
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  const drones = useMemo<Drone[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        baseX: (seeded(i, 41) - 0.5) * 30,
        baseY: 8 + seeded(i, 42) * 24,
        baseZ: 40 - seeded(i, 43) * 140,
        speed: 0.3 + seeded(i, 44) * 0.6,
        radius: 1.5 + seeded(i, 45) * 3,
        color: new THREE.Color(i % 2 === 0 ? "#00e5ff" : "#ff5fd8"),
      })),
    [count]
  );

  useLayoutEffect(() => {
    const mesh = bodyRef.current;
    const glow = glowRef.current;
    if (!mesh || !glow) return;
    const dummy = new THREE.Object3D();
    drones.forEach((d, i) => {
      dummy.position.set(d.baseX, d.baseY, d.baseZ);
      dummy.scale.set(0.14, 0.06, 0.28);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, d.color);

      dummy.scale.setScalar(0.32);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
      glow.setColorAt(i, d.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
  }, [drones]);

  useFrame((state) => {
    const mesh = bodyRef.current;
    const glow = glowRef.current;
    if (!mesh || !glow) return;
    const t = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    drones.forEach((d, i) => {
      const angle = t * d.speed + i;
      const x = d.baseX + Math.cos(angle) * d.radius;
      const y = d.baseY + Math.sin(t * 0.6 + i) * 0.6;
      const z = d.baseZ + Math.sin(angle) * d.radius * 0.6;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(0.14, 0.06, 0.28);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.3);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors fog={false} />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
