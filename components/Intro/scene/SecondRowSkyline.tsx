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
  { r: 0.05, g: 0.07, b: 0.12 },
  { r: 0.1, g: 0.1, b: 0.11 },
  { r: 0.15, g: 0.1, b: 0.06 },
  { r: 0.16, g: 0.17, b: 0.19 },
  { r: 0.05, g: 0.12, b: 0.11 },
  { r: 0.03, g: 0.035, b: 0.045 },
];

// A middle-distance lane, between CityScape's own near-road row (x
// 11-22) and DistantSkyline's hazy far backdrop (x 55-125) — until now
// there was nothing at all in that gap for most of the route (only
// SkylineFiller, and only inside the landmark clearance bands), which
// is why the city read as one thin row of towers with empty space
// behind it rather than actual city blocks. This runs continuously the
// whole route length, not just in gaps.
const X_NEAR = 24;
const X_FAR = 15;

/** A second row of buildings standing behind CityScape's own row,
 * running the full route rather than only filling landmark gaps (see
 * SkylineFiller for that narrower job) — real city blocks are many
 * buildings deep, not a single row of towers facing the street with
 * nothing behind them. Slightly dimmer/less detailed than the
 * foreground row (no normal maps, lower emissive) since these read at
 * a glance past the nearer buildings, not examined up close — the
 * depth cue comes from genuinely being *there*, not from matching
 * foreground fidelity. */
export function SecondRowSkyline({ isMobile }: { isMobile: boolean }) {
  // Raised 25% (46/80 -> 58/100) at explicit "add more buildings" request.
  const count = isMobile ? 58 : 100;

  const boxRef = useRef<THREE.InstancedMesh>(null);
  const roundRef = useRef<THREE.InstancedMesh>(null);
  const pyramidRef = useRef<THREE.InstancedMesh>(null);
  const facetedRef = useRef<THREE.InstancedMesh>(null);

  const windowMap = useMemo(() => getWindowGridTexture(5), []);
  const windowEmissive = useMemo(() => getWindowEmissiveTexture(5), []);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const boxMatrices: THREE.Matrix4[] = [];
    const boxColors: THREE.Color[] = [];
    const roundMatrices: THREE.Matrix4[] = [];
    const roundColors: THREE.Color[] = [];
    const pyramidMatrices: THREE.Matrix4[] = [];
    const pyramidColors: THREE.Color[] = [];
    const facetedMatrices: THREE.Matrix4[] = [];
    const facetedColors: THREE.Color[] = [];

    for (let i = 0; i < count; i++) {
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const rawZ = 55 - seeded(i, 981) * 220;
      const z = keepClearOfLandmarks(keepClearOfCrossStreets(rawZ), side);
      const x = side * (X_NEAR + seeded(i, 982) * X_FAR);
      const height = 6 + seeded(i, 983) * 42;
      const width = 2 + seeded(i, 984) * 5;
      const accent = ACCENTS[Math.floor(seeded(i, 985) * ACCENTS.length)];
      const family = MATERIAL_FAMILIES[Math.floor(seeded(i, 986) * MATERIAL_FAMILIES.length)];
      const bodyColor = new THREE.Color(family.r, family.g, family.b).lerp(
        new THREE.Color(accent),
        0.1
      );
      const yaw = seeded(i, 987) * Math.PI;

      // Four silhouettes now (round/faceted/pyramid/box) rather than
      // three — at explicit "all buildings look same" request. This
      // population is the single largest in the scene (see count
      // above), so adding a shape here does more for overall variety
      // than tuning any one already-varied system further.
      const shapeRoll = seeded(i, 988);
      if (shapeRoll > 0.76) {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.5, height, width * 0.5);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        roundMatrices.push(dummy.matrix.clone());
        roundColors.push(bodyColor);
      } else if (shapeRoll > 0.55) {
        // Sharply tapered hex-frustum — same silhouette CityScape's own
        // "faceted" archetype uses (a plain 6-sided cylinder tapered
        // via scale, no custom geometry needed).
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.42, height, width * 0.42);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        facetedMatrices.push(dummy.matrix.clone());
        facetedColors.push(bodyColor);
      } else if (shapeRoll > 0.32) {
        dummy.position.set(x, height * 0.35, z);
        dummy.scale.set(width * 0.8, height * 0.7, width * 0.8);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        pyramidMatrices.push(dummy.matrix.clone());
        pyramidColors.push(bodyColor);
      } else {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width * 0.8);
        dummy.rotation.set(0, yaw * 0.12, 0);
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
      pyramidMatrices,
      pyramidColors,
      facetedMatrices,
      facetedColors,
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
    () => applyInstances(pyramidRef.current, data.pyramidMatrices, data.pyramidColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(facetedRef.current, data.facetedMatrices, data.facetedColors),
    [data]
  );

  return (
    <group>
      {data.boxMatrices.length > 0 && (
        <instancedMesh ref={boxRef} args={[undefined, undefined, data.boxMatrices.length]}>
          <boxGeometry args={[1, 1, 1]} />
          {/* toneMapped={false} removed — same bug fixed in CityScape:
              applied to the whole lit facade rather than just an
              additive glow layer, it made the material bypass ACES
              tone mapping entirely, so any bright pixel (a light family
              color under strong rig light, a specular hotspot) hard-
              clipped to flat white instead of compressing gracefully —
              exactly the washed-out, undefined look these buildings
              were still showing after that same fix went into
              CityScape's own towers. */}
          <meshPhongMaterial
            map={windowMap}
            emissiveMap={windowEmissive}
            emissive="#a8cfe8"
            emissiveIntensity={0.65}
            specular="#2a3a52"
            shininess={14}
            fog
          />
        </instancedMesh>
      )}
      {data.roundMatrices.length > 0 && (
        <instancedMesh ref={roundRef} args={[undefined, undefined, data.roundMatrices.length]}>
          <cylinderGeometry args={[0.72, 1, 1, 10]} />
          <meshPhongMaterial
            map={windowMap}
            emissiveMap={windowEmissive}
            emissive="#a8cfe8"
            emissiveIntensity={0.6}
            specular="#2a3a52"
            shininess={14}
            fog
          />
        </instancedMesh>
      )}
      {data.pyramidMatrices.length > 0 && (
        <instancedMesh ref={pyramidRef} args={[undefined, undefined, data.pyramidMatrices.length]}>
          <coneGeometry args={[0.72, 1, 4, 1]} />
          <meshLambertMaterial fog />
        </instancedMesh>
      )}
      {data.facetedMatrices.length > 0 && (
        <instancedMesh ref={facetedRef} args={[undefined, undefined, data.facetedMatrices.length]}>
          <cylinderGeometry args={[0.42, 1, 1, 6]} />
          <meshPhongMaterial
            map={windowMap}
            emissiveMap={windowEmissive}
            emissive="#a8cfe8"
            emissiveIntensity={0.6}
            specular="#2a3a52"
            shininess={16}
            fog
          />
        </instancedMesh>
      )}
    </group>
  );
}
