"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CROSS_STREET_Z } from "./crossStreetPositions";
import {
  ASPHALT_COLOR,
  ROAD_EDGE_LINE_COLOR,
  ROAD_DASH_LINE_COLOR,
  paintAsphaltGrain,
  applyRoadTextureDefaults,
} from "./roadSurface";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const CROSS_STREET_LENGTH = 74;
const CROSS_STREET_WIDTH = 9;

/** A cross-street asphalt texture built with the length axis running
 * horizontally (U) rather than vertically — the opposite orientation
 * from HighwayRoad's own texture — since these strips run perpendicular
 * to the main road, spanning across X instead of along Z. Same shared
 * asphalt color/grain/line colors as the main road (see roadSurface.ts)
 * so every paved surface in the scene reads as one continuous material
 * rather than each road defining its own slightly-different grey. */
function buildCrossStreetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = ASPHALT_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  paintAsphaltGrain(ctx, canvas.width, canvas.height);

  // Edge lines along both long sides of the strip.
  ctx.strokeStyle = ROAD_EDGE_LINE_COLOR;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(canvas.width, 10);
  ctx.moveTo(0, canvas.height - 10);
  ctx.lineTo(canvas.width, canvas.height - 10);
  ctx.stroke();

  // Dashed center line running the length of the strip.
  ctx.strokeStyle = ROAD_DASH_LINE_COLOR;
  ctx.lineWidth = 4;
  ctx.setLineDash([28, 22]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(CROSS_STREET_LENGTH / 8, 1);
  applyRoadTextureDefaults(texture);
  return texture;
}

// One shared traffic-light cycle every pole steps through — red, then a
// short amber, then green — with each intersection offset by its own
// phase so they're not all switching in lockstep.
const CYCLE: { color: number; duration: number }[] = [
  { color: 0, duration: 4.2 }, // red
  { color: 1, duration: 1 }, // amber
  { color: 2, duration: 4.2 }, // green
];
const CYCLE_TOTAL = CYCLE.reduce((sum, s) => sum + s.duration, 0);
const SIGNAL_COLORS = ["#ff3b30", "#ffcc00", "#3ddc55"];
const SIGNAL_DIM = ["#8a2a2a", "#8a7a2a", "#2a7a3a"];

function activeColorIndex(t: number): number {
  let x = ((t % CYCLE_TOTAL) + CYCLE_TOTAL) % CYCLE_TOTAL;
  for (const step of CYCLE) {
    if (x < step.duration) return step.color;
    x -= step.duration;
  }
  return CYCLE[CYCLE.length - 1].color;
}

/** Perpendicular cross streets threading through the gaps between
 * buildings, each with a pair of traffic-signal poles at the corners
 * where it meets the main road — the flanking skyline reads as a
 * single unbroken canyon otherwise, with no sense of a real street
 * grid behind the first row of towers. Purely a visual layer (no
 * actual intersection logic, nothing ever turns off the main road):
 * the streets are flat textured strips crossing under/between the
 * existing buildings, and the signals cycle on their own timer purely
 * for the "living city" motion cue. */
