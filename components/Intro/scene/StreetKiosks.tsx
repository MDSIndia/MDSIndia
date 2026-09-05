"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { AD_IMAGES } from "./adImages";
import { keepClearOfCrossStreets } from "./crossStreetPositions";
import { keepClearOfLandmarks } from "./landmarkClearance";

useTexture.preload(AD_IMAGES);

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

interface KioskPlacement {
  position: [number, number, number];
  yaw: number;
  textureIndex: number;
  phase: number;
}

// Set back slightly further than StreetLights (x=8.6) toward the
// building line, the way a real sidewalk kiosk sits closer to the
// storefronts than the curb — distinct footing from the light poles so
// the two don't visually stack on top of each other.
const KIOSK_X = 10.4;
const COUNT = 20;
const SCREEN_WIDTH = 0.62;
const SCREEN_HEIGHT = 1.05;

function buildPlacements(isMobile: boolean): KioskPlacement[] {
  const count = isMobile ? 12 : COUNT;
  const placements: KioskPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const rawZ = 36 - (i / count) * 190;
    const z = keepClearOfLandmarks(keepClearOfCrossStreets(rawZ), side);
    placements.push({
      position: [side * KIOSK_X, 0, z],
      // Faces the sidewalk/road rather than the building line, so the
      // screen is actually readable from a passing car.
      yaw: side === -1 ? Math.PI / 2 : -Math.PI / 2,
      textureIndex: i % AD_IMAGES.length,
      phase: seeded(i, 821) * Math.PI * 2,
    });
  }
  return placements;
}

function Kiosk({ placement, texture }: { placement: KioskPlacement; texture: THREE.Texture }) {
  const scanRef = useRef<THREE.Mesh>(null);
  const scanMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!scanRef.current || !scanMatRef.current) return;
    const t = clock.getElapsedTime();
    const cycle = ((t * 0.25 + placement.phase) % (Math.PI * 2)) / (Math.PI * 2);
    scanRef.current.position.y = SCREEN_HEIGHT * 0.55 + (0.5 - cycle) * SCREEN_HEIGHT * 0.9;
    scanMatRef.current.opacity = 0.14;
  });

  return (
    <group position={placement.position} rotation={[0, placement.yaw, 0]}>
      {/* Base plinth. */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.12, 10]} />
        <meshPhongMaterial color="#1c222c" specular="#8fc4e8" shininess={45} fog />
      </mesh>
      {/* Slim support post. */}
      <mesh position={[0, SCREEN_HEIGHT * 0.55 + 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.06, SCREEN_HEIGHT * 1.1 + 0.12, 8]} />
        <meshPhongMaterial color="#20262f" specular="#8fc4e8" shininess={50} fog />
      </mesh>
      {/* Screen housing. */}
      <mesh position={[0, SCREEN_HEIGHT * 0.55 + 0.24 + SCREEN_HEIGHT / 2, 0.02]} scale={[SCREEN_WIDTH * 1.1, SCREEN_HEIGHT * 1.06, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#0a0c12" fog={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Ad screen. */}
      <mesh position={[0, SCREEN_HEIGHT * 0.55 + 0.24 + SCREEN_HEIGHT / 2, 0.04]} scale={[SCREEN_WIDTH, SCREEN_HEIGHT, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} toneMapped={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Sweeping scan-line, same digital-display cue Billboards/
          BuildingBanners use, so this reads as the same family of
          smart signage rather than a different kind of screen. */}
      <mesh ref={scanRef} position={[0, 0, 0.045]} scale={[SCREEN_WIDTH * 0.96, SCREEN_HEIGHT * 0.04, 1]}>
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
      {/* Soft ground glow pooling at the kiosk's foot. */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 12]} />
        <meshBasicMaterial color="#6fc6ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Freestanding interactive kiosk stands along the sidewalk — small,
 * human-scale digital signage distinct from the wall-mounted holo-ads
 * and building banners, the "smart street furniture" a real dense
 * future city has at ground level rather than only large-format ads
 * on the buildings themselves. Reuses the same ad-image texture pool
 * every other display in this scene draws from, so kiosk content still
 * reads as the same in-world advertising rather than a new asset
 * category. */
export function StreetKiosks({ isMobile }: { isMobile: boolean }) {
  const placements = useMemo(() => buildPlacements(isMobile), [isMobile]);
  const imagePaths = useMemo(
    () => placements.map((p) => AD_IMAGES[p.textureIndex]),
    [placements]
  );
  const textures = useTexture(imagePaths) as THREE.Texture[];

  return (
    <group>
      {placements.map((p, i) => (
        <Kiosk key={i} placement={p} texture={textures[i]} />
      ))}
    </group>
  );
}
