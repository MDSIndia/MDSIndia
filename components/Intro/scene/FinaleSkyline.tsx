"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";
import { keepClearOfLandmarks } from "./landmarkClearance";
import {
  getWindowGridTexture,
  getWindowEmissiveTexture,
  getWindowNormalTexture,
} from "./glowTexture";

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

// The final stretch into the star (STAR_POSITION sits at z=-122 — see
// path.ts) — CityScape's own random spread already reaches this far,
// but it's one skyline's worth of density spread across the *entire*
// route, which reads as noticeably thinner right at the emotional peak
// of the flight than earlier, denser stretches. This is a dedicated
// top-up concentrated in just this stretch, at explicit "more
// skyscrapers right in front of the glow" request.
const Z_START = -92;
const Z_END = -165;

/** Extra skyscrapers concentrated in the final stretch before the star,
 * in the exact same near-road lane CityScape's own buildings use (not
 * SkylineFiller's set-back second row) — these are meant to read as
 * more of the same foreground skyline the camera has been flying
 * through the whole time, not background filler. Simple archetypes
 * (box/round) with the full window/emissive/normal texture stack,
 * since foreground buildings this close to the route's own climax
 * deserve the same facade quality as CityScape's real buildings, not
 * SkylineFiller's more distant, simpler treatment. */
export function FinaleSkyline({ isMobile }: { isMobile: boolean }) {
  // Raised 25% (14/24 -> 18/30) at explicit "add more buildings" request.
  const count = isMobile ? 18 : 30;

  const boxRef = useRef<THREE.InstancedMesh>(null);
  const roundRef = useRef<THREE.InstancedMesh>(null);
  const facetedRef = useRef<THREE.InstancedMesh>(null);
  const pyramidRef = useRef<THREE.InstancedMesh>(null);

  const windowMap = useMemo(() => getWindowGridTexture(3), []);
  const windowEmissive = useMemo(() => getWindowEmissiveTexture(3), []);
  const windowNormal = useMemo(() => getWindowNormalTexture(), []);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const boxMatrices: THREE.Matrix4[] = [];
    const boxColors: THREE.Color[] = [];
    const roundMatrices: THREE.Matrix4[] = [];
    const roundColors: THREE.Color[] = [];
    const facetedMatrices: THREE.Matrix4[] = [];
    const facetedColors: THREE.Color[] = [];
    const pyramidMatrices: THREE.Matrix4[] = [];
    const pyramidColors: THREE.Color[] = [];

    for (let i = 0; i < count; i++) {
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const rawZ = Z_START + seeded(i, 971) * (Z_END - Z_START);
      const z = keepClearOfLandmarks(keepClearOfCrossStreets(rawZ), side);
      // Same near-road lane formula CityScape's own buildings use, so
      // this reads as more of the same skyline rather than a visibly
      // different band of towers.
      const x = side * (11 + seeded(i, 972) * 11);
      const height = 8 + seeded(i, 973) * 46;
      const width = (1.5 + seeded(i, 974) * 4.2) * (1.2 - Math.min(1, height / 54) * 0.7);
      const accent = ACCENTS[Math.floor(seeded(i, 975) * ACCENTS.length)];
      const family = MATERIAL_FAMILIES[Math.floor(seeded(i, 976) * MATERIAL_FAMILIES.length)];
      const bodyColor = new THREE.Color(family.r, family.g, family.b).lerp(
        new THREE.Color(accent),
        0.12
      );
      const yaw = seeded(i, 977) * Math.PI;

      // Four silhouettes now (round/faceted/pyramid/box) rather than
      // two — at explicit "all buildings look same" request, and this
      // is the stretch right before the star, so it's worth the same
      // variety the rest of the route gets.
      const shapeRoll = seeded(i, 978);
      if (shapeRoll > 0.78) {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.55, height, width * 0.55);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        roundMatrices.push(dummy.matrix.clone());
        roundColors.push(bodyColor);
      } else if (shapeRoll > 0.56) {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.46, height, width * 0.46);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        facetedMatrices.push(dummy.matrix.clone());
        facetedColors.push(bodyColor);
      } else if (shapeRoll > 0.38) {
        dummy.position.set(x, height * 0.35, z);
        dummy.scale.set(width * 0.9, height * 0.7, width * 0.9);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        pyramidMatrices.push(dummy.matrix.clone());
        pyramidColors.push(bodyColor);
      } else {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width * 0.85);
        dummy.rotation.set(0, yaw * 0.15, 0);
        dummy.updateMatrix();
        boxMatrices.push(dummy.matrix.clone());
        boxColors.push(bodyColor);
      }
    }

    return {
      boxMatrices,
      boxColors,
      roundMatrices,
      roundColors,
      facetedMatrices,
      facetedColors,
      pyramidMatrices,
      pyramidColors,
    };
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
    () => applyInstances(facetedRef.current, data.facetedMatrices, data.facetedColors),
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
          {/* toneMapped={false} removed — same washed-out-facade bug
              fixed in CityScape (see its own comment there). */}
          <meshPhongMaterial
            map={windowMap}
            normalMap={windowNormal}
            normalScale={new THREE.Vector2(0.8, 0.8)}
            emissiveMap={windowEmissive}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            specular="#3a4a66"
            shininess={22}
            fog
          />
        </instancedMesh>
      )}
      {data.roundMatrices.length > 0 && (
        <instancedMesh ref={roundRef} args={[undefined, undefined, data.roundMatrices.length]}>
          <cylinderGeometry args={[0.72, 1, 1, 10]} />
          <meshPhongMaterial
            map={windowMap}
            normalMap={windowNormal}
            normalScale={new THREE.Vector2(0.8, 0.8)}
            emissiveMap={windowEmissive}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            specular="#3a4a66"
            shininess={22}
            fog
          />
        </instancedMesh>
      )}
      {data.facetedMatrices.length > 0 && (
        <instancedMesh ref={facetedRef} args={[undefined, undefined, data.facetedMatrices.length]}>
          <cylinderGeometry args={[0.42, 1, 1, 6]} />
          <meshPhongMaterial
            map={windowMap}
            normalMap={windowNormal}
            normalScale={new THREE.Vector2(0.8, 0.8)}
            emissiveMap={windowEmissive}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            specular="#3a4a66"
            shininess={26}
            fog
          />
        </instancedMesh>
      )}
      {data.pyramidMatrices.length > 0 && (
        <instancedMesh ref={pyramidRef} args={[undefined, undefined, data.pyramidMatrices.length]}>
          <coneGeometry args={[0.72, 1, 4, 1]} />
          <meshPhongMaterial specular="#4a5a78" shininess={30} emissive="#0c1220" emissiveIntensity={0.4} fog />
        </instancedMesh>
      )}
    </group>
  );
}
