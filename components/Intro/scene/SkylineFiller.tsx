"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";
import { keepClearOfLandmarks } from "./landmarkClearance";
import { getWindowGridTexture, getWindowEmissiveTexture } from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const ACCENTS = ["#a8d4e8", "#bcdcec", "#8fa8c8", "#dce4ec", "#e8d8b8", "#c0a8d8", "#e0c8a0"];
const MATERIAL_FAMILIES = [
  { r: 0.07, g: 0.09, b: 0.15 },
  { r: 0.12, g: 0.12, b: 0.13 },
  { r: 0.19, g: 0.13, b: 0.08 },
  { r: 0.21, g: 0.22, b: 0.24 },
  { r: 0.06, g: 0.15, b: 0.14 },
  { r: 0.035, g: 0.04, b: 0.05 },
];

/** Second-row buildings that fill the large forced-empty z-bands
 * landmarkClearance.ts carves out of CityScape's own near-road lane —
 * every CityScape building that would otherwise land inside a
 * landmark's clearance zone gets pushed clear of it entirely, which is
 * correct for stopping clipping but leaves a visibly bare stretch of
 * skyline wherever that band sits, on top of CityScape's own random
 * gaps. Set back far enough from the road (x 34-50) that none of this
 * scene's landmarks reach it, so it can safely fill exactly the z
 * range CityScape is forced to leave empty on that side, at explicit
 * "empty spaces" feedback. Reuses `keepClearOfLandmarks` itself to find
 * those bands (a candidate z counts as "in a gap" if the function would
 * have moved it) rather than hardcoding the ranges, so this stays
 * correct if the landmark layout ever changes. Simple geometry (box/
 * round/pyramid, no doors, windows, or banners) since this is
 * background depth filling in behind the landmarks, not the foreground
 * lane the camera passes directly alongside. */
export function SkylineFiller({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 10 : 18;

  const boxRef = useRef<THREE.InstancedMesh>(null);
  const roundRef = useRef<THREE.InstancedMesh>(null);
  const pyramidRef = useRef<THREE.InstancedMesh>(null);

  const windowMap = useMemo(() => getWindowGridTexture(2), []);
  const windowEmissive = useMemo(() => getWindowEmissiveTexture(2), []);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const boxMatrices: THREE.Matrix4[] = [];
    const boxColors: THREE.Color[] = [];
    const roundMatrices: THREE.Matrix4[] = [];
    const roundColors: THREE.Color[] = [];
    const pyramidMatrices: THREE.Matrix4[] = [];
    const pyramidColors: THREE.Color[] = [];

    let placed = 0;
    let attempt = 0;
    // Rolls candidates across the whole route and keeps only the ones
    // landmarkClearance.ts would have pushed a real CityScape building
    // out of — exactly the bands that would otherwise stay empty.
    while (placed < count && attempt < count * 60) {
      const side: -1 | 1 = attempt % 2 === 0 ? -1 : 1;
      const rawZ = 50 - seeded(attempt, 901) * 175;
      const z = keepClearOfCrossStreets(rawZ);
      attempt++;
      if (keepClearOfLandmarks(z, side) === z) continue;

      const x = side * (34 + seeded(placed, 902) * 16);
      const height = 5 + seeded(placed, 903) * 34;
      const width = 2 + seeded(placed, 904) * 3.4;
      const accent = ACCENTS[Math.floor(seeded(placed, 905) * ACCENTS.length)];
      const family = MATERIAL_FAMILIES[Math.floor(seeded(placed, 906) * MATERIAL_FAMILIES.length)];
      const bodyColor = new THREE.Color(family.r, family.g, family.b).lerp(
        new THREE.Color(accent),
        0.12
      );

      const shapeRoll = seeded(placed, 907);
      const yaw = seeded(placed, 908) * Math.PI;
      if (shapeRoll > 0.66) {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.55, height, width * 0.55);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        roundMatrices.push(dummy.matrix.clone());
        roundColors.push(bodyColor);
      } else if (shapeRoll > 0.33) {
        dummy.position.set(x, height * 0.35, z);
        dummy.scale.set(width * 0.85, height * 0.7, width * 0.85);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        pyramidMatrices.push(dummy.matrix.clone());
        pyramidColors.push(bodyColor);
      } else {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width * 0.8);
        dummy.rotation.set(0, yaw * 0.15, 0);
        dummy.updateMatrix();
        boxMatrices.push(dummy.matrix.clone());
        boxColors.push(bodyColor);
      }
      placed++;
    }

    return { boxMatrices, boxColors, roundMatrices, roundColors, pyramidMatrices, pyramidColors };
  }, [count]);

  const applyInstances = (
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
    () => applyInstances(boxRef.current, data.boxMatrices, data.boxColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(roundRef.current, data.roundMatrices, data.roundColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(pyramidRef.current, data.pyramidMatrices, data.pyramidColors),
    [data]
  );

  return (
    <group>
      {data.boxMatrices.length > 0 && (
        <instancedMesh ref={boxRef} args={[undefined, undefined, data.boxMatrices.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhongMaterial
            map={windowMap}
            emissiveMap={windowEmissive}
            emissive="#bfe4ff"
            emissiveIntensity={0.8}
            toneMapped={false}
            specular="#3a4a66"
            shininess={18}
            fog
          />
        </instancedMesh>
      )}
      {data.roundMatrices.length > 0 && (
        <instancedMesh ref={roundRef} args={[undefined, undefined, data.roundMatrices.length]}>
          <cylinderGeometry args={[1, 1, 1, 12]} />
          <meshPhongMaterial
            map={windowMap}
            emissiveMap={windowEmissive}
            emissive="#bfe4ff"
            emissiveIntensity={0.7}
            toneMapped={false}
            specular="#3a4a66"
            shininess={18}
            fog
          />
        </instancedMesh>
      )}
      {data.pyramidMatrices.length > 0 && (
        <instancedMesh ref={pyramidRef} args={[undefined, undefined, data.pyramidMatrices.length]}>
          <coneGeometry args={[0.8, 1, 4]} />
          <meshLambertMaterial fog />
        </instancedMesh>
      )}
    </group>
  );
}
