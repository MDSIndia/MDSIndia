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

const GLOW_COLORS = ["#f4f2e8", "#ffcf8a", "#dce6f2", "#ffdca8"];

type Tier = "street" | "sky";

interface AdPlacement {
  position: [number, number, number];
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

    // Both tiers are kept inside the same road-shoulder corridor
    // ParkingLot/HoloAds use (road plane ends at x=8, building line
    // starts at x=11 — see Ground.tsx/CityScape's own x >= 11
    // invariant): these used to reach out to x=13 (street) and x=28
    // (sky), landing squarely inside the actual building footprints —
    // since this placement is entirely independent of where CityScape
    // put its buildings, that meant panels routinely spawned
    // clipped/embedded into tower geometry instead of standing clear
    // of it. Freestanding pylon signage rising up in front of the
    // skyline (rather than pretending to be mounted on a specific
    // tower face) also reads as more plausible signage anyway.
    //
    // Sizes are scaled down from an earlier pass: pulling both tiers
    // in from x~20-28 to this much closer shoulder corridor roughly
    // doubled how large the same physical width reads on screen (twice
    // as close = twice the apparent size), so the old width values —
    // tuned for the old, further-out distance — were now looming over
    // the frame like a wall of jumbotrons instead of roadside signage.
    if (tier === "street") {
      // Close to the road, roughly billboard-height — the ones that
      // flash past quickly as the camera passes them.
      const x = side * (8.4 + seeded(i, 12) * 1.8);
      const y = 3 + seeded(i, 13) * 5;
      position = [x, y, z];
      width = 1.7 + seeded(i, 14) * 1.1;
      height = width * (0.55 + seeded(i, 15) * 0.3);
    } else {
      // A taller freestanding jumbotron pylon rather than something
      // wall-mounted — reads from further away as part of the skyline
      // without needing to actually touch a tower's facade.
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
      glowColor: GLOW_COLORS[i % GLOW_COLORS.length],
      phase: seeded(i, 20) * Math.PI * 2,
    });
  }
  return placements;
}

/** A single digital ad panel: dark bezel, soft glow bloom, the brand
 * image, and a sweeping scan-line + occasional signal-glitch flicker on
 * top — the two cues that read as an actively-driven digital display
 * rather than a static printed poster, which is what a flat unmoving
 * image (however bright) still reads as no matter how much glow
 * surrounds it. Double-sided so it reads correctly regardless of which
 * way the camera approaches. */
function AdPanel({
  placement,
  texture,
}: {
  placement: AdPlacement;
  texture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const imageMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const scanMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Billboarded toward the camera every frame (yaw only) rather than
    // a fixed rotation baked in at placement time — matches
    // BuildingBanners' own Banner component, and for the same reason:
    // a static rotation is only ever face-on for the instant the
    // camera is directly alongside it, and for the rest of the flight
    // the panel is seen at an increasingly glancing angle where its
    // actual image content foreshortens down to a near-invisible
    // sliver — all that's left visible at that angle is the larger,
    // duller backing bezel/glow planes behind it, which is what read
    // as an unlabeled dark card rather than a readable ad.
    const group = groupRef.current;
    if (group) {
      const dx = state.camera.position.x - placement.position[0];
      const dz = state.camera.position.z - placement.position[2];
      group.rotation.y = Math.atan2(dx, dz);
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.14;
    }

    // A thin, slow bright bar sweeping top-to-bottom on a loop, offset
    // per panel (placement.phase) so a whole row of billboards doesn't
    // scan in visible lockstep — reads as a large calibrated display
    // gently animating, not a glitch. A signal-dropout flicker used to
    // sit here too (a brief opacity dip every few seconds); pulled it
    // for a steadier, more premium display rather than a "broken sign"
    // cyberpunk cue.
    if (scanRef.current && scanMatRef.current) {
      const cycle = ((t * 0.22 + placement.phase) % (Math.PI * 2)) / (Math.PI * 2);
      scanRef.current.position.y = (0.5 - cycle) * placement.height;
      scanMatRef.current.opacity = 0.14;
    }

    if (imageMatRef.current) imageMatRef.current.opacity = 1;
  });

  return (
    <group ref={groupRef} position={placement.position}>
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
        <meshBasicMaterial
          ref={imageMatRef}
          map={texture}
          transparent
          opacity={1}
          toneMapped={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sweeping scan-line — additive so it brightens whatever it
          crosses rather than masking the image underneath. */}
      <mesh ref={scanRef} scale={[placement.width * 0.98, placement.height * 0.06, 1]} position={[0, 0, 0.02]}>
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
  // Pulled back down from an earlier, denser pass — combined with the
  // smaller sizes above, the higher count read as a wall-to-wall grid
  // of screens rather than occasional roadside signage.
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
