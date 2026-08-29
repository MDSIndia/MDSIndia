"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RADIUS = 6.5;
const HOVER_Y = 15;
// Left side, further down the route than the Biodome/Waterfall — a
// third, structurally distinct kind of futuristic place: not a tower,
// not a ground-level dome, but a hovering garden platform with nothing
// but a thin support column and its own repulsor glow keeping it up.
const POSITION: [number, number, number] = [-19, 0, -105];

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A floating sky plaza: a garden terrace hovering well above the
 * street on repulsor glow alone, tethered to the ground by a single
 * slender column — the "multi-level city" cue the reference skyline
 * carries (sky bridges, hanging gardens, elevated structures) taken to
 * its most literal form. A third distinct silhouette alongside the MDS
 * sphere, the NOORVA spire, and the ground-level biodome, so the
 * skyline's landmark structures don't all read as "tower with
 * something on top". */
export function SkyPlaza() {
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([]);

  const lanterns = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return {
          x: Math.cos(angle) * RADIUS * 0.7,
          z: Math.sin(angle) * RADIUS * 0.7,
          phase: seeded(i, 611) * Math.PI * 2,
        };
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowMatRef.current) glowMatRef.current.opacity = 0.3 + Math.sin(t * 0.9) * 0.1;
    beaconRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * 1.4 + lanterns[i].phase) * 0.35;
    });
  });

  return (
    <group position={POSITION}>
      {/* Support column tethering the platform to the ground. */}
      <mesh position={[0, HOVER_Y / 2, 0]}>
        <cylinderGeometry args={[0.35, 0.55, HOVER_Y, 10]} />
        <meshPhongMaterial color="#12141c" specular="#4a6a9a" shininess={40} fog />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 16]} />
        <meshBasicMaterial color="#1a2030" transparent opacity={0.5} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>

      <group position={[0, HOVER_Y, 0]}>
        {/* The platform disc itself. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[RADIUS, RADIUS * 1.05, 0.5, 24]} />
          <meshPhongMaterial color="#161a26" specular="#5a7ac0" shininess={35} fog />
        </mesh>

        {/* Repulsor glow underneath, standing in for whatever keeps it
            aloft — same "soft additive haze" language FlyingCars uses
            for its own under-glow, just scaled up. */}
        <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[RADIUS * 0.85, 24]} />
          <meshBasicMaterial ref={glowMatRef} color="#7fc4ff" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>

        {/* A low guardrail ring around the terrace edge. */}
        <mesh position={[0, 0.4, 0]}>
          <torusGeometry args={[RADIUS * 0.94, 0.04, 6, 40]} />
          <meshBasicMaterial color="#bfe4ff" transparent opacity={0.5} toneMapped={false} fog={false} />
        </mesh>

        {/* Garden planters — simple lit green boxes scattered near the
            center, the same "living structure" cue Biodome carries at
            street level, up here instead. */}
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.6;
          return (
            <mesh key={i} position={[Math.cos(a) * RADIUS * 0.35, 0.5, Math.sin(a) * RADIUS * 0.35]}>
              <boxGeometry args={[1.1, 0.5, 1.1]} />
              <meshLambertMaterial color="#2f6b3a" fog />
            </mesh>
          );
        })}

        {/* Lantern beacons ringing the terrace — small pulsing points
            of light, the "plaza at night" cue. */}
        {lanterns.map((l, i) => (
          <mesh
            key={i}
            position={[l.x, 0.6, l.z]}
            ref={(el) => {
              beaconRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshBasicMaterial color="#ffdca8" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
