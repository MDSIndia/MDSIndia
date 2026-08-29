"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Small glowing wrist/chest accents — the one "futuristic" tell that
// separates these from plain silhouettes, echoing the skyline's own
// blue/cyan/purple/warm accent mix rather than a flat uniform color.
const ACCENTS = ["#6fc3f0", "#8fd6ff", "#b98bff", "#ffcf8f"];
// Lit mid-tone clothing colors — the original near-black (#14161c-ish)
// palette was nearly indistinguishable from the night sky/asphalt
// behind it at any real distance, which is exactly why these read as
// invisible rather than "people in dark coats". Varied enough that a
// cluster of pedestrians doesn't look like one cloned figure repainted.
const CLOTHING_COLORS = ["#5a6b85", "#7a6a58", "#4a5a4a", "#6a5868", "#5a7080", "#8a7860"];
const SKIN_TONES = ["#c9a888", "#8a6248", "#e0b898", "#6a4a38"];

const LEG_LENGTH = 0.95;
const TORSO_HEIGHT = 0.58;
const HEAD_RADIUS = 0.155;
const HIP_Y = LEG_LENGTH;

interface Pedestrian {
  x: number;
  z: number;
  dir: 1 | -1;
  walkSpeed: number;
  walkFreq: number;
  phase: number;
  legSwing: number;
  armSwing: number;
  accent: THREE.Color;
  clothing: THREE.Color;
  skin: THREE.Color;
}

/** A handful of pedestrians strolling the sidewalk — the one purely
 * human-scale cue this skyline was otherwise missing entirely among
 * its traffic and signage. Deliberately simple (a torso box, a head,
 * two swinging legs, two swinging arms — no rig/skeleton) since at
 * flythrough speed and distance a full character model would be
 * wasted detail; the leg/arm swing alone is what reads as "walking"
 * rather than "standing mannequin". Positioned like StreetTrees (a
 * static seed spread across the whole route, no recycling — this is a
 * one-shot flight, not a traffic loop) in a narrower curb-side lane so
 * they don't collide with the trees/holo-ads/streetlights already
 * sharing the sidewalk. Each walks a short, slow drift along their own
 * stretch of sidewalk rather than crossing the road. */
