"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";
import { getBarkTexture } from "./barkTexture";
import { getLeafCardTexture } from "./leafTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Reused every frame for the canopy wind-sway loop below rather than
// allocating a new Object3D per card per frame.
const swayDummy = new THREE.Object3D();

// A few natural canopy greens rather than one flat tint, so a run of
// trees along the sidewalk doesn't read as identical cutouts stamped
// down the block.
const CANOPY_GREENS = ["#3a7d44", "#4f9e5f", "#2f6b3a", "#5aa668"];
// Leaf cards per tree — see the canopy comment below for why solid
// geometric lobes (spheres/icosahedrons) were replaced with textured
// alpha-cutout cards. Cards are thinner than solid lobes so it takes a
// few more of them to read as a full crown with no gaps.
const LOBES_PER_TREE = 7;
const VEINS_PER_TREE = 3;
const ROOTS_PER_TREE = 3;
const CRYSTALS_PER_TREE = 3;
const GLOW_BLUE = "#6fd6ff";

interface CanopyCard {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  phase: number;
  speed: number;
  amplitude: number;
}

/** Street trees planted in the same sidewalk gap ParkingLot/HoloAds
 * use (road plane ends at x=8, building line starts at x=11 — see
 * Ground.tsx/CityScape's own x >= 11 invariant) — the ground-level
 * greenery a real boulevard has. Built as a "bioluminescent tree of
 * life" per explicit reference: a full, lumpy multi-lobe canopy (real
 * canopies are asymmetric foliage clusters, not one sphere on a
 * stick), glowing blue veins spiraling up the trunk, glowing roots
 * splaying out at the base into the pavement, and a few glowing
 * crystal-leaf accents nested in the foliage — the natural silhouette
 * carrying the same "everything has an accent light" bioluminescent
 * language the rest of this scene's greenery (Biodome, FuturisticPark)
 * already uses, just pushed further toward the reference's fantastical
 * glowing tree. The glow elements pulse gently; everything else is
 * static (trees don't need to do anything but stand there). */
