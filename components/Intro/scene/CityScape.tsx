"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const ACCENTS = ["#00D4FF", "#7B2FBE", "#0055FF", "#ff2ecb"];
const ZERO_SCALE = new THREE.Matrix4().makeScale(0, 0, 0);

/** Instanced cyberpunk skyline flanking the highway: varied-height
 * towers (some tapering into spires), twin window-strip facades,
 * rooftop glow caps, and antennas with blinking tips on a subset of
 * buildings for skyline variety and density. Everything stays instanced
 * (one draw call per element type) so the extra detail is cheap. */
export function CityScape({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 70 : 130;
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const windowsARef = useRef<THREE.InstancedMesh>(null);
  const windowsBRef = useRef<THREE.InstancedMesh>(null);
  const spiresRef = useRef<THREE.InstancedMesh>(null);
  const roofGlowRef = useRef<THREE.InstancedMesh>(null);
  const antennaRef = useRef<THREE.InstancedMesh>(null);
  const antennaLightRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const buildingMatrices: THREE.Matrix4[] = [];
    const buildingColors: THREE.Color[] = [];
    const windowAMatrices: THREE.Matrix4[] = [];
    const windowAColors: THREE.Color[] = [];
    const windowBMatrices: THREE.Matrix4[] = [];
    const windowBColors: THREE.Color[] = [];
    const spireMatrices: THREE.Matrix4[] = [];
    const spireColors: THREE.Color[] = [];
    const roofGlowMatrices: THREE.Matrix4[] = [];
    const roofGlowColors: THREE.Color[] = [];
    const antennaMatrices: THREE.Matrix4[] = [];
    const antennaLightMatrices: THREE.Matrix4[] = [];
    const antennaLightColors: THREE.Color[] = [];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      // Kept well clear of the camera's lateral travel (max ~6.5 units
      // off-center during the banked turn) so tall/wide towers never
      // clip into frame as a flat black wall.
      const x = side * (20 + seeded(i, 1) * 26);
      const z = 45 - seeded(i, 2) * 130;
      // A slightly wider height range reads as more architecturally
      // varied — squat mid-rises next to towering corporate spires.
      const height = 4 + seeded(i, 3) * 42;
      const width = 2 + seeded(i, 4) * 3.4;
      const accent = ACCENTS[i % ACCENTS.length];

      dummy.position.set(x, height / 2, z);
      dummy.scale.set(width, height, width);
      dummy.rotation.set(0, seeded(i, 5) * 0.2, 0);
      dummy.updateMatrix();
      buildingMatrices.push(dummy.matrix.clone());
      const dark = 0.025 + seeded(i, 6) * 0.02;
      buildingColors.push(new THREE.Color(dark, dark, dark + 0.02));

      // Facade A: faces the road.
      dummy.position.set(
        x - side * (width / 2 + 0.02),
        2 + seeded(i, 7) * Math.max(1, height - 4),
        z
      );
      dummy.scale.set(0.06, 0.6 + seeded(i, 8) * 2.4, 0.4);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      windowAMatrices.push(dummy.matrix.clone());
      windowAColors.push(new THREE.Color(accent));

      // Facade B: the opposite edge, so towers still glow when the
      // banked turn briefly reveals their far side.
      dummy.position.set(
        x + side * (width / 2 + 0.02),
        2 + seeded(i, 9) * Math.max(1, height - 4),
        z + 1.2
      );
      dummy.scale.set(0.06, 0.5 + seeded(i, 10) * 2.0, 0.4);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      windowBMatrices.push(dummy.matrix.clone());
      windowBColors.push(new THREE.Color(ACCENTS[(i + 1) % ACCENTS.length]));

      // ~1 in 4 tall buildings tapers into a corporate spire.
      const isSpireCandidate = height > 24 && i % 4 === 0;
      if (isSpireCandidate) {
        const spireHeight = 6 + seeded(i, 21) * 10;
        dummy.position.set(x, height + spireHeight / 2, z);
        dummy.scale.set(width * 0.28, spireHeight, width * 0.28);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        spireMatrices.push(dummy.matrix.clone());
        spireColors.push(new THREE.Color(0.08, 0.09, 0.12));
      } else {
        spireMatrices.push(ZERO_SCALE.clone());
        spireColors.push(new THREE.Color(0, 0, 0));
      }

      // Rooftop lighting cap — every building gets a soft glow at its
      // crown so the skyline reads as lit from above, not just the side.
      dummy.position.set(x, height + 0.05, z);
      dummy.scale.set(width * 0.9, 0.06, width * 0.9);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      roofGlowMatrices.push(dummy.matrix.clone());
      roofGlowColors.push(new THREE.Color(accent));

      // ~30% of buildings get a communication antenna with a blinking tip.
      const hasAntenna = i % 3 === 0;
      if (hasAntenna) {
        const antennaHeight = 2.5 + seeded(i, 22) * 4;
        dummy.position.set(x, height + antennaHeight / 2, z);
        dummy.scale.set(0.05, antennaHeight, 0.05);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        antennaMatrices.push(dummy.matrix.clone());

        dummy.position.set(x, height + antennaHeight, z);
        dummy.scale.set(0.22, 0.22, 0.22);
        dummy.updateMatrix();
        antennaLightMatrices.push(dummy.matrix.clone());
        antennaLightColors.push(
          new THREE.Color(i % 2 === 0 ? "#ff3355" : "#00e5ff")
        );
      } else {
        antennaMatrices.push(ZERO_SCALE.clone());
        antennaLightMatrices.push(ZERO_SCALE.clone());
        antennaLightColors.push(new THREE.Color(0, 0, 0));
      }
    }

    return {
      buildingMatrices,
      buildingColors,
      windowAMatrices,
      windowAColors,
      windowBMatrices,
      windowBColors,
      spireMatrices,
      spireColors,
      roofGlowMatrices,
      roofGlowColors,
      antennaMatrices,
      antennaLightMatrices,
      antennaLightColors,
    };
  }, [count]);

  const applyInstances = (
    mesh: THREE.InstancedMesh | null,
    matrices: THREE.Matrix4[],
    colors?: THREE.Color[]
  ) => {
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    colors?.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(
    () => applyInstances(buildingsRef.current, data.buildingMatrices, data.buildingColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(windowsARef.current, data.windowAMatrices, data.windowAColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(windowsBRef.current, data.windowBMatrices, data.windowBColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(spiresRef.current, data.spireMatrices, data.spireColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(roofGlowRef.current, data.roofGlowMatrices, data.roofGlowColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(antennaRef.current, data.antennaMatrices),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(
        antennaLightRef.current,
        data.antennaLightMatrices,
        data.antennaLightColors
      ),
    [data]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const reveal = windowProgress(t, 0.5, 2.0);
    // The portal's light spills onto nearby facades as the rider closes in.
    const portalBoost = windowProgress(t, 4.4, 6.2) * 0.5;
    const windowOpacity = 0.15 + reveal * 0.75 + portalBoost;

    [windowsARef, windowsBRef].forEach((ref) => {
      const mat = ref.current?.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = windowOpacity;
    });

    const roofMat = roofGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (roofMat) roofMat.opacity = (0.35 + Math.sin(t * 1.1) * 0.15) * reveal;

    const antennaMat = antennaLightRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (antennaMat) antennaMat.opacity = 0.5 + Math.sin(t * 5.5) * 0.5;
  });

  return (
    <group>
      <instancedMesh ref={buildingsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors fog />
      </instancedMesh>

      <instancedMesh ref={spiresRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.7, 1, 4]} />
        <meshBasicMaterial vertexColors fog />
      </instancedMesh>

      <instancedMesh ref={windowsARef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={windowsBRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={roofGlowRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.72, 0.72, 1, 6]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={antennaRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshBasicMaterial color="#0a0a12" fog={false} />
      </instancedMesh>

      <instancedMesh ref={antennaLightRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
