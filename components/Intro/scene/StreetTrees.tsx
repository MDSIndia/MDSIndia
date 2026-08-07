"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// A few natural canopy greens rather than one flat tint, so a run of
// trees along the sidewalk doesn't read as identical cutouts stamped
// down the block.
const CANOPY_GREENS = ["#3a7d44", "#4f9e5f", "#2f6b3a", "#5aa668"];

/** Street trees planted in the same sidewalk gap ParkingLot/HoloAds
 * use (road plane ends at x=8, building line starts at x=11 — see
 * Ground.tsx/CityScape's own x >= 11 invariant) — the ground-level
 * greenery a real boulevard has, which this city was otherwise
 * missing entirely: buildings meeting straight pavement with nothing
 * organic at street level. Purely static (no per-frame animation,
 * same reasoning as ParkingLot): trees don't need to do anything but
 * stand there. */
export function StreetTrees({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 18 : 34;

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const trunkMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];
    const canopyColors: THREE.Color[] = [];
    const shadowMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = keepClearOfCrossStreets(38 - seeded(i, 301) * 168);
      const x = side * (9.2 + seeded(i, 302) * 1.2);
      const trunkHeight = 1.5 + seeded(i, 303) * 0.6;
      const canopyRadius = 0.85 + seeded(i, 304) * 0.55;

      dummy.position.set(x, trunkHeight / 2, z);
      dummy.scale.set(0.12, trunkHeight, 0.12);
      dummy.rotation.set(0, seeded(i, 305) * Math.PI, 0);
      dummy.updateMatrix();
      trunkMatrices.push(dummy.matrix.clone());

      dummy.position.set(x, trunkHeight + canopyRadius * 0.75, z);
      dummy.scale.set(canopyRadius, canopyRadius * 1.1, canopyRadius);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      canopyMatrices.push(dummy.matrix.clone());
      canopyColors.push(new THREE.Color(CANOPY_GREENS[i % CANOPY_GREENS.length]));

      dummy.position.set(x, 0.012, z);
      dummy.scale.set(canopyRadius * 1.7, canopyRadius * 1.7, 1);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      shadowMatrices.push(dummy.matrix.clone());
    }

    return { trunkMatrices, canopyMatrices, canopyColors, shadowMatrices };
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

  useLayoutEffect(() => applyInstances(trunkRef.current, data.trunkMatrices), [data]);
  useLayoutEffect(
    () => applyInstances(canopyRef.current, data.canopyMatrices, data.canopyColors),
    [data]
  );
  useLayoutEffect(() => applyInstances(shadowRef.current, data.shadowMatrices), [data]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.6, 0.85, 1, 6]} />
        <meshLambertMaterial color="#2e2318" fog />
      </instancedMesh>

      {/* Lit rather than unlit flat green — the same reasoning
          CityScape's hanging gardens use: foliage that actually picks
          up the rig light reads as a solid mass instead of a green
          decal pasted in front of the buildings. */}
      {/* No `vertexColors` flag here even though each instance gets a
          color via setColorAt — instanceColor is read automatically
          whenever it's set, independent of that flag, and turning it
          on with no geometry-level `color` attribute on this primitive
          zeroes the lit result out entirely under Lambert (a real bug
          hit and fixed elsewhere in CityScape; not repeating it here). */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, count]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      <instancedMesh ref={shadowRef} args={[undefined, undefined, count]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial
          color="#1a2016"
          transparent
          opacity={0.4}
          blending={THREE.MultiplyBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