export function CrossStreets({ isMobile: _isMobile }: { isMobile: boolean }) {
  const streetRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const housingRef = useRef<THREE.InstancedMesh>(null);
  const dotRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  const texture = useMemo(() => buildCrossStreetTexture(), []);

  // A handful of fixed intersections (shared with CityScape/
  // BuildingBanners, which both keep their own building placements
  // clear of the same spots) rather than a scattered/randomized count
  // — few enough that each one reads as a deliberate city block, not
  // a grid stamped over the whole corridor.
  const crossZ = CROSS_STREET_Z;

  const streetMatrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    return crossZ.map((z) => {
      // Above CityScape's per-building contact-shadow discs (y=0.01,
      // multiply-blended, depth-tested but not depth-written) so a
      // nearby building's shadow can't darken the asphalt right
      // through it. Deliberately still a hair below HighwayRoad's own
      // y=0.025 — see the comment there — so the two coplanar road
      // meshes don't z-fight where they cross.
      dummy.position.set(0, 0.02, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(CROSS_STREET_LENGTH, CROSS_STREET_WIDTH, 1);
      dummy.updateMatrix();
      return dummy.matrix.clone();
    });
  }, [crossZ]);

  // Two signal poles per intersection, one at each near corner where
  // the cross street meets the main road.
  const poleData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const poleMatrices: THREE.Matrix4[] = [];
    const housingMatrices: THREE.Matrix4[] = [];
    const dotMatrices: THREE.Matrix4[] = [];
    const dotColors: THREE.Color[] = [];
    const positions: { x: number; z: number; phase: number }[] = [];

    crossZ.forEach((z, i) => {
      const phase = seeded(i, 62) * CYCLE_TOTAL;
      [-1, 1].forEach((side) => {
        const x = side * 9.4;
        const zEdge = z - side * (CROSS_STREET_WIDTH / 2 + 0.6);
        positions.push({ x, z: zEdge, phase });

        // Sized to actually read at a glance against the skyline
        // rather than scale-accurate — a realistically slim pole is
        // invisible in a wide shot next to towers this tall.
        const poleHeight = 4.4;
        dummy.position.set(x, poleHeight / 2, zEdge);
        dummy.scale.set(0.11, poleHeight, 0.11);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        poleMatrices.push(dummy.matrix.clone());

        dummy.position.set(x, poleHeight + 0.32, zEdge);
        dummy.scale.set(0.32, 0.76, 0.26);
        dummy.updateMatrix();
        housingMatrices.push(dummy.matrix.clone());

        for (let c = 0; c < 3; c++) {
          dummy.position.set(x, poleHeight + 0.56 - c * 0.26, zEdge + 0.14);
          dummy.scale.setScalar(0.1);
          dummy.updateMatrix();
          dotMatrices.push(dummy.matrix.clone());
          dotColors.push(new THREE.Color(SIGNAL_DIM[c]));
        }
      });
    });

    return { poleMatrices, housingMatrices, dotMatrices, dotColors, positions };
  }, [crossZ]);

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

  useLayoutEffect(() => applyInstances(streetRef.current, streetMatrices), [streetMatrices]);
  useLayoutEffect(
    () => applyInstances(poleRef.current, poleData.poleMatrices),
    [poleData]
  );
  useLayoutEffect(
    () => applyInstances(housingRef.current, poleData.housingMatrices),
    [poleData]
  );
  useLayoutEffect(
    () => applyInstances(dotRef.current, poleData.dotMatrices, poleData.dotColors),
    [poleData]
  );

  const glowColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const glow = glowRef.current;
    if (!glow) return;
    const dummy = new THREE.Object3D();
    poleData.positions.forEach((p, i) => {
      const active = activeColorIndex(t + p.phase);
      dummy.position.set(p.x, 4.4 + 0.56 - active * 0.26, p.z + 0.15);
      dummy.scale.setScalar(0.15);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
      glowColor.set(SIGNAL_COLORS[active]);
      glow.setColorAt(i, glowColor);
    });
    glow.instanceMatrix.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* fog={false} — matches HighwayRoad's own material for exactly
          the same reason: with fog on, a cross street's color shifts
          with its distance from the camera, which is what made it read
          as a different shade of asphalt than the main road instead of
          the same paved surface. */}
      <instancedMesh ref={streetRef} args={[undefined, undefined, crossZ.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} fog={false} />
      </instancedMesh>

      <instancedMesh ref={poleRef} args={[undefined, undefined, poleData.poleMatrices.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#22242a" fog />
      </instancedMesh>

      <instancedMesh ref={housingRef} args={[undefined, undefined, poleData.housingMatrices.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#15161a" fog />
      </instancedMesh>

      {/* Dim, always-visible red/amber/green dots — the ones not
          currently active read as an unlit lens rather than vanishing
          entirely. */}
      <instancedMesh ref={dotRef} args={[undefined, undefined, poleData.dotMatrices.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* The one bright, actively-lit lens per pole — repositioned and
          recolored every frame to whichever slot is currently active. */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, poleData.positions.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
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
