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
  scale: [number, number, number];
  color: THREE.Color;
}

/** Small hover vehicles and drones, plus a handful of larger delivery
 * platforms, orbiting lazily through the skyline — a body instance
 * plus a soft additive glow halo per size class, animated via a
 * circling path so the city reads as inhabited and moving. */
export function HoverTraffic({ isMobile }: { isMobile: boolean }) {
  const droneCount = isMobile ? 10 : 20;
  const platformCount = isMobile ? 3 : 6;

  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const platformRef = useRef<THREE.InstancedMesh>(null);
  const platformGlowRef = useRef<THREE.InstancedMesh>(null);

  const drones = useMemo<Drone[]>(
    () =>
      Array.from({ length: droneCount }, (_, i) => ({
        baseX: (seeded(i, 41) - 0.5) * 30,
        baseY: 8 + seeded(i, 42) * 24,
        baseZ: 40 - seeded(i, 43) * 140,
        speed: 0.3 + seeded(i, 44) * 0.6,
        radius: 1.5 + seeded(i, 45) * 3,
        scale: [0.14, 0.06, 0.28],
        color: new THREE.Color(i % 2 === 0 ? "#00e5ff" : "#ff5fd8"),
      })),
    [droneCount]
  );

  const platforms = useMemo<Drone[]>(
    () =>
      Array.from({ length: platformCount }, (_, i) => ({
        baseX: (seeded(i, 91) - 0.5) * 40,
        baseY: 12 + seeded(i, 92) * 20,
        baseZ: 35 - seeded(i, 93) * 150,
        speed: 0.12 + seeded(i, 94) * 0.18,
        radius: 4 + seeded(i, 95) * 5,
        scale: [0.7, 0.1, 1.3],
        color: new THREE.Color(i % 2 === 0 ? "#7fb2ff" : "#8fe6ff"),
      })),
    [platformCount]
  );

  const setupInstances = (
    mesh: THREE.InstancedMesh | null,
    glow: THREE.InstancedMesh | null,
    items: Drone[],
    glowScale: number
  ) => {
    if (!mesh || !glow) return;
    const dummy = new THREE.Object3D();
    items.forEach((d, i) => {
      dummy.position.set(d.baseX, d.baseY, d.baseZ);
      dummy.scale.set(...d.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, d.color);

      dummy.scale.setScalar(d.scale[2] * glowScale);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
      glow.setColorAt(i, d.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(
    () => setupInstances(bodyRef.current, glowRef.current, drones, 1.15),
    [drones]
  );
  useLayoutEffect(
    () => setupInstances(platformRef.current, platformGlowRef.current, platforms, 0.5),
    [platforms]
  );

  const animateGroup = (
    mesh: THREE.InstancedMesh | null,
    glow: THREE.InstancedMesh | null,
    items: Drone[],
    t: number,
    glowScale: number
  ) => {
    if (!mesh || !glow) return;
    const dummy = new THREE.Object3D();
    items.forEach((d, i) => {
      const angle = t * d.speed + i;
      const x = d.baseX + Math.cos(angle) * d.radius;
      const y = d.baseY + Math.sin(t * 0.6 + i) * 0.6;
      const z = d.baseZ + Math.sin(angle) * d.radius * 0.6;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(...d.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(d.scale[2] * glowScale);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    animateGroup(bodyRef.current, glowRef.current, drones, t, 1.15);
    animateGroup(platformRef.current, platformGlowRef.current, platforms, t, 0.5);
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, droneCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors fog={false} />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[undefined, undefined, droneCount]}>
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

      <instancedMesh ref={platformRef} args={[undefined, undefined, platformCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors fog={false} />
      </instancedMesh>
      <instancedMesh ref={platformGlowRef} args={[undefined, undefined, platformCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
