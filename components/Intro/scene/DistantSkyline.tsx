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
  // Raised 25% (34/60 -> 43/75) at explicit "add more buildings" request.
  const count = isMobile ? 43 : 75;
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const taperRef = useRef<THREE.InstancedMesh>(null);
  const spireRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const boxMatrices: THREE.Matrix4[] = [];
    const boxColors: THREE.Color[] = [];
    const taperMatrices: THREE.Matrix4[] = [];
    const taperColors: THREE.Color[] = [];
    const spireMatrices: THREE.Matrix4[] = [];
    const spireColors: THREE.Color[] = [];
    const lightMatrices: THREE.Matrix4[] = [];
    const lightColors: THREE.Color[] = [];
    const palette = ["#00D4FF", "#0055FF", "#33E0FF"];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (55 + seeded(i, 71) * 70);
      const z = 90 - seeded(i, 72) * 260;
      const height = 26 + seeded(i, 73) * 70;
      const width = 6 + seeded(i, 74) * 12;
      const haze = 0.03 + seeded(i, 76) * 0.02;
      const color = new THREE.Color(haze, haze, haze + 0.015);

      // Three silhouettes now instead of one flat box for every single
      // building — at explicit "make the buildings look natural and in
      // different shapes" request. Every other skyline layer in this
      // scene already got multiple archetypes; this backdrop layer,
      // being the widest and most numerous (up to 75 buildings), was
      // the one place still stamping out the same box shape every time,
      // which reads as repetitive/artificial even when hazy and distant.
      // Kept to simple built-in geometries (cylinder taper, cone spire)
      // rather than CityScape's own detailed archetypes — this is a
      // flat unlit silhouette layer by design, so the win here is
      // roofline/outline variety, not facade detail.
      const shapeRoll = seeded(i, 81);
      if (shapeRoll > 0.68) {
        // A tapered spire — narrows steadily toward a point, distinct
        // from a flat-topped tower's silhouette against the sky.
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width);
        dummy.rotation.set(0, seeded(i, 75) * Math.PI, 0);
        dummy.updateMatrix();
        spireMatrices.push(dummy.matrix.clone());
        spireColors.push(color);
      } else if (shapeRoll > 0.4) {
        // A stepped taper — wide base narrowing to roughly half width,
        // the "setback tower" silhouette real dense-city skylines carry
        // (zoning-driven step-backs), distinct from both the flat box
        // and the fully-pointed spire.
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width);
        dummy.rotation.set(0, seeded(i, 75) * Math.PI, 0);
        dummy.updateMatrix();
        taperMatrices.push(dummy.matrix.clone());
        taperColors.push(color);
      } else {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width);
        dummy.rotation.set(0, seeded(i, 75) * Math.PI, 0);
        dummy.updateMatrix();
        boxMatrices.push(dummy.matrix.clone());
        boxColors.push(color);
      }

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

    return {
      boxMatrices,
      boxColors,
      taperMatrices,
      taperColors,
      spireMatrices,
      spireColors,
      lightMatrices,
      lightColors,
    };
  }, [count]);

  const applyBody = (
    mesh: THREE.InstancedMesh | null,
    matrices: THREE.Matrix4[],
    colors: THREE.Color[]
  ) => {
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    colors.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(
    () => applyBody(boxRef.current, data.boxMatrices, data.boxColors),
    [data]
  );
  useLayoutEffect(
    () => applyBody(taperRef.current, data.taperMatrices, data.taperColors),
    [data]
  );
  useLayoutEffect(
    () => applyBody(spireRef.current, data.spireMatrices, data.spireColors),
    [data]
  );

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
      {data.boxMatrices.length > 0 && (
        <instancedMesh ref={boxRef} args={[undefined, undefined, data.boxMatrices.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial vertexColors fog />
        </instancedMesh>
      )}
      {/* Stepped/wedge silhouette — a gentle hexagonal taper rather
          than a full point, distinct from both the flat box and the
          fully-pointed spire below. */}
      {data.taperMatrices.length > 0 && (
        <instancedMesh ref={taperRef} args={[undefined, undefined, data.taperMatrices.length]}>
          <cylinderGeometry args={[0.28, 0.5, 1, 6]} />
          <meshBasicMaterial vertexColors fog />
        </instancedMesh>
      )}
      {/* Fully-tapered spire — narrows to a point at the roofline. */}
      {data.spireMatrices.length > 0 && (
        <instancedMesh ref={spireRef} args={[undefined, undefined, data.spireMatrices.length]}>
          <coneGeometry args={[0.5, 1, 8]} />
          <meshBasicMaterial vertexColors fog />
        </instancedMesh>
      )}
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
