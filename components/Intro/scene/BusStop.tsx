"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";
import { keepClearOfLandmarks } from "./landmarkClearance";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const PEOPLE_PER_STOP = 2;
const ACCENTS = ["#6fc3f0", "#8fd6ff", "#b98bff", "#ffcf8f"];
// Same lit mid-tone clothing/skin palette Pedestrians.tsx uses — see
// that file's own comment for why a near-black figure against a night
// scene reads as invisible rather than as a person in a dark coat.
const CLOTHING_COLORS = ["#5a6b85", "#7a6a58", "#4a5a4a", "#6a5868", "#5a7080", "#8a7860"];
const SKIN_TONES = ["#c9a888", "#8a6248", "#e0b898", "#6a4a38"];

interface StopPlacement {
  x: number;
  z: number;
  side: -1 | 1;
  facing: number;
}

interface WaitingPerson {
  stopIdx: number;
  localX: number;
  localZ: number;
  swayPhase: number;
  accent: THREE.Color;
  clothing: THREE.Color;
  skin: THREE.Color;
}

/** Glass-and-steel bus/transit shelters along the sidewalk — a canopy
 * roof, a tinted glass back panel, a bench, and a small backlit route
 * sign, with a couple of people actually waiting under each one. The
 * one piece of street furniture this scene was missing that gives
 * pedestrians somewhere to gather rather than only ever being seen
 * mid-stride (see Pedestrians.tsx for the walking population this
 * complements). Positioned in the same road-shoulder corridor
 * StreetLights/HoloAds/StreetTrees already share, kept clear of cross
 * streets and the fixed landmark set-pieces the same way CityScape's
 * own buildings are. */