export function Pedestrians({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 16 : 30;

  const torsoRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const legLRef = useRef<THREE.InstancedMesh>(null);
  const legRRef = useRef<THREE.InstancedMesh>(null);
  const armLRef = useRef<THREE.InstancedMesh>(null);
  const armRRef = useRef<THREE.InstancedMesh>(null);
  const accentRef = useRef<THREE.InstancedMesh>(null);
  const groundGlowRef = useRef<THREE.InstancedMesh>(null);

  const accentColors = useMemo(
    () => Array.from({ length: count }, () => new THREE.Color()),
    [count]
  );
  const torsoColors = useMemo(
    () => Array.from({ length: count }, () => new THREE.Color()),
    [count]
  );
  const headColors = useMemo(
    () => Array.from({ length: count }, () => new THREE.Color()),
    [count]
  );
  const legColors = useMemo(
    () => Array.from({ length: count }, () => new THREE.Color()),
    [count]
  );
  const armColors = useMemo(
    () => Array.from({ length: count }, () => new THREE.Color()),
    [count]
  );

  const pedestrians = useMemo<Pedestrian[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        // Widened from a tight 8.25-8.75 sidewalk strip out to 10.5 —
        // right up near the building line (CityScape's own x >= 11
        // invariant) — so a chunk of these read as people right at a
        // building's front/entrance rather than every one of them
        // confined to a single thin sidewalk lane.
        const nearBuilding = seeded(i, 409) > 0.55;
        // A portion barely drift at all — standing near an entrance or
        // waiting, rather than every pedestrian being mid-stride. Real
        // street life is a mix of walking and standing, not uniform foot
        // traffic.
        const standing = seeded(i, 410) > 0.7;
        return {
          x: side * (nearBuilding ? 9.4 + seeded(i, 401) * 1.1 : 8.2 + seeded(i, 401) * 0.6),
          z: keepClearOfCrossStreets(35 - seeded(i, 402) * 160),
          dir: seeded(i, 403) > 0.5 ? 1 : -1,
          walkSpeed: standing ? 0.03 + seeded(i, 404) * 0.05 : 0.5 + seeded(i, 404) * 0.35,
          walkFreq: standing ? 1.2 : 2.6 + seeded(i, 405) * 0.6,
          phase: seeded(i, 406) * Math.PI * 2,
          legSwing: standing ? 0.03 : 0.16 + seeded(i, 407) * 0.05,
          armSwing: standing ? 0.02 : 0.1 + seeded(i, 408) * 0.04,
          accent: new THREE.Color(ACCENTS[i % ACCENTS.length]),
          clothing: new THREE.Color(
            CLOTHING_COLORS[Math.floor(seeded(i, 411) * CLOTHING_COLORS.length)]
          ),
          skin: new THREE.Color(SKIN_TONES[Math.floor(seeded(i, 412) * SKIN_TONES.length)]),
        };
      }),
    [count]
  );

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

  const layout = (t: number) => {
    const dummy = new THREE.Object3D();
    const torsoMatrices: THREE.Matrix4[] = [];
    const headMatrices: THREE.Matrix4[] = [];
    const legLMatrices: THREE.Matrix4[] = [];
    const legRMatrices: THREE.Matrix4[] = [];
    const armLMatrices: THREE.Matrix4[] = [];
    const armRMatrices: THREE.Matrix4[] = [];
    const accentMatrices: THREE.Matrix4[] = [];
    const groundGlowMatrices: THREE.Matrix4[] = [];

    pedestrians.forEach((p, i) => {
      // A slow, bounded drift along the sidewalk rather than a full
      // recycle loop — this is a one-shot ~9s flight, not a traffic
      // loop that needs to wrap, so a person just needs to have moved
      // a believable human distance by the time the camera passes.
      const walkT = t * p.walkSpeed * p.dir;
      const z = p.z + walkT;
      const bounce = Math.abs(Math.sin(t * p.walkFreq + p.phase)) * 0.03;

      dummy.position.set(p.x, HIP_Y + TORSO_HEIGHT / 2 + bounce, z);
      dummy.rotation.set(0, p.dir > 0 ? 0 : Math.PI, 0);
      dummy.scale.set(0.34, TORSO_HEIGHT, 0.2);
      dummy.updateMatrix();
      torsoMatrices.push(dummy.matrix.clone());

      dummy.position.set(p.x, HIP_Y + TORSO_HEIGHT + HEAD_RADIUS + bounce, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(HEAD_RADIUS);
      dummy.updateMatrix();
      headMatrices.push(dummy.matrix.clone());

      // Small chest accent — a lit badge/device rather than a full
      // texture, just a bright point of color at a human scale.
      dummy.position.set(p.x, HIP_Y + TORSO_HEIGHT * 0.65 + bounce, z + p.dir * 0.11);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.06);
      dummy.updateMatrix();
      accentMatrices.push(dummy.matrix.clone());

      // Ground contact glow — every other structure/vehicle in this
      // scene gets some form of ground presence (a shadow, a light
      // pool); pedestrians previously had none at all, which left them
      // looking like they were floating rather than anchored on the
      // sidewalk, on top of being hard to spot in the first place.
      dummy.position.set(p.x, 0.015, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(0.4, 0.4, 1);
      dummy.updateMatrix();
      groundGlowMatrices.push(dummy.matrix.clone());

      // Legs and arms: a cheap fore/aft slide standing in for a real
      // hip/shoulder pivot rotation — at the distance and speed these
      // are actually seen from during the flythrough, the swing alone
      // reads as "walking" without needing real joint kinematics.
      const swing = Math.sin(t * p.walkFreq + p.phase);
      [-1, 1].forEach((side, li) => {
        const legPhase = li === 0 ? swing : -swing;
        dummy.position.set(p.x + side * 0.09, HIP_Y / 2, z + legPhase * p.legSwing);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.11, LEG_LENGTH, 0.11);
        dummy.updateMatrix();
        (li === 0 ? legLMatrices : legRMatrices).push(dummy.matrix.clone());

        const armPhase = li === 0 ? -swing : swing;
        dummy.position.set(
          p.x + side * 0.24,
          HIP_Y + TORSO_HEIGHT * 0.82 - 0.22,
          z + armPhase * p.armSwing
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.08, 0.42, 0.08);
        dummy.updateMatrix();
        (li === 0 ? armLMatrices : armRMatrices).push(dummy.matrix.clone());
      });
    });

    applyInstances(torsoRef.current, torsoMatrices);
    applyInstances(headRef.current, headMatrices);
    applyInstances(legLRef.current, legLMatrices);
    applyInstances(legRRef.current, legRMatrices);
    applyInstances(armLRef.current, armLMatrices);
    applyInstances(armRRef.current, armRMatrices);
    applyInstances(accentRef.current, accentMatrices, accentColors);
    applyInstances(groundGlowRef.current, groundGlowMatrices);
  };

  useLayoutEffect(() => {
    pedestrians.forEach((p, i) => {
      accentColors[i]?.copy(p.accent);
      torsoColors[i]?.copy(p.clothing);
      headColors[i]?.copy(p.skin);
      // Legs read as darker trousers/boots relative to the torso's own
      // clothing color rather than sharing it outright.
      legColors[i]?.copy(p.clothing).multiplyScalar(0.55);
      armColors[i]?.copy(p.clothing);
    });
    layout(0);
    // Colors are static per-pedestrian (unlike the matrices layout()
    // rebuilds every frame) — applied once here rather than every
    // frame, same as CityScape's own static-tint instances.
    applyInstances(torsoRef.current, [], torsoColors);
    applyInstances(headRef.current, [], headColors);
    applyInstances(legLRef.current, [], legColors);
    applyInstances(legRRef.current, [], legColors);
    applyInstances(armLRef.current, [], armColors);
    applyInstances(armRRef.current, [], armColors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedestrians]);

  useFrame((state) => {
    layout(state.clock.getElapsedTime());
  });

  return (
    <group>
      {/* Phong rather than flat Lambert, and a per-instance clothing/
          skin tint via instanceColor (see torsoColors/headColors/etc.
          above) rather than one fixed near-black material — the
          previous flat #14161c-family colors were nearly
          indistinguishable from the night sky/asphalt behind them at
          any real distance, which is why these read as invisible
          rather than as people in dark coats. */}
      <instancedMesh ref={torsoRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#3a4048" shininess={18} fog />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshPhongMaterial specular="#4a4038" shininess={12} fog />
      </instancedMesh>
      <instancedMesh ref={legLRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#2a3038" shininess={16} fog />
      </instancedMesh>
      <instancedMesh ref={legRRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#2a3038" shininess={16} fog />
      </instancedMesh>
      <instancedMesh ref={armLRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#3a4048" shininess={18} fog />
      </instancedMesh>
      <instancedMesh ref={armRRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#3a4048" shininess={18} fog />
      </instancedMesh>
      <instancedMesh ref={accentRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Ground contact glow — a soft warm-white pool at each person's
          feet, the same "anchored on the pavement" cue every other
          object in this scene already gets. */}
      <instancedMesh ref={groundGlowRef} args={[undefined, undefined, count]}>
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial
          color="#eaf0f5"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
