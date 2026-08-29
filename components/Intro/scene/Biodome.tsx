"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RADIUS = 10;
// Right side of the road, further down the route than every other
// landmark (Landmark.tsx's MDS sphere at x=24/z=-52, NoorvaTower at
// x=-21/z=-27, Waterfall at x=-27/z=-72) — spreading the set-pieces
// alternately left/right along the flight so each reads as its own
// beat rather than clustering into one crowded stretch.
const POSITION: [number, number, number] = [22, 0, -95];

const TREE_GREENS = ["#3a7d44", "#4f9e5f", "#2f6b3a"];

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A different kind of futuristic structure entirely: a glass biodome
 * park rather than another tower — a hemispherical greenhouse
 * sheltering a small lit garden, the "living city" amenity real
 * arcology-style developments build alongside pure office/residential
 * towers. Built the same way every other landmark in this scene is
 * (a static group, single non-instanced meshes, only a slow ambient
 * animation) since there's only one of it. */
export function Biodome() {
  const wireRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const trees = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: (seeded(i, 511) - 0.5) * RADIUS * 1.3,
        z: (seeded(i, 512) - 0.5) * RADIUS * 1.3,
        height: 1.2 + seeded(i, 513) * 1.1,
        radius: 0.5 + seeded(i, 514) * 0.4,
        color: TREE_GREENS[i % TREE_GREENS.length],
      })).filter((t) => Math.hypot(t.x, t.z) < RADIUS * 0.82),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (wireRef.current) wireRef.current.rotation.y = t * 0.03;
    if (glowMatRef.current) glowMatRef.current.opacity = 0.22 + Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group position={POSITION}>
      {/* Glass dome shell — a hemisphere (thetaLength = PI/2) rather
          than a full sphere, so it sits on the ground like a real
          greenhouse structure instead of floating half-buried. */}
      <mesh>
        <sphereGeometry args={[RADIUS, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhongMaterial
          color="#0c2a24"
          specular="#7fe0c8"
          shininess={60}
          transparent
          opacity={0.32}
          depthWrite={false}
          side={THREE.DoubleSide}
          fog
        />
      </mesh>

      {/* Geodesic wireframe grid overlay, same "structure + glow"
          layering the MDS sphere landmark uses. */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[RADIUS * 1.005, 16, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color="#8fe0c8"
          wireframe
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Ground disc — the base ring the dome's edge sits on. */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADIUS * 0.98, RADIUS * 1.06, 40]} />
        <meshBasicMaterial color="#4fd6b8" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Interior park floor — a warm-green glow standing in for a lit
          garden bed, visible through the transparent glass shell. */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RADIUS * 0.9, 32]} />
        <meshBasicMaterial ref={glowMatRef} color="#3fae7a" transparent opacity={0.24} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* A handful of simple trees inside, giving the dome an actual
          "park" silhouette rather than an empty glass shell. */}
      {trees.map((tr, i) => (
        <group key={i} position={[tr.x, 0, tr.z]}>
          <mesh position={[0, tr.height * 0.4, 0]}>
            <cylinderGeometry args={[0.08, 0.1, tr.height * 0.8, 6]} />
            <meshLambertMaterial color="#3a2a1e" fog />
          </mesh>
          <mesh position={[0, tr.height * 0.8 + tr.radius * 0.7, 0]}>
            <icosahedronGeometry args={[tr.radius, 1]} />
            <meshLambertMaterial color={tr.color} fog />
          </mesh>
        </group>
      ))}

      {/* Ground contact shadow, matching every other structure. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RADIUS * 1.2, 24]} />
        <meshBasicMaterial color="#132a24" transparent opacity={0.5} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