export function BusStop({ isMobile }: { isMobile: boolean }) {
  const stopCount = isMobile ? 3 : 6;
  const peopleCount = stopCount * PEOPLE_PER_STOP;

  const padRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const roofEdgeRef = useRef<THREE.InstancedMesh>(null);
  const panelRef = useRef<THREE.InstancedMesh>(null);
  const benchRef = useRef<THREE.InstancedMesh>(null);
  const signRef = useRef<THREE.InstancedMesh>(null);

  const torsoRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const legLRef = useRef<THREE.InstancedMesh>(null);
  const legRRef = useRef<THREE.InstancedMesh>(null);
  const accentRef = useRef<THREE.InstancedMesh>(null);
  const accentColors = useMemo(
    () => Array.from({ length: peopleCount }, () => new THREE.Color()),
    [peopleCount]
  );
  const torsoColors = useMemo(
    () => Array.from({ length: peopleCount }, () => new THREE.Color()),
    [peopleCount]
  );
  const headColors = useMemo(
    () => Array.from({ length: peopleCount }, () => new THREE.Color()),
    [peopleCount]
  );
  const legColors = useMemo(
    () => Array.from({ length: peopleCount }, () => new THREE.Color()),
    [peopleCount]
  );

  const stops = useMemo<StopPlacement[]>(
    () =>
      Array.from({ length: stopCount }, (_, i) => {
        const side = (i % 2 === 0 ? -1 : 1) as -1 | 1;
        const z = keepClearOfLandmarks(
          keepClearOfCrossStreets(32 - seeded(i, 501) * 150),
          side
        );
        return {
          x: side * (8.35 + seeded(i, 502) * 0.3),
          z,
          side,
          // Faces the road (inward), matching how a real shelter's open
          // side/bench always fronts the street rather than the
          // building line behind it.
          facing: side < 0 ? Math.PI / 2 : -Math.PI / 2,
        };
      }),
    [stopCount]
  );

  const people = useMemo<WaitingPerson[]>(() => {
    const list: WaitingPerson[] = [];
    stops.forEach((_, si) => {
      for (let p = 0; p < PEOPLE_PER_STOP; p++) {
        const idx = si * PEOPLE_PER_STOP + p;
        list.push({
          stopIdx: si,
          localX: (p - (PEOPLE_PER_STOP - 1) / 2) * 0.5,
          localZ: 0.35 + seeded(idx, 503) * 0.15,
          swayPhase: seeded(idx, 504) * Math.PI * 2,
          accent: new THREE.Color(ACCENTS[idx % ACCENTS.length]),
          clothing: new THREE.Color(
            CLOTHING_COLORS[Math.floor(seeded(idx, 505) * CLOTHING_COLORS.length)]
          ),
          skin: new THREE.Color(SKIN_TONES[Math.floor(seeded(idx, 506) * SKIN_TONES.length)]),
        });
      }
    });
    return list;
  }, [stops]);

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

  // Shelter structures are static — built once, not per-frame.
  const shelterData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const padMatrices: THREE.Matrix4[] = [];
    const postMatrices: THREE.Matrix4[] = [];
    const roofMatrices: THREE.Matrix4[] = [];
    const roofEdgeMatrices: THREE.Matrix4[] = [];
    const panelMatrices: THREE.Matrix4[] = [];
    const benchMatrices: THREE.Matrix4[] = [];
    const signMatrices: THREE.Matrix4[] = [];

    const width = 2.4;
    const depth = 0.9;
    const roofHeight = 2.3;

    stops.forEach((stop) => {
      // Ground pad the shelter sits on.
      dummy.position.set(stop.x, 0.012, stop.z);
      dummy.scale.set(depth * 1.3, width * 1.2, 1);
      dummy.rotation.set(-Math.PI / 2, 0, stop.facing);
      dummy.updateMatrix();
      padMatrices.push(dummy.matrix.clone());

      // Two support posts at the back corners.
      [-1, 1].forEach((wz) => {
        const p = new THREE.Vector3(0, roofHeight / 2, (width / 2 - 0.15) * wz)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.facing)
          .add(new THREE.Vector3(stop.x, 0, stop.z));
        dummy.position.copy(p);
        dummy.rotation.set(0, stop.facing, 0);
        dummy.scale.set(0.06, roofHeight, 0.06);
        dummy.updateMatrix();
        postMatrices.push(dummy.matrix.clone());
      });

      // Flat canopy roof, slightly overhanging the posts.
      const roofP = new THREE.Vector3(-depth * 0.1, roofHeight, 0)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.facing)
        .add(new THREE.Vector3(stop.x, 0, stop.z));
      dummy.position.copy(roofP);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(depth * 1.2, 0.08, width * 1.1);
      dummy.updateMatrix();
      roofMatrices.push(dummy.matrix.clone());

      dummy.position.set(roofP.x, roofHeight - 0.06, roofP.z);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(depth * 1.22, 0.015, width * 1.12);
      dummy.updateMatrix();
      roofEdgeMatrices.push(dummy.matrix.clone());

      // Tinted glass back panel, closing off the side away from the
      // road.
      const panelP = new THREE.Vector3(depth * 0.45, roofHeight * 0.42, 0)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.facing)
        .add(new THREE.Vector3(stop.x, 0, stop.z));
      dummy.position.copy(panelP);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(0.04, roofHeight * 0.82, width * 0.96);
      dummy.updateMatrix();
      panelMatrices.push(dummy.matrix.clone());

      // Bench along the back panel.
      const benchP = new THREE.Vector3(depth * 0.2, 0.28, 0)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.facing)
        .add(new THREE.Vector3(stop.x, 0, stop.z));
      dummy.position.copy(benchP);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(0.35, 0.06, width * 0.75);
      dummy.updateMatrix();
      benchMatrices.push(dummy.matrix.clone());

      // Backlit route-info sign on one post.
      const signP = new THREE.Vector3(depth * 0.32, roofHeight * 0.62, width / 2 - 0.2)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.facing)
        .add(new THREE.Vector3(stop.x, 0, stop.z));
      dummy.position.copy(signP);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(0.03, 0.55, 0.34);
      dummy.updateMatrix();
      signMatrices.push(dummy.matrix.clone());
    });

    return {
      padMatrices,
      postMatrices,
      roofMatrices,
      roofEdgeMatrices,
      panelMatrices,
      benchMatrices,
      signMatrices,
    };
  }, [stops]);

  useLayoutEffect(() => applyInstances(padRef.current, shelterData.padMatrices), [shelterData]);
  useLayoutEffect(() => applyInstances(postRef.current, shelterData.postMatrices), [shelterData]);
  useLayoutEffect(() => applyInstances(roofRef.current, shelterData.roofMatrices), [shelterData]);
  useLayoutEffect(
    () => applyInstances(roofEdgeRef.current, shelterData.roofEdgeMatrices),
    [shelterData]
  );
  useLayoutEffect(() => applyInstances(panelRef.current, shelterData.panelMatrices), [shelterData]);
  useLayoutEffect(() => applyInstances(benchRef.current, shelterData.benchMatrices), [shelterData]);
  useLayoutEffect(() => applyInstances(signRef.current, shelterData.signMatrices), [shelterData]);

  const layoutPeople = (t: number) => {
    const dummy = new THREE.Object3D();
    const torsoMatrices: THREE.Matrix4[] = [];
    const headMatrices: THREE.Matrix4[] = [];
    const legLMatrices: THREE.Matrix4[] = [];
    const legRMatrices: THREE.Matrix4[] = [];
    const accentMatrices: THREE.Matrix4[] = [];

    const legLength = 0.85;
    const torsoHeight = 0.5;
    const headRadius = 0.13;

    people.forEach((person, i) => {
      const stop = stops[person.stopIdx];
      const world = new THREE.Vector3(person.localX, 0, person.localZ)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), stop.facing)
        .add(new THREE.Vector3(stop.x, 0, stop.z));
      // A slow, small weight-shift sway rather than a walk cycle — this
      // person is standing still waiting, not going anywhere.
      const sway = Math.sin(t * 0.6 + person.swayPhase) * 0.02;

      dummy.position.set(world.x + sway, legLength + torsoHeight / 2, world.z);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(0.34, torsoHeight, 0.2);
      dummy.updateMatrix();
      torsoMatrices.push(dummy.matrix.clone());

      dummy.position.set(world.x + sway, legLength + torsoHeight + headRadius, world.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(headRadius);
      dummy.updateMatrix();
      headMatrices.push(dummy.matrix.clone());

      dummy.position.set(world.x + sway, legLength / 2, world.z);
      dummy.rotation.set(0, stop.facing, 0);
      dummy.scale.set(0.11, legLength, 0.11);
      dummy.updateMatrix();
      legLMatrices.push(dummy.matrix.clone());

      // Feet stay planted (no per-leg offset) — a standing figure's
      // stance is static, unlike Pedestrians' walking fore/aft slide.
      legRMatrices.push(dummy.matrix.clone());

      dummy.position.set(world.x + sway, legLength + torsoHeight * 0.65, world.z + 0.11);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.06);
      dummy.updateMatrix();
      accentMatrices.push(dummy.matrix.clone());
      accentColors[i]?.copy(person.accent);
    });

    applyInstances(torsoRef.current, torsoMatrices);
    applyInstances(headRef.current, headMatrices);
    applyInstances(legLRef.current, legLMatrices);
    applyInstances(legRRef.current, legRMatrices);
    applyInstances(accentRef.current, accentMatrices, accentColors);
  };

  useLayoutEffect(() => {
    people.forEach((p, i) => {
      torsoColors[i]?.copy(p.clothing);
      headColors[i]?.copy(p.skin);
      legColors[i]?.copy(p.clothing).multiplyScalar(0.55);
    });
    layoutPeople(0);
    // Colors are static per-person — applied once here, matrices get
    // rebuilt every frame via useFrame below.
    applyInstances(torsoRef.current, [], torsoColors);
    applyInstances(headRef.current, [], headColors);
    applyInstances(legLRef.current, [], legColors);
    applyInstances(legRRef.current, [], legColors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people]);

  useFrame((state) => layoutPeople(state.clock.getElapsedTime()));

  return (
    <group>
      <instancedMesh ref={padRef} args={[undefined, undefined, stopCount]}>
        <planeGeometry args={[1, 1]} />
        <meshLambertMaterial color="#20232a" fog />
      </instancedMesh>

      <instancedMesh ref={postRef} args={[undefined, undefined, stopCount * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#14161c" specular="#3a4a60" shininess={40} fog />
      </instancedMesh>

      <instancedMesh ref={roofRef} args={[undefined, undefined, stopCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#1a1d24" specular="#4a5a70" shininess={35} fog />
      </instancedMesh>

      <instancedMesh ref={roofEdgeRef} args={[undefined, undefined, stopCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#6fc3f0"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={panelRef} args={[undefined, undefined, stopCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#1c2c3a"
          specular="#5a8ab0"
          shininess={60}
          transparent
          opacity={0.5}
          fog
        />
      </instancedMesh>

      <instancedMesh ref={benchRef} args={[undefined, undefined, stopCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#2a2d34" fog />
      </instancedMesh>

      <instancedMesh ref={signRef} args={[undefined, undefined, stopCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#bfe8ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Waiting people — lit mid-tone clothing/skin via instanceColor
          (see torsoColors/headColors/legColors above) rather than the
          near-black flat tones this used to have, same fix as
          Pedestrians.tsx and for the same reason: those were nearly
          invisible against a night scene. */}
      <instancedMesh ref={torsoRef} args={[undefined, undefined, peopleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#3a4048" shininess={18} fog />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, peopleCount]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshPhongMaterial specular="#4a4038" shininess={12} fog />
      </instancedMesh>
      <instancedMesh ref={legLRef} args={[undefined, undefined, peopleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#2a3038" shininess={16} fog />
      </instancedMesh>
      <instancedMesh ref={legRRef} args={[undefined, undefined, peopleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#2a3038" shininess={16} fog />
      </instancedMesh>
      <instancedMesh ref={accentRef} args={[undefined, undefined, peopleCount]}>
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
    </group>
  );
}
