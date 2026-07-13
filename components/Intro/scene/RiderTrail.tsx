"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { windowProgress } from "./timeline";
import { createFlightCurve, flightU } from "./path";

/** Stylized rider silhouette — a glowing figure hovering just above the
 * road on plasma-trailed shoes, tracking slightly ahead of the camera
 * along the same flight curve. Abstracted rather than photorealistic:
 * the energy trail and spark burst carry the "flying shoes" read. */
export function RiderTrail() {
  const groupRef = useRef<THREE.Group>(null);
  const rimGlowRef = useRef<THREE.Mesh>(null);
  const sparkGroupRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => createFlightCurve(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const appear = windowProgress(t, 1.9, 2.6);
    const group = groupRef.current;
    if (!group) return;

    const u = Math.min(1, flightU(t) + 0.065);
    const p = curve.getPointAt(u);
    const hover = 0.55 + Math.sin(t * 6.5) * 0.08;

    group.position.set(p.x, hover, p.z);
    group.rotation.y = Math.PI;
    group.visible = appear > 0.01;
    group.scale.setScalar(0.7 + appear * 0.3);

    // Shoes emit maximum power on the final run into the portal.
    const finalPush = windowProgress(t, 4.4, 6.0);
    const rimMat = rimGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (rimMat) rimMat.opacity = 0.16 + finalPush * 0.34;
    if (sparkGroupRef.current) sparkGroupRef.current.scale.setScalar(1 + finalPush * 0.6);
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
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <Trail width={1.6} length={6} color="#00d4ff" attenuation={(w) => w * w}>
        <mesh position={[-0.09, 0.02, 0.02]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshBasicMaterial color="#00e5ff" fog={false} />
        </mesh>
      </Trail>
      <Trail width={1.6} length={6} color="#00d4ff" attenuation={(w) => w * w}>
        <mesh position={[0.09, 0.02, -0.02]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshBasicMaterial color="#00e5ff" fog={false} />
        </mesh>
      </Trail>

      <group ref={sparkGroupRef}>
        <Sparkles
          count={36}
          scale={[0.5, 0.28, 0.5]}
          size={2.4}
          speed={1.1}
          color="#5fe8ff"
          position={[0, 0.04, 0]}
        />
      </group>
    </group>
  );
}
