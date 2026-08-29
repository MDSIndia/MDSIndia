"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { clamp01 } from "./timeline";
import { AD_IMAGES } from "./adImages";
import { keepClearOfCrossStreets } from "./crossStreetPositions";
import { keepClearOfLandmarks } from "./landmarkClearance";

// Loaded eagerly alongside Billboards' own preload — same asset set,
// so there's nothing extra to warm up here.
useTexture.preload(AD_IMAGES);

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

interface BannerPlacement {
  position: [number, number, number];
  width: number;
  height: number;
  textureIndex: number;
  phase: number;
}

/** Recomputes the same box-tower placements CityScape generates (same
 * seeded salts, same formulas) purely to find where a real building
 * facade sits — kept as its own pass rather than sharing state with
 * CityScape so this stays in its own Suspense boundary (see
 * IntroCinematic): a slow banner-image load must never block the
 * critical instanced skyline from rendering. Duplicating a few lines
 * of deterministic math is a much smaller risk than coupling the two. */
function buildPlacements(count: number, isMobile: boolean): BannerPlacement[] {
  const placements: BannerPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    // Nudged clear of cross streets and fixed landmark set-pieces
    // exactly like CityScape does to the same raw value — has to match
    // precisely, since this whole function exists purely to recompute
    // where CityScape's own buildings actually ended up.
    const z = keepClearOfLandmarks(keepClearOfCrossStreets(55 - seeded(i, 2) * 165), side);
    const startBias = clamp01((z - 15) / 40);
    // Matches CityScape's own (now tightened) spread exactly — this
    // previously used a slightly different formula than CityScape's
    // actual placement math, which is exactly the kind of drift that
    // leaves a banner not quite flush against its host building's
    // real facade.
    const x = side * (11 + seeded(i, 1) * (11 - startBias * 6));
    const height = 4 + seeded(i, 3) * 50;
    const heightFactor = clamp01((height - 4) / 50);
    // Must match CityScape's own (now slimmer) width formula exactly —
    // any drift here means a banner sized for a wider tower than the
    // one actually rendered, which is what was reading as a banner
    // floating past the edge of its own building's facade.
    const width = (1.5 + seeded(i, 4) * 4.6) * (1.15 - heightFactor * 0.58);
    // Must match CityScape's own archetype roll exactly (same salt,
    // same thresholds) — this function's whole job is figuring out
    // which of CityScape's buildings actually got a flat box facade to
    // hang a banner on. Now includes the pyramid archetype CityScape
    // added alongside round/faceted/twisted — missing it here meant
    // banners could get hung on a pyramid's own pointed, windowless
    // facade, which has nowhere for a flat rectangular banner to sit
    // flush.
    const archetypeRoll = seeded(i, 55);
    const isRound = archetypeRoll > 0.72;
    const isFaceted = !isRound && archetypeRoll > 0.53;
    const isPyramid = !isRound && !isFaceted && archetypeRoll > 0.4;
    const isTwisted =
      !isRound && !isFaceted && !isPyramid && archetypeRoll > 0.2 && startBias < 0.5;

    // Only tall plain-box towers get a banner — round/faceted/twisted
    // towers have no flat facade to hang one on, and short mid-rises
    // aren't tall enough for a vertical banner to read as anything but
    // oversized. ~13% of the eligible buildings get one on desktop —
    // an 18% pass (tried briefly) combined with Billboards' own denser
    // pass read as a wall of screens rather than occasional building-
    // wrap advertising, so this landed closer to the original ~10%.
    // Each banner is its own non-instanced mesh with its own unique
    // full-size image texture — unlike everything else in this scene,
    // that cost doesn't shrink just because the instance count did, so
    // mobile gets a much higher bar (~5%) specifically to keep the
    // number of separate textures/draw calls down.
    const threshold = isMobile ? 0.95 : 0.87;
    const isCandidate =
      !isRound && !isFaceted && !isPyramid && !isTwisted && height > 20 && seeded(i, 70) > threshold;
    if (!isCandidate) continue;

    const bannerWidth = width * 0.62;
    const bannerHeight = Math.min(height * 0.55, bannerWidth * (2.4 + seeded(i, 72) * 1.2));
    const centerY = 1.5 + bannerHeight / 2 + seeded(i, 71) * (height * 0.35);

    placements.push({
      // Flush against the road-facing facade, matching the same
      // unrotated placement convention CityScape's own window-strip
      // accents use (see windowA/B) rather than tracking each
      // building's own small random yaw. Orientation itself isn't
      // fixed here anymore — see the per-frame billboarding in Banner
      // below, which keeps the printed face pointed at the camera
      // throughout the flight rather than a static rotation that's
      // only ever face-on for the instant the camera is directly
      // alongside it.
      position: [x - side * (width / 2 + 0.03), centerY, z],
      width: bannerWidth,
      height: bannerHeight,
      textureIndex: i % AD_IMAGES.length,
      phase: seeded(i, 73) * Math.PI * 2,
    });
  }
  return placements;
}

