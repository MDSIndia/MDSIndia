"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { BRAND_LOGO } from "./adImages";

useTexture.preload(BRAND_LOGO);

// Off to the right, resting on the ground like every other structure
// in this scene (not floating disconnected up in the air), roughly
// mid-flight so it's visible growing for a good stretch of the route
// before the camera passes it.
const RADIUS = 9;
const POSITION: [number, number, number] = [24, RADIUS, -52];

/** A single unique landmark structure — a large faceted geodesic
 * sphere carrying the MDS mark, the skyline's one clear focal point
 * rather than another repeated tower archetype. Built from a low-poly
 * IcosahedronGeometry (reads as a faceted "crystal ball"/geodesic dome
 * for free, no custom modeling needed): a solid glass-blue core, a
 * slightly larger wireframe shell for the glowing hex-grid look, and
 * a soft outer bloom halo, with the brand mark mounted on the face
 * pointed back down the highway toward the approaching camera. Static
 * geometry — only the wireframe shell's slow rotation and the halo's
 * gentle pulse animate, everything else about it just sits there and
 * lets the camera's own approach do the work. */
export function Landmark() {
  const texture = useTexture(BRAND_LOGO) as THREE.Texture;
  const wireRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringRef = useRef<THREE.Group>(null);
  const ringGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (wireRef.current) wireRef.current.rotation.y = t * 0.045;
    if (haloMatRef.current) haloMatRef.current.opacity = 0.28 + Math.sin(t * 0.6) * 0.08;
    // The ring spins around its own tilted axis (its local Y, already
    // rotated off-plane by the group below) rather than orbiting the
    // sphere bodily — reads as "a structure rotating in place" the way
    // a real orbital-ring landmark would, not a satellite circling it.
    if (ringRef.current) ringRef.current.rotation.z = t * 0.08;
  });

  return (
    <group position={POSITION}>
      {/* Solid glass-blue core. */}
      <mesh>
        <icosahedronGeometry args={[RADIUS, 1]} />
        <meshPhongMaterial
          color="#0a1830"
          specular="#4fd6ff"
          shininess={70}
          transparent
          opacity={0.6}
          depthWrite={false}
          fog
        />
      </mesh>

      {/* Glowing wireframe shell — the faceted geodesic-grid look. */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[RADIUS * 1.015, 1]} />
        <meshBasicMaterial
          color="#4fd6ff"
          wireframe
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Soft outer bloom halo. */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.2, 20, 20]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color="#4fd6ff"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* A dramatic tilted orbital ring encircling the sphere — the
          single most distinctive silhouette element a landmark like
          this can have (rotational symmetry a plain sphere/spire alone
          doesn't have), rather than another concentric halo. Tilted at
          a compound angle (both X and Z) instead of flat/Saturn-style
          so it reads as a ring cutting diagonally across the sphere
          from most viewing angles along the flight, not just a disc
          that goes edge-on and disappears from some approach angles.
          The group only carries the tilt; the ring's own local Z spin
          (see useFrame above) is what animates. */}
      <group rotation={[Math.PI / 2.3, 0.4, 0.3]}>
        <group ref={ringRef}>
          {/* The ring itself — real geometry with Phong shading so it
              actually reads as a solid structure catching the rig
              light, not just another flat glow plane. */}
          <mesh>
            <torusGeometry args={[RADIUS * 1.7, RADIUS * 0.045, 12, 64]} />
            <meshPhongMaterial
              color="#0e2440"
              specular="#8fe0ff"
              shininess={90}
              emissive="#2a8fc7"
              emissiveIntensity={0.5}
              fog
            />
          </mesh>

          {/* Soft additive glow tracing the same ring, slightly larger
              — the same "structure + halo" layering the sphere itself
              uses, so the ring reads as lit rather than a bare grey
              band. */}
          <mesh ref={ringGlowRef}>
            <torusGeometry args={[RADIUS * 1.7, RADIUS * 0.09, 10, 64]} />
            <meshBasicMaterial
              color="#4fd6ff"
              transparent
              opacity={0.22}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {/* The MDS mark, mounted on the face pointed back down the
          highway so it's readable as the camera approaches. */}
      <mesh position={[0, 0, RADIUS * 0.9]}>
        <planeGeometry args={[RADIUS * 0.85, RADIUS * 0.85]} />
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Ground contact shadow, same stylized-AO trick CityScape uses
          under every building, so the sphere reads as resting on the
          ground rather than pasted in front of it. */}
      <mesh position={[0, -RADIUS + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RADIUS * 1.3, 20]} />
        <meshBasicMaterial
          color="#4a5568"
          transparent
          opacity={0.5}
          blending={THREE.MultiplyBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
