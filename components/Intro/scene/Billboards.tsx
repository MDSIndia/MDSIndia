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

// Restrained, desaturated palette at explicit request — cool white and
// pale silver-blue as the dominant tones, with only a whisper of cyan
// or violet rather than a saturated neon hue. This is what actually
// reads as "premium display" instead of "arcade sign": real luxury
// tech products light up in near-white with a faint color temperature,
// not a fully saturated primary.
const ACCENT_COLORS = ["#eef2f6", "#d6e2ea", "#d8d2e8", "#dce8e6"];

type Tier = "street" | "sky";

interface AdPlacement {
  position: [number, number, number];
  width: number;
  height: number;
  textureIndex: number;
  accent: string;
  phase: number;
  baseY: number;
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

    // Both tiers are kept inside the same road-shoulder corridor
    // ParkingLot/HoloAds use (road plane ends at x=8, building line
    // starts at x=11 — see Ground.tsx/CityScape's own x >= 11
    // invariant) so panels never spawn embedded in tower geometry.
    if (tier === "street") {
      const x = side * (8.4 + seeded(i, 12) * 1.8);
      const y = 3 + seeded(i, 13) * 5;
      position = [x, y, z];
      width = 1.7 + seeded(i, 14) * 1.1;
      height = width * (0.55 + seeded(i, 15) * 0.3);
    } else {
      const x = side * (8.8 + seeded(i, 16) * 2.0);
      const y = 14 + seeded(i, 17) * 26;
      position = [x, y, z];
      width = 2.6 + seeded(i, 18) * 2.0;
      height = width * (0.9 + seeded(i, 19) * 0.7);
    }

    placements.push({
      position,
      width,
      height,
      textureIndex: i % imageCount,
      accent: ACCENT_COLORS[i % ACCENT_COLORS.length],
      phase: seeded(i, 20) * Math.PI * 2,
      baseY: 0,
    });
  }
  return placements;
}

/** A single next-generation advertising display — a frameless glass
 * panel rather than a bezeled screen: an ultra-thin metallic edge trim
 * (not a glowing plasma bar), a translucent "transparent OLED" image
 * layer, a slow diagonal glass-reflection sweep standing in for a real
 * specular highlight, a second offset panel floating slightly in front
 * for parallax depth, and a handful of fine drifting particles — no
 * scan-line flicker or HUD brackets (both read as gaming/cyberpunk
 * rather than luxury tech). A slim metal strut anchors it to the
 * ground so it reads as mounted hardware rather than an image floating
 * disconnected in mid-air. Billboarded toward the camera (yaw only)
 * every frame. */
