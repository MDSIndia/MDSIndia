"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { windowProgress } from "./timeline";
import { createFlightCurve, flightU } from "./path";
import { getRadialGlowTexture } from "./glowTexture";

/** Stylized rider silhouette — a glowing figure hovering just above the
 * road on plasma-trailed shoes, tracking slightly ahead of the camera
 * along the same flight curve. Abstracted rather than photorealistic:
 * the energy trail and spark burst carry the "flying shoes" read.
 *
 * Deliberately never touches the road (a clear hover gap plus a bob),
 * leans forward with speed, and picks up a subtle side-to-side roll —
 * an aerodynamic, gliding read rather than a stiff, upright statue. */
export function RiderTrail() {
  const groupRef = useRef<THREE.Group>(null);
  const rimGlowRef = useRef<THREE.Mesh>(null);
  const sparkGroupRef = useRef<THREE.Group>(null);
  const heatRef = useRef<THREE.Sprite>(null);
  const curve = useMemo(() => createFlightCurve(), []);
  const heatTexture = useMemo(() => getRadialGlowTexture(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const appear = windowProgress(t, 2.6, 3.4);
    const group = groupRef.current;
    if (!group) return;

    const u = Math.min(1, flightU(t) + 0.065);
    const p = curve.getPointAt(u);
    // Two overlapping sine waves rather than one — a real hover never
    // repeats on a single clean period, so this reads as floating
    // instead of a metronome bob. Always well clear of the road.
    const hover =
      0.68 + Math.sin(t * 6.5) * 0.06 + Math.sin(t * 4.15 + 1.3) * 0.035;
    // Tiny lateral weave, same idea — a body drifting slightly rather
    // than being pinned to a rail.
    const weave = Math.sin(t * 1.9 + 0.4) * 0.03 + Math.sin(t * 13.2) * 0.008;

    group.position.set(p.x + weave, hover, p.z);

    // Forward lean and a light balancing roll that both grow with
    // speed — an aerodynamic glide rather than a stiff upright pose.
    // Each is a sum of two frequencies so the motion doesn't read as
    // a single scripted oscillation.
    const speedFactor =
      windowProgress(t, 2.6, 6.6) * 0.6 + windowProgress(t, 6.3, 8.0) * 0.4;
    group.rotation.x =
      -0.1 - speedFactor * 0.22 + Math.sin(t * 3.7 + 0.9) * 0.015;
    group.rotation.z =
      Math.sin(t * 2.1) * 0.035 * (0.4 + speedFactor) +
      Math.sin(t * 5.3 + 2.1) * 0.012;
    group.rotation.y =
      Math.PI + Math.sin(t * 1.7 + 0.2) * 0.045 + Math.sin(t * 3.9) * 0.018;

    group.visible = appear > 0.01;
    group.scale.setScalar(0.7 + appear * 0.3);

    // Shoes emit maximum power on the final run into the star.
    const finalPush = windowProgress(t, 6.3, 8.0);
    const rimMat = rimGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (rimMat) rimMat.opacity = 0.2 + finalPush * 0.55;
    if (sparkGroupRef.current)
      sparkGroupRef.current.scale.setScalar(1 + finalPush * 0.85);

    // A soft additive shimmer trailing beneath the shoes — a cheap
    // stand-in for heat-distortion, since real refraction needs a
    // post-process pass this scene doesn't use.
    if (heatRef.current) {
      const mat = heatRef.current.material as THREE.SpriteMaterial;
      mat.opacity = (0.12 + finalPush * 0.22) * (0.8 + Math.sin(t * 10) * 0.2);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#0a1a2e" fog={false} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.11, 0.34, 4, 8]} />
        <meshBasicMaterial color="#0a1a2e" fog={false} />
      </mesh>
      <mesh ref={rimGlowRef} position={[0, 0.32, 0]} scale={1.15}>
        <capsuleGeometry args={[0.11, 0.34, 4, 8]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <Trail width={2.4} length={9} color="#00d4ff" attenuation={(w) => w * w}>
        <mesh position={[-0.09, 0.02, 0.02]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshBasicMaterial color="#00e5ff" fog={false} />
        </mesh>
      </Trail>
      <Trail width={2.4} length={9} color="#00d4ff" attenuation={(w) => w * w}>
        <mesh position={[0.09, 0.02, -0.02]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshBasicMaterial color="#00e5ff" fog={false} />
        </mesh>
      </Trail>

      <sprite ref={heatRef} position={[0, 0.06, 0.35]} scale={[0.32, 0.7, 1]}>
        <spriteMaterial
          map={heatTexture}
          color="#7fd8ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      <group ref={sparkGroupRef}>
        <Sparkles
          count={44}
          scale={[0.55, 0.3, 0.6]}
          size={2.6}
          speed={1.3}
          color="#5fe8ff"
          position={[0, 0.04, 0.1]}
        />
      </group>
    </group>
  );
}
