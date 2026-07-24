"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { AD_IMAGES } from "./adImages";

// Kick off loading as early as the module is imported (page load, well
// before the user clicks "start") so the panels are warm by the time
// the cinematic canvas mounts.
useTexture.preload(AD_IMAGES);

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const GLOW_COLORS = ["#00d4ff", "#7B2FBE", "#0055FF", "#ff2ecb"];

type Tier = "street" | "sky";

interface AdPlacement {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  textureIndex: number;
  glowColor: string;
  phase: number;
}

function buildPlacements(count: number, imageCount: number): AdPlacement[] {
  const placements: AdPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const tier: Tier = i % 3 === 0 ? "street" : "sky";
    const z = 40 - seeded(i, 11) * 130;

    let position: [number, number, number];
    let width: number;
    let height: number;
    let rotFactor: number;

    if (tier === "street") {
      // Close to the road, roughly billboard-height — the ones that
      // flash past quickly as the camera passes them.
      const x = side * (9 + seeded(i, 12) * 4);
      const y = 3 + seeded(i, 13) * 5;
      position = [x, y, z];
      width = 3.2 + seeded(i, 14) * 1.6;
      height = width * (0.55 + seeded(i, 15) * 0.3);
      rotFactor = 0.56;
    } else {
      // Mounted high on the towers (which now sit at x ~11-31), read
      // from further away as part of the skyline.
      const x = side * (12 + seeded(i, 16) * 16);
      const y = 14 + seeded(i, 17) * 26;
      position = [x, y, z];
      width = 5 + seeded(i, 18) * 4;
      height = width * (0.9 + seeded(i, 19) * 0.7);
      rotFactor = 0.4;
    }

    placements.push({
      position,
      rotationY: -side * Math.PI * rotFactor,
      width,
      height,
      textureIndex: i % imageCount,
      glowColor: GLOW_COLORS[i % GLOW_COLORS.length],
      phase: seeded(i, 20) * Math.PI * 2,
    });
  }
  return placements;
}

/** A single premium digital ad panel: dark bezel, additive glow bloom,
 * the brand image, and a slow animated scan-line sweep. Double-sided so
 * it reads correctly regardless of which way the camera approaches. */
function AdPanel({
  placement,
  texture,
  isMobile,
}: {
  placement: AdPlacement;
  texture: THREE.Texture;
  isMobile: boolean;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const sweepRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + placement.phase;

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 + Math.sin(t * 1.4) * 0.07;
    }

    // The scan-line sweep is a nice-to-have polish detail, not worth
    // an extra overdraw pass + per-frame update on every panel on
    // mobile, where it's not even rendered (see below).
    if (!isMobile && sweepRef.current) {
      const cycle = (t * 0.22) % 1.6;
      const mat = sweepRef.current.material as THREE.MeshBasicMaterial;
      if (cycle < 1) {
        sweepRef.current.position.y = (cycle - 0.5) * placement.height;
        mat.opacity = 0.28;
      } else {
        mat.opacity = 0;
      }
    }
  });

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      <mesh scale={[placement.width * 1.08, placement.height * 1.1, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#050810" fog={false} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        ref={glowRef}
        scale={[placement.width * 1.3, placement.height * 1.3, 1]}
        position={[0, 0, -0.02]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={placement.glowColor}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh scale={[placement.width, placement.height, 1]} position={[0, 0, 0.01]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} toneMapped={false} fog={false} side={THREE.DoubleSide} />
      </mesh>

      {!isMobile && (
        <mesh
          ref={sweepRef}
          scale={[placement.width * 0.98, placement.height * 0.06, 1]}
          position={[0, 0, 0.02]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#bfffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/** Digital billboards flanking the highway, showing brand imagery
 * reused from the previous intro. Isolated in its own Suspense boundary
 * upstream (see IntroCinematic) so slow texture loads never block the
 * rest of the cinematic. */
export function Billboards({ isMobile }: { isMobile: boolean }) {
  // Each panel is a non-instanced mesh with its own unique texture —
  // that per-panel cost (draw calls + decoded image memory) doesn't
  // shrink on its own just because the rest of the scene's instance
  // counts do, so mobile gets a noticeably lower count rather than a
  // proportional one.
  const count = isMobile ? 6 : 22;
  const imagePaths = useMemo(() => AD_IMAGES.slice(0, count), [count]);
  const textures = useTexture(imagePaths) as THREE.Texture[];
  const placements = useMemo(
    () => buildPlacements(count, imagePaths.length),
    [count, imagePaths.length]
  );

  return (
    <group>
      {placements.map((p, i) => (
        <AdPanel key={i} placement={p} texture={textures[p.textureIndex]} isMobile={isMobile} />
      ))}
    </group>
  );
}