export function StreetTrees({ isMobile }: { isMobile: boolean }) {
  // Raised again (18/34 -> 24/44) at explicit "make the whole city look
  // natural" request — denser street planting reads as an actual green
  // boulevard rather than occasional punctuation.
  const count = isMobile ? 24 : 44;
  const lobeCount = count * LOBES_PER_TREE;
  const barkTexture = useMemo(() => getBarkTexture(), []);
  const leafTexture = useMemo(() => getLeafCardTexture(), []);
  const veinCount = count * VEINS_PER_TREE;
  const rootCount = count * ROOTS_PER_TREE;
  const crystalCount = count * CRYSTALS_PER_TREE;

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);
  const veinRef = useRef<THREE.InstancedMesh>(null);
  const rootRef = useRef<THREE.InstancedMesh>(null);
  const rootGlowRef = useRef<THREE.InstancedMesh>(null);
  const crystalRef = useRef<THREE.InstancedMesh>(null);
  const veinMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const crystalMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const trunkMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];
    const canopyColors: THREE.Color[] = [];
    const canopyCards: CanopyCard[] = [];
    const shadowMatrices: THREE.Matrix4[] = [];
    const veinMatrices: THREE.Matrix4[] = [];
    const rootMatrices: THREE.Matrix4[] = [];
    const rootGlowMatrices: THREE.Matrix4[] = [];
    const crystalMatrices: THREE.Matrix4[] = [];

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

      // Glowing veins spiraling up the trunk — short diagonal segments
      // wound around the trunk's own axis, standing in for the
      // reference's lit circuitry-in-bark look.
      for (let v = 0; v < VEINS_PER_TREE; v++) {
        const t = (v + 0.5) / VEINS_PER_TREE;
        const veinAngle = t * Math.PI * 2.4 + seeded(i, 320) * Math.PI * 2;
        const veinY = trunkHeight * (0.12 + t * 0.72);
        const veinRadius = 0.12 * (1 - t * 0.3);
        dummy.position.set(
          x + Math.cos(veinAngle) * veinRadius,
          veinY,
          z + Math.sin(veinAngle) * veinRadius
        );
        dummy.rotation.set(0, -veinAngle, Math.PI / 5);
        dummy.scale.set(0.025, trunkHeight * 0.22, 0.025);
        dummy.updateMatrix();
        veinMatrices.push(dummy.matrix.clone());
      }

      // Glowing roots splaying out from the trunk's base into the
      // pavement — the reference's own braided, luminous root mass,
      // simplified to a few angled tapered tendrils.
      for (let r = 0; r < ROOTS_PER_TREE; r++) {
        const rootAngle = (r / ROOTS_PER_TREE) * Math.PI * 2 + seeded(i, 330 + r) * 0.8;
        const rootLen = 0.32 + seeded(i, 340 + r) * 0.16;
        const rootMidX = x + Math.cos(rootAngle) * rootLen * 0.5;
        const rootMidZ = z + Math.sin(rootAngle) * rootLen * 0.5;
        dummy.position.set(rootMidX, 0.035, rootMidZ);
        // Lays the cylinder's own Y-axis flat and points it along
        // (cos(rootAngle), 0, sin(rootAngle)) — verified by composing
        // the two rotations by hand (Three's default Euler order
        // applies X first, then Y, to a point), rather than guessed:
        // a wrong sign here would send every root pointing straight up
        // instead of splaying out along the ground.
        dummy.rotation.set(-Math.PI / 2, -(Math.PI / 2 + rootAngle), 0);
        dummy.scale.set(0.045, rootLen, 0.045);
        dummy.updateMatrix();
        rootMatrices.push(dummy.matrix.clone());

        // A soft ground glow pooling at each root's outer tip.
        dummy.position.set(
          x + Math.cos(rootAngle) * rootLen,
          0.02,
          z + Math.sin(rootAngle) * rootLen
        );
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(0.16, 0.16, 1);
        dummy.updateMatrix();
        rootGlowMatrices.push(dummy.matrix.clone());
      }

      // Seven overlapping textured leaf cards clustered around the
      // trunk's top rather than solid geometric lobes — see the canopy
      // material comment below for why a shape built from polygons
      // (even a smooth one) still reads as geometric. Each card is a
      // flat plane carrying an alpha-cutout leaf-cluster texture
      // (leafTexture.ts), so the crown's silhouette comes from painted,
      // irregular alpha edges rather than mesh geometry. The first
      // (largest) card sits dead-center for a stable core mass; the
      // rest offset outward at random angles/heights, each rotated
      // freely in 3D (not just around Y) so the cluster reads as
      // volumetric foliage from any viewing angle instead of a fan of
      // flat cards all facing the same way.
      const canopyBaseY = trunkHeight + canopyRadius * 0.7;
      const baseGreen = CANOPY_GREENS[i % CANOPY_GREENS.length];
      for (let l = 0; l < LOBES_PER_TREE; l++) {
        const isCore = l === 0;
        const lobeAngle = seeded(i * 5 + l, 307) * Math.PI * 2;
        const lobeDist = isCore ? 0 : canopyRadius * (0.4 + seeded(i * 5 + l, 308) * 0.45);
        const lobeScale = isCore ? 1.3 : 0.75 + seeded(i * 5 + l, 309) * 0.5;
        const lobeYOffset = isCore ? 0 : (seeded(i * 5 + l, 310) - 0.25) * canopyRadius * 0.7;

        const cardX = x + Math.cos(lobeAngle) * lobeDist;
        const cardY = canopyBaseY + lobeYOffset;
        const cardZ = z + Math.sin(lobeAngle) * lobeDist;
        const cardRotX = seeded(i * 5 + l, 313) * Math.PI;
        const cardRotY = seeded(i * 5 + l, 311) * Math.PI;
        const cardRotZ = seeded(i * 5 + l, 314) * Math.PI;
        const cardScale = canopyRadius * lobeScale;

        dummy.position.set(cardX, cardY, cardZ);
        dummy.scale.set(cardScale, cardScale, 1);
        dummy.rotation.set(cardRotX, cardRotY, cardRotZ);
        dummy.updateMatrix();
        canopyMatrices.push(dummy.matrix.clone());

        // Per-card wind sway — see the useFrame loop below. Own
        // phase/speed per card (not shared across the tree, let alone
        // the whole street) so neighboring leaf clusters don't flutter
        // in lockstep, the same "everything blinks/pulses on one
        // shared clock" issue fixed for the antenna beacons.
        canopyCards.push({
          x: cardX,
          y: cardY,
          z: cardZ,
          rotX: cardRotX,
          rotY: cardRotY,
          rotZ: cardRotZ,
          scale: cardScale,
          phase: seeded(i * 5 + l, 315) * Math.PI * 2,
          speed: 0.7 + seeded(i * 5 + l, 316) * 0.6,
          amplitude: 0.05 + seeded(i * 5 + l, 317) * 0.06,
        });

        // Secondary lobes shaded a touch darker/lighter than the core
        // — real foliage clumps catch light unevenly, not one flat
        // tint repeated across the whole canopy.
        const lobeColor = new THREE.Color(baseGreen);
        if (!isCore) lobeColor.multiplyScalar(0.8 + seeded(i * 5 + l, 312) * 0.35);
        // A slight hue jitter on top of the brightness variance above
        // — real foliage clumps aren't just lighter/darker copies of
        // the same green, the color itself drifts slightly toward
        // neighboring greens too.
        lobeColor.lerp(
          new THREE.Color(CANOPY_GREENS[(i + l + 1) % CANOPY_GREENS.length]),
          seeded(i * 5 + l, 318) * 0.25
        );
        canopyColors.push(lobeColor);
      }

      // Glowing crystal-leaf accents nested in the canopy — small
      // faceted gems standing in for the reference's lit diamond-shaped
      // leaves scattered through the foliage.
      for (let c = 0; c < CRYSTALS_PER_TREE; c++) {
        const crystalAngle = seeded(i * 3 + c, 350) * Math.PI * 2;
        const crystalDist = canopyRadius * (0.3 + seeded(i * 3 + c, 351) * 0.7);
        const crystalY =
          canopyBaseY + (seeded(i * 3 + c, 352) - 0.2) * canopyRadius * 0.9;
        dummy.position.set(
          x + Math.cos(crystalAngle) * crystalDist,
          crystalY,
          z + Math.sin(crystalAngle) * crystalDist
        );
        dummy.rotation.set(
          seeded(i * 3 + c, 353) * Math.PI,
          seeded(i * 3 + c, 354) * Math.PI,
          0
        );
        dummy.scale.setScalar(0.07 + seeded(i * 3 + c, 355) * 0.05);
        dummy.updateMatrix();
        crystalMatrices.push(dummy.matrix.clone());
      }

      dummy.position.set(x, 0.012, z);
      dummy.scale.set(canopyRadius * 1.7, canopyRadius * 1.7, 1);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      shadowMatrices.push(dummy.matrix.clone());
    }

    return {
      trunkMatrices,
      canopyMatrices,
      canopyColors,
      canopyCards,
      shadowMatrices,
      veinMatrices,
      rootMatrices,
      rootGlowMatrices,
      crystalMatrices,
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

  useLayoutEffect(() => applyInstances(trunkRef.current, data.trunkMatrices), [data]);
  useLayoutEffect(
    () => applyInstances(canopyRef.current, data.canopyMatrices, data.canopyColors),
    [data]
  );
  useLayoutEffect(() => applyInstances(shadowRef.current, data.shadowMatrices), [data]);
  useLayoutEffect(() => applyInstances(veinRef.current, data.veinMatrices), [data]);
  useLayoutEffect(() => applyInstances(rootRef.current, data.rootMatrices), [data]);
  useLayoutEffect(() => applyInstances(rootGlowRef.current, data.rootGlowMatrices), [data]);
  useLayoutEffect(() => applyInstances(crystalRef.current, data.crystalMatrices), [data]);

  // A slow, gentle pulse on the glowing veins/crystals — real
  // bioluminescence breathes rather than sitting at one fixed
  // brightness, and it's a cheap way to make dozens of static trees
  // still read as alive without any per-instance animation cost.
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 0.7 + Math.sin(t * 0.9) * 0.25;
    if (veinMatRef.current) veinMatRef.current.opacity = pulse;
    if (crystalMatRef.current) crystalMatRef.current.opacity = 0.6 + Math.sin(t * 1.1 + 1.5) * 0.2;

    // Gentle wind sway on the canopy leaf cards — every previous pass
    // fixed the *shape* of the foliage (subdivision, then leaf-card
    // textures) but left it perfectly rigid, and a tree that never
    // moves at all reads as a static prop no matter how organic its
    // silhouette is. A small rotational wobble around each card's own
    // base orientation, at its own phase/speed (see canopyCards above),
    // is the cheapest version of "the wind is moving the leaves."
    const canopyMesh = canopyRef.current;
    if (canopyMesh) {
      data.canopyCards.forEach((card, i) => {
        const sway = Math.sin(t * card.speed + card.phase) * card.amplitude;
        swayDummy.position.set(card.x, card.y, card.z);
        swayDummy.scale.set(card.scale, card.scale, 1);
        swayDummy.rotation.set(card.rotX + sway, card.rotY, card.rotZ + sway * 0.6);
        swayDummy.updateMatrix();
        canopyMesh.setMatrixAt(i, swayDummy.matrix);
      });
      canopyMesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Textured bark rather than a flat solid brown — see
          barkTexture.ts for why a solid color reads as painted plastic
          rather than wood. */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.6, 0.85, 1, 6]} />
        <meshLambertMaterial map={barkTexture} color="#5a4a34" fog />
      </instancedMesh>

      {/* Glowing veins wound around the trunk. */}
      <instancedMesh ref={veinRef} args={[undefined, undefined, veinCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          ref={veinMatRef}
          color={GLOW_BLUE}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Glowing roots splaying from the trunk's base. */}
      <instancedMesh ref={rootRef} args={[undefined, undefined, rootCount]}>
        <cylinderGeometry args={[0.5, 1, 1, 5]} />
        <meshPhongMaterial color="#241a10" emissive={GLOW_BLUE} emissiveIntensity={0.35} specular="#3a4048" shininess={20} fog />
      </instancedMesh>
      <instancedMesh ref={rootGlowRef} args={[undefined, undefined, rootCount]}>
        <circleGeometry args={[1, 10]} />
        <meshBasicMaterial
          color={GLOW_BLUE}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
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
      {/* Flat textured cards, not solid icosahedron lobes — the actual
          fix for "trees look artificial": raising subdivision made the
          lobes smoother but they were still shapes built from polygons,
          which reads as geometric no matter how round. A painted,
          alpha-cutout leaf-cluster silhouette (leafTexture.ts) on a
          plane gives an irregular, non-geometric edge instead.
          alphaTest (not `transparent`) cuts the silhouette out as an
          opaque shape past the threshold, avoiding the sorting
          artifacts dozens of overlapping blended cards would cause. */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, lobeCount]}>
        <planeGeometry args={[1, 1]} />
        <meshLambertMaterial map={leafTexture} alphaTest={0.45} side={THREE.DoubleSide} fog />
      </instancedMesh>

      {/* Glowing crystal-leaf accents nested in the canopy. */}
      <instancedMesh ref={crystalRef} args={[undefined, undefined, crystalCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          ref={crystalMatRef}
          color={GLOW_BLUE}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
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