function AdPanel({
  placement,
  texture,
}: {
  placement: AdPlacement;
  texture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const sweepRef = useRef<THREE.Mesh>(null);
  const sweepMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const depthLayerRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleGeometry = useMemo(() => {
    const n = 10;
    const positions = new Float32Array(n * 3);
    for (let p = 0; p < n; p++) {
      positions[p * 3] = (seeded(p, placement.phase) - 0.5) * placement.width * 1.4;
      positions[p * 3 + 1] = (seeded(p, placement.phase + 1) - 0.5) * placement.height * 1.4;
      positions[p * 3 + 2] = 0.05 + seeded(p, placement.phase + 2) * 0.15;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [placement.width, placement.height, placement.phase]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    const group = groupRef.current;
    if (group) {
      const dx = state.camera.position.x - placement.position[0];
      const dz = state.camera.position.z - placement.position[2];
      group.rotation.y = Math.atan2(dx, dz);
    }

    // A slow, restrained breathing glow — subtle atmospheric spill
    // rather than a pulsing neon sign.
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.09 + Math.sin(t * 0.4 + placement.phase) * 0.02;
    }

    // A slow diagonal highlight sweep standing in for a real glass
    // specular reflection catching ambient light as it "moves" across
    // the surface — far slower and dimmer than the old scan-line, so
    // it reads as a glass sheen rather than a refreshing display.
    if (sweepRef.current && sweepMatRef.current) {
      const cycle = ((t * 0.09 + placement.phase) % (Math.PI * 2)) / (Math.PI * 2);
      sweepRef.current.position.x = (cycle - 0.5) * placement.width * 1.6;
      sweepMatRef.current.opacity = 0.1;
    }

    // The floating depth layer drifts a hair independently — a slow
    // parallax-like sway that sells it as a separate holographic layer
    // hovering just in front of the main panel, not a stuck decal.
    if (depthLayerRef.current) {
      depthLayerRef.current.position.z = 0.14 + Math.sin(t * 0.3 + placement.phase) * 0.02;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.z = t * 0.02;
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.35 + Math.sin(t * 0.6 + placement.phase) * 0.15;
    }
  });

  const halfW = placement.width / 2;
  const halfH = placement.height / 2;

  return (
    <group ref={groupRef} position={placement.position}>
      {/* Slim metal support strut — brushed-steel Phong rather than
          flat dark plastic, so it reads as premium hardware. */}
      <mesh position={[0, -(placement.position[1] - placement.baseY) / 2, -0.06]}>
        <cylinderGeometry args={[0.03, 0.045, placement.position[1] - placement.baseY, 8]} />
        <meshPhongMaterial color="#2a2d33" specular="#9aa4b0" shininess={90} fog />
      </mesh>
      <mesh position={[0, -(placement.position[1] - placement.baseY) + 0.01, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#c9d6e0" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Soft atmospheric glow spill behind the panel — dim and
          desaturated, a whisper of light bleeding into the fog rather
          than a bright bloom. */}
      <mesh
        ref={glowRef}
        scale={[placement.width * 1.22, placement.height * 1.22, 1]}
        position={[0, 0, -0.03]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={placement.accent}
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dark graphite backing pane — a real (if very thin) physical
          surface behind the image rather than nothing, so the display
          reads as a solid piece of glass hardware, not a projected
          picture. */}
      <mesh scale={[placement.width * 1.015, placement.height * 1.02, 1]} position={[0, 0, -0.008]}>
        <planeGeometry args={[1, 1]} />
        <meshPhongMaterial color="#0c0d10" specular="#3a4048" shininess={70} fog={false} side={THREE.DoubleSide} />
      </mesh>

      {/* The image — a translucent "transparent OLED" layer rather
          than an opaque poster, so ambient light and the backing pane
          both still read through it. */}
      <mesh scale={[placement.width, placement.height, 1]} position={[0, 0, 0.006]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.92}
          toneMapped={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Diagonal glass-reflection sweep. */}
      <mesh
        ref={sweepRef}
        scale={[placement.width * 0.22, placement.height * 1.4, 1]}
        rotation={[0, 0, 0.35]}
        position={[0, 0, 0.014]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={sweepMatRef}
          color="#ffffff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ultra-thin metallic edge trim — a slim, unlit silver line
          rather than a glowing plasma frame, the "premium bezel-less
          hardware edge" cue instead of a HUD/neon border. */}
      {[
        [0, halfH, placement.width * 1.015, placement.height * 0.006],
        [0, -halfH, placement.width * 1.015, placement.height * 0.006],
        [halfW, 0, placement.height * 0.006, placement.height * 1.02],
        [-halfW, 0, placement.height * 0.006, placement.height * 1.02],
      ].map(([px, py, w, h], idx) => (
        <mesh key={idx} position={[px, py, 0.012]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#c4ccd6" transparent opacity={0.55} fog={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* A single slim accent fin extending past one corner — a
          restrained "3D element breaking the frame" cue, not four
          repeated HUD brackets. */}
      <mesh position={[halfW + placement.width * 0.06, halfH + placement.height * 0.06, 0.01]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[placement.width * 0.16, placement.height * 0.012]} />
        <meshBasicMaterial color={placement.accent} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating holographic depth layer — a faint, slightly larger
          duplicate hovering just in front of the main panel, the
          "elegant holographic layer" parallax cue. */}
      <mesh ref={depthLayerRef} scale={[placement.width * 1.06, placement.height * 1.08, 1]} position={[0, 0, 0.14]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Fine drifting particles — sparse, dim points rather than a
          dense sparkle cloud. */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          color={placement.accent}
          size={0.025}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/** Next-generation advertising displays flanking the highway — sleek,
 * frameless, glass-surfaced panels rather than ordinary bezeled
 * screens, showing brand imagery reused from the previous intro.
 * Isolated in its own Suspense boundary upstream (see IntroCinematic)
 * so slow texture loads never block the rest of the cinematic. */
export function Billboards({ isMobile }: { isMobile: boolean }) {
  // Each panel is a non-instanced mesh with its own unique texture —
  // that per-panel cost (draw calls + decoded image memory) doesn't
  // shrink on its own just because the rest of the scene's instance
  // counts do, so mobile gets a noticeably lower count rather than a
  // proportional one.
  const count = isMobile ? 5 : 14;
  const imagePaths = useMemo(() => AD_IMAGES.slice(0, count), [count]);
  const textures = useTexture(imagePaths) as THREE.Texture[];
  const placements = useMemo(
    () => buildPlacements(count, imagePaths.length),
    [count, imagePaths.length]
  );

  return (
    <group>
      {placements.map((p, i) => (
        <AdPanel key={i} placement={p} texture={textures[p.textureIndex]} />
      ))}
    </group>
  );
}
