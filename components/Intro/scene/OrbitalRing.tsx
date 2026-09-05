"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getParticleDotTexture } from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// High and huge, centered over the middle of the flight (route runs
// roughly z=46 to z=-116) so it stays visible arcing overhead for most
// of the approach rather than passing by in a couple of seconds the
// way a ground-level structure would. Tilted rather than flat-overhead
// so it reads as a ring seen at an angle — the reference's own orbital
// ring crosses the sky as a curve, not a circle centered dead above the
// camera.
const CENTER: [number, number, number] = [10, 95, -45];
const RADIUS = 145;
const SAT_COUNT = 14;

/** A massive orbital ring arced across the sky above the city — a
 * space-elevator/orbital-collector megastructure, the one "sky
 * activity" cue this scene was missing entirely (drones and flying
 * cars cover street-level air traffic; nothing read as operating at
 * true orbital scale). A thin glowing torus with a handful of small
 * light points riding it like satellites/transit pods, both animating
 * slowly — anything faster would read as spinning rather than orbiting
 * at the scale this is meant to imply. */
export function OrbitalRing({ isMobile }: { isMobile: boolean }) {
  const ringRef = useRef<THREE.Group>(null);

  const dotTexture = useMemo(() => getParticleDotTexture(), []);

  const satellites = useMemo(
    () =>
      Array.from({ length: SAT_COUNT }, (_, i) => ({
        angle: (i / SAT_COUNT) * Math.PI * 2 + seeded(i, 711) * 0.3,
        speed: 0.02 + seeded(i, 712) * 0.015,
        size: 0.9 + seeded(i, 713) * 1.4,
      })),
    []
  );

  const satPositions = useMemo(() => new Float32Array(SAT_COUNT * 3), []);
  const satGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
    return geo;
  }, [satPositions]);
  const satMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 3.2,
        map: dotTexture,
        alphaMap: dotTexture,
        alphaTest: 0.05,
        color: "#bfe8ff",
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [dotTexture]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) ringRef.current.rotation.z = t * 0.01;

    // Satellite positions are computed directly in the same local frame
    // the ring itself sits in (before the outer group's tilt), so they
    // automatically inherit that tilt for free — no need to also copy
    // the ring's own slow self-rotation onto this group, which would
    // double up and drift the satellites off the ring's visible path.
    const pos = satGeometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    satellites.forEach((sat, i) => {
      const angle = sat.angle + t * sat.speed;
      arr[i * 3] = Math.cos(angle) * RADIUS;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = Math.sin(angle) * RADIUS;
    });
    pos.needsUpdate = true;
  });

  return (
    <group position={CENTER} rotation={[Math.PI / 2.6, 0.15, 0.5]}>
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[RADIUS, 0.35, 6, 120]} />
          <meshBasicMaterial
            color="#5ab4ff"
            transparent
            opacity={isMobile ? 0.3 : 0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
        {/* A second, very faint wider halo so the ring has some glow
            thickness rather than reading as a hard thin wire at this
            scale/distance. */}
        <mesh>
          <torusGeometry args={[RADIUS, 0.9, 6, 120]} />
          <meshBasicMaterial
            color="#5ab4ff"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      <points geometry={satGeometry} material={satMaterial} />
    </group>
  );
}
