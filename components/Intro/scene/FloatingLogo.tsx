"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { BRAND_LOGO } from "./adImages";
import { windowProgress } from "./timeline";

useTexture.preload(BRAND_LOGO);

/** A single large holographic projection of the MDS mark, drifting
 * above the skyline for a few seconds mid-flight — a brand moment
 * rather than a billboard, so it appears once and fades rather than
 * repeating like the ad panels. */
export function FloatingLogo() {
  const texture = useTexture(BRAND_LOGO) as THREE.Texture;
  const groupRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const logoMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    const appear =
      windowProgress(t, 2.5, 3.2) * (1 - windowProgress(t, 4.5, 5.3));
    group.visible = appear > 0.01;
    group.position.set(-9.5, 17 + Math.sin(t * 0.5) * 0.6, -22);
    group.rotation.y = Math.sin(t * 0.3) * 0.16;

    if (glowMatRef.current) glowMatRef.current.opacity = appear * 0.22;
    if (logoMatRef.current)
      logoMatRef.current.opacity = appear * (0.8 + Math.sin(t * 7) * 0.08);
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh scale={[7, 7, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color="#00d4ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh scale={[5, 5, 1]} position={[0, 0, 0.02]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={logoMatRef}
          map={texture}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