function Banner({
  placement,
  texture,
}: {
  placement: BannerPlacement;
  texture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const scanMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Billboarded toward the camera every frame (yaw only — it's mounted
  // on a vertical wall, so it shouldn't pitch) rather than a fixed
  // rotation baked in at placement time. A static rotation is only
  // ever face-on for the instant the camera is directly alongside it;
  // for most of the flight the camera is approaching from further down
  // the road, where a wall-perpendicular banner is seen at an
  // increasingly glancing, unreadable angle. Billboarding keeps the
  // printed face pointed at the camera throughout.
  useFrame(({ camera, clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const dx = camera.position.x - placement.position[0];
    const dz = camera.position.z - placement.position[2];
    group.rotation.y = Math.atan2(dx, dz);

    // Same sweeping scan-line cue Billboards uses (slowed and dimmed
    // to match — a calm, steady display reads as premium, a fast
    // flickery one reads as cheap), own phase offset so a run of
    // banners up one facade doesn't scan in lockstep.
    if (scanRef.current && scanMatRef.current) {
      const t = clock.getElapsedTime();
      const cycle = ((t * 0.2 + placement.phase) % (Math.PI * 2)) / (Math.PI * 2);
      scanRef.current.position.y = (0.5 - cycle) * placement.height;
      scanMatRef.current.opacity = 0.12;
    }
  });

  return (
    <group ref={groupRef} position={placement.position}>
      {/* Dark backing bezel, slightly larger than the image — reads as
          a mounted banner/vinyl wrap rather than an image floating
          flush against the wall. */}
      <mesh scale={[placement.width * 1.08, placement.height * 1.04, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#0a0b10" fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[placement.width, placement.height, 1]} position={[0, 0, 0.01]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} toneMapped={false} fog={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Sweeping scan-line, same digital-display cue Billboards uses. */}
      <mesh ref={scanRef} scale={[placement.width * 0.98, placement.height * 0.05, 1]} position={[0, 0, 0.02]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={scanMatRef}
          color="#eaf6ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function BuildingBanners({ isMobile }: { isMobile: boolean }) {
  // Must match CityScape's own building count exactly — this function
  // only exists to recompute where CityScape's real buildings ended up,
  // and iterating past its actual count means placing banners on
  // buildings CityScape never generates at all (a stale value here,
  // left over from before CityScape's density was cut, was producing
  // banners floating with no host building anywhere near them).
  const count = isMobile ? 38 : 68;
  const placements = useMemo(
    () => buildPlacements(count, isMobile),
    [count, isMobile]
  );
  const imagePaths = useMemo(
    () => placements.map((p) => AD_IMAGES[p.textureIndex]),
    [placements]
  );
  const textures = useTexture(imagePaths) as THREE.Texture[];

  return (
    <group>
      {placements.map((p, i) => (
        <Banner key={i} placement={p} texture={textures[i]} />
      ))}
    </group>
  );
}
