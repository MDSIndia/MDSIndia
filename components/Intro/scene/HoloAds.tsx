"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { AD_IMAGES } from "./adImages";
import { keepClearOfCrossStreets } from "./crossStreetPositions";

// Shares Billboards'/BuildingBanners' already-preloaded set — nothing
// extra to warm up here.
useTexture.preload(AD_IMAGES);

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const TINTS = ["#7fe0ff", "#8fd6ff", "#a0f0e8", "#7fc4ff"];

interface HoloPlacement {
  position: [number, number, number];
  side: -1 | 1;
  width: number;
  height: number;
  baseY: number;
  textureIndex: number;
  tint: string;
  phase: number;
  bob: number;
}

function buildPlacements(count: number, imageCount: number): HoloPlacement[] {
  const placements: HoloPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const side = (i % 2 === 0 ? -1 : 1) as -1 | 1;
    const z = keepClearOfCrossStreets(30 - seeded(i, 201) * 150);
    // Same road-shoulder corridor ParkingLot uses (road plane ends at
    // x=8, building line starts at x=11 — see Ground.tsx/CityScape's
    // own x >= 11 invariant) rather than something hung on a facade,
    // so this reads as a distinct freestanding signage type instead of
    // just another wall panel, without actually standing in traffic.
    const x = side * (9.1 + seeded(i, 202) * 1.4);
    const baseY = 0.3 + seeded(i, 203) * 0.4;
    const height = 2.3 + seeded(i, 204) * 1.5;
    const width = height * (0.62 + seeded(i, 205) * 0.3);

    placements.push({
      position: [x, 0, z],
      side,
      width,
      height,
      baseY,
      textureIndex: i % imageCount,
      tint: TINTS[i % TINTS.length],
      phase: seeded(i, 206) * Math.PI * 2,
      bob: 0.25 + seeded(i, 207) * 0.35,
    });
  }
  return placements;
}

/** A single freestanding holographic ad projection: a small glowing
 * emitter pad at street level, a thin vertical light-beam, and a
 * translucent floating panel above it — the "projected light" reading
 * that separates it from Billboards/BuildingBanners' physical
 * screens/posters. Slow rotation and a gentle vertical bob (real
 * projected holograms in this genre are never perfectly still) plus
 * the same scan-line sweep the other signage uses, so all three
 * signage types read as one consistent "digital future city" language. */
function HoloAd({
  placement,
  texture,
}: {
  placement: HoloPlacement;
  texture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const scanMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const emitterMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const panelY = useMemo(
    () => placement.baseY + 2.2 + placement.height / 2,
    [placement.baseY, placement.height]
  );

  useFrame(({ camera, clock }) => {
    const group = groupRef.current;
    const panel = panelRef.current;
    if (!group || !panel) return;

    const t = clock.getElapsedTime();

    // A continuous independent spin used to sit here (no billboarding
    // at all — the idea was that a freely-rotating hologram reads as
    // more "alive" than one that always faces the camera). In practice
    // that meant the panel spent most of the flight facing some
    // direction other than the camera, at which point all that's
    // visible is the glow bloom behind it — a flat, illegible smear of
    // color instead of the actual ad — exactly the "not clear"
    // complaint. Billboarded toward the camera now, same as
    // Billboards/BuildingBanners, with a small sway layered on top of
    // that base angle (not a free spin) so it still reads as a
    // projection gently drifting rather than a rigidly mounted sign,
    // without ever turning fully away from view.
    const dx = camera.position.x - placement.position[0];
    const dz = camera.position.z - placement.position[2];
    const faceAngle = Math.atan2(dx, dz);
    panel.rotation.y = faceAngle + Math.sin(t * 0.4 + placement.phase) * 0.22;
    panel.position.y = panelY + Math.sin(t * 0.5 + placement.phase) * placement.bob * 0.15;

    if (scanRef.current && scanMatRef.current) {
      const cycle = ((t * 0.4 + placement.phase) % (Math.PI * 2)) / (Math.PI * 2);
      scanRef.current.position.y = (0.5 - cycle) * placement.height;
      scanMatRef.current.opacity = 0.28;
    }

    if (emitterMatRef.current) {
      emitterMatRef.current.opacity = 0.5 + Math.sin(t * 1.6 + placement.phase) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={placement.position}>
      {/* Small glowing emitter pad at street level — the "projector"
          the beam and panel above appear to originate from. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial
          ref={emitterMatRef}
          color={placement.tint}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Thin vertical light beam connecting the emitter to the
          floating panel — a soft additive cone rather than a hard-
          edged cylinder, so it reads as projected light/haze. */}
      <mesh position={[0, (placement.baseY + panelY) / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.4, panelY - placement.baseY, 12, 1, true]} />
        <meshBasicMaterial
          color={placement.tint}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={panelRef} position={[0, panelY, 0]}>
        {/* Outer glow bloom, no hard bezel — unlike Billboards/Banner
            there's deliberately no dark backing panel here, since a
            hologram has nothing physical behind the image. */}
        <mesh scale={[placement.width * 1.35, placement.height * 1.35, 1]} position={[0, 0, -0.02]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={placement.tint}
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* The image itself stays near-white (no tint multiply) and
            mostly opaque — the earlier pass tinted this plane with the
            same cyan/blue as the glow bloom behind it, which crushed
            the actual picture into a flat blue smear rather than
            something readable. The color cast now comes entirely from
            the glow layer surrounding it; the image content itself
            reads clearly, same as Billboards/BuildingBanners. */}
        <mesh scale={[placement.width, placement.height, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.92}
            toneMapped={false}
            depthWrite={false}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh
          ref={scanRef}
          scale={[placement.width * 0.98, placement.height * 0.07, 1]}
          position={[0, 0, 0.01]}
        >
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
    </group>
  );
}

/** A handful of freestanding holographic ad projections rising out of
 * the road shoulder/median — distinct from Billboards (wall/pole-
 * mounted LED screens) and BuildingBanners (facade wraps), this is the
 * literal "hologram" signage type: a projector-beam-and-floating-panel
 * silhouette with no physical screen behind it. Kept to a small count
 * (these are the most visually loud signage type in the scene) so they
 * read as occasional showpiece projections rather than the dominant
 * signage. */
export function HoloAds({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 2 : 5;
  const imagePaths = useMemo(() => AD_IMAGES.slice(0, count), [count]);
  const textures = useTexture(imagePaths) as THREE.Texture[];
  const placements = useMemo(
    () => buildPlacements(count, imagePaths.length),
    [count, imagePaths.length]
  );

  return (
    <group>
      {placements.map((p, i) => (
        <HoloAd key={i} placement={p} texture={textures[p.textureIndex]} />
      ))}
    </group>
  );
}
