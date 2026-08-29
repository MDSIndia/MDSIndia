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
// Lobes per tree — see the canopy comment below for why a single
// sphere read as a lollipop rather than a real canopy.
const LOBES_PER_TREE = 3;

/** Street trees planted in the same sidewalk gap ParkingLot/HoloAds
 * use (road plane ends at x=8, building line starts at x=11 — see
 * Ground.tsx/CityScape's own x >= 11 invariant) — the ground-level
 * greenery a real boulevard has, which this city was otherwise
 * missing entirely: buildings meeting straight pavement with nothing
 * organic at street level. Each canopy is built from three overlapping
 * offset lobes rather than one perfectly centered sphere — a single
 * sphere on a stick reads as a lollipop; real tree canopies are
 * lumpy/asymmetric clusters of foliage masses. Purely static (no
 * per-frame animation, same reasoning as ParkingLot): trees don't need
 * to do anything but stand there. */
export function StreetTrees({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 18 : 34;
  const lobeCount = count * LOBES_PER_TREE;

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
      // Pulled down from 0.85-1.4 — at that size, planted only ~1.5-2
      // units off the building line, a tree's own canopy was wide
      // enough to swallow a building's entire ground-floor entrance
      // (canopy/door/glass) from most viewing angles along the road.
      // Real street trees read as punctuation along a sidewalk, not a
      // wall of foliage in front of the buildings behind them.
      const canopyRadius = 0.55 + seeded(i, 304) * 0.35;
      // A slight organic lean rather than every trunk standing
      // perfectly vertical.
      const lean = (seeded(i, 306) - 0.5) * 0.16;

      dummy.position.set(x, trunkHeight / 2, z);
      dummy.scale.set(0.12, trunkHeight, 0.12);
      dummy.rotation.set(lean, seeded(i, 305) * Math.PI, lean * 0.6);
      dummy.updateMatrix();
      trunkMatrices.push(dummy.matrix.clone());

      // Three overlapping lobes clustered around the trunk's top
      // rather than one centered sphere — a real canopy's own
      // asymmetric, lumpy silhouette. The first (largest) lobe sits
      // dead-center for a stable core mass; the other two offset
      // outward at random angles/heights and read as secondary
      // foliage clumps breaking up the perfect-sphere outline.
      const canopyBaseY = trunkHeight + canopyRadius * 0.7;
      const baseGreen = CANOPY_GREENS[i % CANOPY_GREENS.length];
      for (let l = 0; l < LOBES_PER_TREE; l++) {
        const isCore = l === 0;
        const lobeAngle = seeded(i * 3 + l, 307) * Math.PI * 2;
        const lobeDist = isCore ? 0 : canopyRadius * (0.45 + seeded(i * 3 + l, 308) * 0.35);
        const lobeScale = isCore ? 1 : 0.55 + seeded(i * 3 + l, 309) * 0.25;
        const lobeYOffset = isCore ? 0 : (seeded(i * 3 + l, 310) - 0.3) * canopyRadius * 0.6;

        dummy.position.set(
          x + Math.cos(lobeAngle) * lobeDist,
          canopyBaseY + lobeYOffset,
          z + Math.sin(lobeAngle) * lobeDist
        );
        dummy.scale.set(
          canopyRadius * lobeScale,
          canopyRadius * lobeScale * 1.05,
          canopyRadius * lobeScale
        );
        dummy.rotation.set(0, seeded(i * 3 + l, 311) * Math.PI, 0);
        dummy.updateMatrix();
        canopyMatrices.push(dummy.matrix.clone());

        // Secondary lobes shaded a touch darker/lighter than the core
        // — real foliage clumps catch light unevenly, not one flat
        // tint repeated across the whole canopy.
        const lobeColor = new THREE.Color(baseGreen);
        if (!isCore) lobeColor.multiplyScalar(0.82 + seeded(i * 3 + l, 312) * 0.3);
        canopyColors.push(lobeColor);
      }

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
      <instancedMesh ref={canopyRef} args={[undefined, undefined, lobeCount]}>
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
