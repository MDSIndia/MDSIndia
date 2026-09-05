"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getWindowGridTexture,
  getWindowEmissiveTexture,
  getWindowNormalTexture,
} from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Early in the route (camera starts z=46) and prominent — the
// reference's own diagonal-braced twin tower reads as one of its most
// eye-catching structures, so this needs to arrive early and unmissed
// rather than buried mid-flight. Sits in the open side+1 gap north of
// OfficePark's own zone (z=-8, clearance 9, ending at z=1).
const POSITION: [number, number, number] = [20, 0, 18];
const TOWER_GAP = 6.6;
const TOWER_A_HEIGHT = 40;
const TOWER_B_HEIGHT = 48;
const TOWER_WIDTH = 2.4;
const TOWER_DEPTH = 2.4;
const BRACE_TILT_Y = 0.62; // 0..1 fraction of the shorter tower's height where the brace meets it
const BRACE_TILT_Y2 = 0.78; // fraction of the taller tower's height

/** Orients a Y-axis-aligned geometry to run from `start` to `end` —
 * same technique TreeOfLife's own branches use for angled limbs,
 * reused here for the diagonal brace connecting the two towers. */
function segmentTransform(start: THREE.Vector3, end: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  dir.normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  return { position, quaternion, length };
}

function SpireCluster({ baseHeight, seed }: { baseHeight: number; seed: number }) {
  const spires = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => {
        const angle = (i / 3) * Math.PI * 2 + seeded(seed, 951) * Math.PI * 2;
        const r = 0.35 + seeded(seed * 3 + i, 952) * 0.15;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          height: baseHeight * (0.55 + seeded(seed * 3 + i, 953) * 0.35),
          radius: 0.16 + seeded(seed * 3 + i, 954) * 0.08,
        };
      }),
    [baseHeight, seed]
  );

  return (
    <group>
      {spires.map((s, i) => (
        <mesh key={i} position={[s.x, s.height / 2, s.z]}>
          <cylinderGeometry args={[0.01, s.radius, s.height, 6]} />
          <meshPhongMaterial color="#0c1018" specular="#8fc4e8" shininess={70} fog />
        </mesh>
      ))}
    </group>
  );
}

function Tower({
  x,
  height,
  variant,
  index,
}: {
  x: number;
  height: number;
  variant: number;
  index: number;
}) {
  const windowMaps = useMemo(() => {
    const map = getWindowGridTexture(variant).clone();
    map.repeat.set(1.8, height / 11);
    map.needsUpdate = true;
    const emissiveMap = getWindowEmissiveTexture(variant).clone();
    emissiveMap.repeat.set(1.8, height / 11);
    emissiveMap.needsUpdate = true;
    const normalMap = getWindowNormalTexture().clone();
    normalMap.repeat.set(1.8, height / 11);
    normalMap.needsUpdate = true;
    return { map, emissiveMap, normalMap };
  }, [variant, height]);

  // A single stepped terrace, roughly two-thirds up — the reference's
  // own towers cut a visible green setback deck into the silhouette
  // rather than running as one unbroken extrusion.
  const terraceY = height * 0.64;

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[TOWER_WIDTH, height, TOWER_DEPTH]} />
        {/* toneMapped={false} removed — same washed-out-facade bug
            fixed in CityScape (see its own comment there). */}
        <meshPhongMaterial
          map={windowMaps.map}
          normalMap={windowMaps.normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          emissiveMap={windowMaps.emissiveMap}
          emissive={index === 0 ? "#bfe4ff" : "#ffd9ae"}
          emissiveIntensity={0.9}
          specular="#3a4a66"
          shininess={24}
          color="#12161e"
          fog
        />
      </mesh>

      {/* Terrace/garden setback. */}
      <mesh position={[0, terraceY, 0]}>
        <boxGeometry args={[TOWER_WIDTH * 1.5, 0.16, TOWER_DEPTH * 1.5]} />
        <meshPhongMaterial color="#1c2430" specular="#8fc4e8" shininess={50} fog />
      </mesh>
      <mesh position={[0, terraceY + 0.1, 0]}>
        <boxGeometry args={[TOWER_WIDTH * 1.44, 0.08, TOWER_DEPTH * 1.44]} />
        <meshLambertMaterial color="#3a7d44" fog />
      </mesh>
      <mesh position={[0, terraceY + 0.15, 0]}>
        <boxGeometry args={[TOWER_WIDTH * 1.5, 0.02, TOWER_DEPTH * 1.5]} />
        <meshBasicMaterial color="#8fe0c8" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Corner accent strips, matching CityScape's own bold-ribbon
          treatment so this landmark reads as part of the same skyline
          language rather than a different kit. */}
      {[
        [TOWER_WIDTH / 2, TOWER_DEPTH / 2],
        [-TOWER_WIDTH / 2, TOWER_DEPTH / 2],
        [TOWER_WIDTH / 2, -TOWER_DEPTH / 2],
        [-TOWER_WIDTH / 2, -TOWER_DEPTH / 2],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, height / 2, cz]}>
          <boxGeometry args={[0.1, height * 0.97, 0.1]} />
          <meshBasicMaterial color={index === 0 ? "#8fc4e8" : "#ffd9ae"} transparent opacity={0.45} toneMapped={false} fog={false} />
        </mesh>
      ))}

      <group position={[0, height, 0]}>
        <SpireCluster baseHeight={height * 0.5} seed={index + 1} />
      </group>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TOWER_WIDTH * 1.3, 16]} />
        <meshBasicMaterial color="#0a1420" transparent opacity={0.45} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

