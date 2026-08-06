"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const ZERO_SCALE = new THREE.Matrix4().makeScale(0, 0, 0);

/** Two alternating lamp archetypes lining both edges of the highway —
 * a slim pole topped with a warm sodium-vapor style glow orb, and a
 * taller cantilevered arm reaching out over the road with a linear LED
 * fixture at its tip — plus a soft ground pool of light at every lamp's
 * foot, the way a real streetlamp casts a puddle of light on the
 * pavement beneath it. Every fixture stays in the same warm/white
 * "real streetlight" family rather than a themed neon accent per
 * element type. */
export function StreetLights({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 26 : 52;
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);
  const orbRef = useRef<THREE.InstancedMesh>(null);
  const barRef = useRef<THREE.InstancedMesh>(null);
  const baseGlowRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const poleMatrices: THREE.Matrix4[] = [];
    const armMatrices: THREE.Matrix4[] = [];
    const orbMatrices: THREE.Matrix4[] = [];
    const barMatrices: THREE.Matrix4[] = [];
    const baseGlowMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * 8.6;
      const z = 40 - (i / count) * 150 + (seeded(i, 51) - 0.5) * 3;
      const isArc = seeded(i, 53) > 0.55;
      const height = isArc ? 4.1 : 3.2;

      dummy.position.set(x, height / 2, z);
      dummy.scale.set(0.045, height, 0.045);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      poleMatrices.push(dummy.matrix.clone());

      // Ground glow ring — every lamp gets one, a small "power source"
      // cue rather than a pole simply planted with no grounding.
      dummy.position.set(x, 0.025, z);
      dummy.scale.set(0.5, 0.03, 0.5);
      dummy.updateMatrix();
      baseGlowMatrices.push(dummy.matrix.clone());

      if (isArc) {
        // Cantilevered arm reaching toward the road with a linear
        // fixture at its tip — a taller, more architectural silhouette
        // than the plain orb lamp so the row doesn't read as one
        // repeated asset.
        const armLength = 1.6;
        dummy.position.set(x - side * armLength * 0.5, height - 0.15, z);
        dummy.scale.set(armLength, 0.05, 0.05);
        dummy.updateMatrix();
        armMatrices.push(dummy.matrix.clone());

        dummy.position.set(x - side * armLength, height - 0.32, z);
        dummy.scale.set(0.06, 0.06, 0.5);
        dummy.updateMatrix();
        barMatrices.push(dummy.matrix.clone());

        orbMatrices.push(ZERO_SCALE.clone());
      } else {
        dummy.position.set(x, height + 0.05, z);
        dummy.scale.setScalar(0.14);
        dummy.updateMatrix();
        orbMatrices.push(dummy.matrix.clone());

        armMatrices.push(ZERO_SCALE.clone());
        barMatrices.push(ZERO_SCALE.clone());
      }
    }

    return { poleMatrices, armMatrices, orbMatrices, barMatrices, baseGlowMatrices };
  }, [count]);

  const applyInstances = (
    mesh: THREE.InstancedMesh | null,
    matrices: THREE.Matrix4[]
  ) => {
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => applyInstances(poleRef.current, data.poleMatrices), [data]);
  useLayoutEffect(() => applyInstances(armRef.current, data.armMatrices), [data]);
  useLayoutEffect(() => applyInstances(orbRef.current, data.orbMatrices), [data]);
  useLayoutEffect(() => applyInstances(barRef.current, data.barMatrices), [data]);
  useLayoutEffect(
    () => applyInstances(baseGlowRef.current, data.baseGlowMatrices),
    [data]
  );

  useFrame(() => {
    // Steady light output, no pulsing — real streetlamps don't breathe.
    const orbMat = orbRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (orbMat) orbMat.opacity = 0.85;

    const barMat = barRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (barMat) barMat.opacity = 0.85;

    const baseMat = baseGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (baseMat) baseMat.opacity = 0.3;
  });

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#2b2d33" fog />
      </instancedMesh>

      <instancedMesh ref={armRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#2b2d33" fog />
      </instancedMesh>

      {/* Warm sodium-vapor style orb lamp. */}
      <instancedMesh ref={orbRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color="#ffcd8a"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* Cooler white LED strip on the cantilevered fixture. */}
      <instancedMesh ref={barRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#f4f2e8"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* Soft warm pool of light on the ground beneath each lamp. */}
      <instancedMesh ref={baseGlowRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshBasicMaterial
          color="#ffcd8a"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
