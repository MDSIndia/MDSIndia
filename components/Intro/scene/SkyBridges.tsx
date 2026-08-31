"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getLeafCardTexture } from "./leafTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const TREES_PER_BRIDGE = 5;
const CANOPY_GREENS = ["#3a7d44", "#4f9e5f", "#2f6b3a", "#5aa668"];

/** Elevated garden decks spanning the highway between towers — a real
 * walkable-scale platform (not a thin plank) topped with a scattering
 * of small trees and flanked by a glass guardrail on each long edge,
 * the "hanging gardens on a sky bridge" look the reference art's own
 * elevated structures carry, rather than a bare glass slab. Deck body,
 * railings, and trees are all instanced per-bridge; the underside
 * still gets the same soft glow accent the original plain version
 * had. */
export function SkyBridges({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 5 : 9;
  const treeCount = count * TREES_PER_BRIDGE;
  // Two crossed cards per tree (a cheap billboard-cross) rather than
  // one flat plane — a single card disappears edge-on from some
  // viewing angles; two perpendicular cards keep some silhouette
  // visible from any direction these small deck-top trees are seen
  // from during the flythrough.
  const canopyCardCount = treeCount * 2;
  const leafTexture = useMemo(() => getLeafCardTexture(), []);

  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const walkwayRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.InstancedMesh>(null);
  const railRef = useRef<THREE.InstancedMesh>(null);
  const railGlowRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const canopyColors = useMemo(
    () => Array.from({ length: canopyCardCount }, () => new THREE.Color()),
    [canopyCardCount]
  );

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const bodyMatrices: THREE.Matrix4[] = [];
    const walkwayMatrices: THREE.Matrix4[] = [];
    const edgeMatrices: THREE.Matrix4[] = [];
    const railMatrices: THREE.Matrix4[] = [];
    const railGlowMatrices: THREE.Matrix4[] = [];
    const trunkMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];

    // A real walkable-scale platform rather than a thin plank — deep
    // enough (along Z) to actually carry a row of trees and a railing
    // on each side and still read as a deck, not a beam.
    const deckDepth = 3.4;
    const deckHeight = 0.35;

    for (let i = 0; i < count; i++) {
      const z = 30 - seeded(i, 31) * 120;
      // Was a flat 10-38 range — every sky bridge here spans the full
      // road width (span below reaches ±22), so any bridge landing near
      // ElevatedTrain's own height (y=16.5, running directly above this
      // same road corridor — see ElevatedTrain.tsx) would cross straight
      // through the train's flight path. Carved a gap out of the range
      // (14-19.5) so a bridge always clears above or below it, the two
      // sub-ranges weighted by their own width so the overall 10-38
      // density stays even rather than piling up at one edge.
      const GAP_LO = 14;
      const GAP_HI = 19.5;
      const lowSpan = GAP_LO - 10;
      const highSpan = 38 - GAP_HI;
      const roll = seeded(i, 32) * (lowSpan + highSpan);
      const y = roll < lowSpan ? 10 + roll : GAP_HI + (roll - lowSpan);
      const span = 30 + seeded(i, 33) * 14;
      const tilt = (seeded(i, 34) - 0.5) * 0.06;
      const cos = Math.cos(tilt);
      const sin = Math.sin(tilt);

      dummy.position.set(0, y, z);
      dummy.rotation.set(0, tilt, 0);
      dummy.scale.set(span, deckHeight, deckDepth);
      dummy.updateMatrix();
      bodyMatrices.push(dummy.matrix.clone());

      // Lit walkway strip on top — a warm, softly-lit deck surface
      // rather than a bare glass roof, the "people actually use this"
      // cue.
      dummy.position.set(0, y + deckHeight / 2 + 0.01, z);
      dummy.rotation.set(0, tilt, 0);
      dummy.scale.set(span * 0.94, 0.01, deckDepth * 0.7);
      dummy.updateMatrix();
      walkwayMatrices.push(dummy.matrix.clone());

      dummy.position.set(0, y - deckHeight / 2 - 0.02, z);
      dummy.rotation.set(0, tilt, 0);
      dummy.scale.set(span - 1, 0.03, deckDepth * 0.85);
      dummy.updateMatrix();
      edgeMatrices.push(dummy.matrix.clone());

      // Glass guardrail along each long edge, with a thin glowing cap —
      // the "someone could actually walk along here without falling
      // off" detail a bare slab was missing.
      [-1, 1].forEach((edge) => {
        const railLocalZ = edge * (deckDepth / 2 - 0.05);
        const railWorldZ = z + railLocalZ * cos;
        const railWorldX = railLocalZ * sin;
        dummy.position.set(railWorldX, y + deckHeight / 2 + 0.35, railWorldZ);
        dummy.rotation.set(0, tilt, 0);
        dummy.scale.set(span * 0.94, 0.7, 0.04);
        dummy.updateMatrix();
        railMatrices.push(dummy.matrix.clone());

        dummy.position.set(railWorldX, y + deckHeight / 2 + 0.7, railWorldZ);
        dummy.rotation.set(0, tilt, 0);
        dummy.scale.set(span * 0.94, 0.02, 0.05);
        dummy.updateMatrix();
        railGlowMatrices.push(dummy.matrix.clone());
      });

      // A scattering of small trees along the deck's own length — the
      // literal "hanging garden on a sky bridge" the reference art's
      // elevated structures carry.
      for (let t = 0; t < TREES_PER_BRIDGE; t++) {
        const treeIdx = i * TREES_PER_BRIDGE + t;
        const localX = (seeded(treeIdx, 35) - 0.5) * span * 0.85;
        const localZ = (seeded(treeIdx, 36) - 0.5) * deckDepth * 0.5;
        const worldX = localX * cos - localZ * sin;
        const worldZ = z + localX * sin + localZ * cos;
        const trunkHeight = 0.6 + seeded(treeIdx, 37) * 0.35;
        const canopyRadius = 0.35 + seeded(treeIdx, 38) * 0.25;
        const baseY = y + deckHeight / 2;

        dummy.position.set(worldX, baseY + trunkHeight / 2, worldZ);
        dummy.rotation.set(0, seeded(treeIdx, 39) * Math.PI, 0);
        dummy.scale.set(0.08, trunkHeight, 0.08);
        dummy.updateMatrix();
        trunkMatrices.push(dummy.matrix.clone());

        const canopyY = baseY + trunkHeight + canopyRadius * 0.75;
        const treeColor = CANOPY_GREENS[treeIdx % CANOPY_GREENS.length];
        for (let c = 0; c < 2; c++) {
          dummy.position.set(worldX, canopyY, worldZ);
          dummy.rotation.set(
            seeded(treeIdx * 2 + c, 40) * Math.PI,
            (c / 2) * Math.PI + seeded(treeIdx, 39) * Math.PI,
            0
          );
          dummy.scale.set(canopyRadius * 1.8, canopyRadius * 1.8, 1);
          dummy.updateMatrix();
          canopyMatrices.push(dummy.matrix.clone());
          canopyColors[treeIdx * 2 + c]?.set(treeColor);
        }
      }
    }

    return {
      bodyMatrices,
      walkwayMatrices,
      edgeMatrices,
      railMatrices,
      railGlowMatrices,
      trunkMatrices,
      canopyMatrices,
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

  useLayoutEffect(() => applyInstances(bodyRef.current, data.bodyMatrices), [data]);
  useLayoutEffect(() => applyInstances(walkwayRef.current, data.walkwayMatrices), [data]);
  useLayoutEffect(() => applyInstances(edgeRef.current, data.edgeMatrices), [data]);
  useLayoutEffect(() => applyInstances(railRef.current, data.railMatrices), [data]);
  useLayoutEffect(() => applyInstances(railGlowRef.current, data.railGlowMatrices), [data]);
  useLayoutEffect(() => applyInstances(trunkRef.current, data.trunkMatrices), [data]);
  useLayoutEffect(
    () => applyInstances(canopyRef.current, data.canopyMatrices, canopyColors),
    [data]
  );

  useFrame(() => {
    const mat = edgeRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.16;
  });

  return (
    <group>
      {/* Lit (Lambert) rather than flat MeshBasicMaterial — an unlit
          panel this dark reads as nearly invisible against a night
          sky, which is exactly what let the additive edge strip below
          dominate as a stray glowing bar instead of a physical
          structure. A lit, more opaque body actually catches the rig
          light and reads as glass/metal spanning the road. */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial
          color="#26364f"
          transparent
          opacity={0.75}
          fog
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Warm walkway light strip on the deck's own top surface. */}
      <instancedMesh ref={walkwayRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ffdca8"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* A subtle underside accent, not the dominant element — pulled
          back in both opacity and size so it reads as trim on the
          bridge rather than a bright line floating on its own. */}
      <instancedMesh ref={edgeRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#8fb4d8"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* Glass guardrail along each deck edge. */}
      <instancedMesh ref={railRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#3a5a78"
          specular="#8fc4e8"
          shininess={60}
          transparent
          opacity={0.4}
          fog
        />
      </instancedMesh>
      <instancedMesh ref={railGlowRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#7fe0ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Trees scattered along the deck — see TREES_PER_BRIDGE above. */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, treeCount]}>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshLambertMaterial color="#3a2a1e" fog />
      </instancedMesh>
      {/* Textured alpha-cutout leaf cards rather than a solid
          icosahedron — see leafTexture.ts: a shape built from polygons
          reads as geometric no matter how round, while a painted,
          irregular leaf-cluster silhouette does not. */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, canopyCardCount]}>
        <planeGeometry args={[1, 1]} />
        <meshLambertMaterial map={leafTexture} alphaTest={0.45} side={THREE.DoubleSide} fog />
      </instancedMesh>
    </group>
  );
}