/** A dramatic diagonally-braced twin tower — the reference image's own
 * most distinctive silhouette (two spires leaning toward a shared
 * diagonal cross-brace) and, until now, the one architectural language
 * nothing in this skyline had at all: everything else in CityScape is
 * some variation on a single vertical extrusion. Two independently-
 * tapered, unevenly-heighted glass towers (asymmetric on purpose — the
 * reference's own pair aren't twins of equal height either), each
 * capped with a bundled needle-spire cluster instead of one spire, tied
 * together by a real structural brace running diagonally between them
 * with a glowing edge seam, plus a stepped garden terrace on each shaft
 * echoing the reference's own setback decks. */
export function TwinSpireBrace() {
  const braceGlowRef = useRef<THREE.MeshBasicMaterial>(null);

  const braceTransform = useMemo(() => {
    const start = new THREE.Vector3(-TOWER_GAP / 2, TOWER_A_HEIGHT * BRACE_TILT_Y, 0);
    const end = new THREE.Vector3(TOWER_GAP / 2, TOWER_B_HEIGHT * BRACE_TILT_Y2, 0);
    return segmentTransform(start, end);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (braceGlowRef.current) braceGlowRef.current.opacity = 0.55 + Math.sin(t * 0.9) * 0.15;
  });

  return (
    <group position={POSITION}>
      {/* Shared ground plaza. */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TOWER_GAP + TOWER_WIDTH * 3, TOWER_DEPTH * 3]} />
        <meshLambertMaterial color="#343c44" fog />
      </mesh>

      <Tower x={-TOWER_GAP / 2} height={TOWER_A_HEIGHT} variant={7} index={0} />
      <Tower x={TOWER_GAP / 2} height={TOWER_B_HEIGHT} variant={8} index={1} />

      {/* The diagonal structural brace — real geometry, not a glow
          plane, so it reads as load-bearing architecture connecting
          the two towers. */}
      <mesh position={braceTransform.position} quaternion={braceTransform.quaternion}>
        <cylinderGeometry args={[0.22, 0.22, braceTransform.length, 8]} />
        <meshPhongMaterial color="#1c2430" specular="#8fc4e8" shininess={60} fog />
      </mesh>
      <mesh position={braceTransform.position} quaternion={braceTransform.quaternion}>
        <cylinderGeometry args={[0.26, 0.26, braceTransform.length, 8, 1, true]} />
        <meshBasicMaterial
          ref={braceGlowRef}
          color="#7fe0ff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* A slimmer secondary strut, echoing the reference's own layered
          bracing rather than a single beam. */}
      <mesh
        position={[
          braceTransform.position.x,
          braceTransform.position.y - 1.4,
          braceTransform.position.z,
        ]}
        quaternion={braceTransform.quaternion}
      >
        <cylinderGeometry args={[0.09, 0.09, braceTransform.length * 0.94, 6]} />
        <meshPhongMaterial color="#161c24" specular="#8fc4e8" shininess={50} fog />
      </mesh>
    </group>
  );
}
