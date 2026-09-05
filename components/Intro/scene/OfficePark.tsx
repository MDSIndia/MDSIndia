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

// Directly across the road from MDSOfficeTower (x=-22, z=-8) — the gap
// on this side (side +1) was otherwise open from HolographicMonument's
// zone (ending -29) all the way past the start of the route, so nothing
// here needed to move to make room. Two mid-rise towers rather than one
// hero tower: shorter than MDSOfficeTower and unbranded, so this reads
// as a real business district (several tenants, not one company) with
// MDS's own headquarters still clearly the standout structure opposite.
const POSITION: [number, number, number] = [22, 0, -8];
const TOWER_A_HEIGHT = 21;
const TOWER_B_HEIGHT = 17;
const TOWER_WIDTH = 5;
const TOWER_DEPTH = 4.4;
const GAP = 6.5;
const BRIDGE_Y = 12;

let cachedPlacard: THREE.Texture | null = null;

/** A generic building-number placard — the small lit sign a real office
 * building mounts by its own entrance, standing in for actual tenant
 * branding without inventing a fictional company name to compete with
 * MDS's own signage across the road. */
function getPlacardTexture(label: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(20,26,34,0.9)";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(143,196,232,0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.fillStyle = "#cfeeff";
  ctx.font = "700 56px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, size / 2, size / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useOfficeWindowMaps(variant: number, repeatY: number) {
  return useMemo(() => {
    const map = getWindowGridTexture(variant).clone();
    map.repeat.set(2.2, repeatY);
    map.needsUpdate = true;
    const emissiveMap = getWindowEmissiveTexture(variant).clone();
    emissiveMap.repeat.set(2.2, repeatY);
    emissiveMap.needsUpdate = true;
    const normalMap = getWindowNormalTexture().clone();
    normalMap.repeat.set(2.2, repeatY);
    normalMap.needsUpdate = true;
    return { map, emissiveMap, normalMap };
  }, [variant, repeatY]);
}

function OfficeTower({
  x,
  height,
  variant,
  label,
}: {
  x: number;
  height: number;
  variant: number;
  label: string;
}) {
  const windowMaps = useOfficeWindowMaps(variant, height / 12);
  const placardTexture = useMemo(() => getPlacardTexture(label), [label]);
  const signMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (signMatRef.current)
      signMatRef.current.opacity = 0.7 + Math.sin(t * 0.6 + x) * 0.15;
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[TOWER_WIDTH, height, TOWER_DEPTH]} />
        {/* toneMapped={false} removed — same washed-out-facade bug
            fixed in CityScape (see its own comment there). */}
        <meshPhongMaterial
          map={windowMaps.map}
          normalMap={windowMaps.normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          emissiveMap={windowMaps.emissiveMap}
          emissive="#bfe4ff"
          emissiveIntensity={0.85}
          specular="#3a4a66"
          shininess={20}
          color="#161e2a"
          fog
        />
      </mesh>

      {/* Corner accent strips, the same premium-tower cue every other
          hero building in this scene carries. */}
      {[
        [TOWER_WIDTH / 2, TOWER_DEPTH / 2],
        [-TOWER_WIDTH / 2, TOWER_DEPTH / 2],
        [TOWER_WIDTH / 2, -TOWER_DEPTH / 2],
        [-TOWER_WIDTH / 2, -TOWER_DEPTH / 2],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, height / 2, cz]}>
          <boxGeometry args={[0.08, height * 0.97, 0.08]} />
          <meshBasicMaterial color="#8fc4e8" transparent opacity={0.35} toneMapped={false} fog={false} />
        </mesh>
      ))}

      {/* Flat roofline parapet cap. */}
      <mesh position={[0, height - 0.1, 0]}>
        <boxGeometry args={[TOWER_WIDTH * 1.06, 0.2, TOWER_DEPTH * 1.06]} />
        <meshPhongMaterial color="#232b38" specular="#8fc4e8" shininess={40} fog />
      </mesh>

      {/* Lit entrance placard by the door. */}
      <mesh position={[0, 1.6, TOWER_DEPTH / 2 + 0.02]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial
          ref={signMatRef}
          map={placardTexture}
          transparent
          opacity={0.8}
          toneMapped={false}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Ground contact shadow. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TOWER_WIDTH * 1.1, 20]} />
        <meshBasicMaterial color="#0a1420" transparent opacity={0.45} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

/** A small business district opposite MDS's own headquarters
 * (MDSOfficeTower.tsx) — two shorter, unbranded office towers sharing a
 * ground plaza and a glass sky bridge partway up, so this stretch of
 * the route reads as an actual district with multiple tenants rather
 * than a single showcase building. Deliberately more restrained than
 * MDSOfficeTower's own "full-on futuristic" treatment (no hovering
 * rings, no energy conduits) — everyday office towers next to the
 * company's own standout HQ is what makes MDS's building actually read
 * as the standout, rather than diluting it with more matching
 * spectacle. */
export function OfficePark() {
  const bridgeGlowRef = useRef<THREE.MeshBasicMaterial>(null);

  const trees = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        x: (seeded(i, 611) - 0.5) * GAP * 1.6,
        z: (seeded(i, 612) - 0.5) * 4,
        height: 1.3 + seeded(i, 613) * 0.5,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bridgeGlowRef.current) bridgeGlowRef.current.opacity = 0.45 + Math.sin(t * 0.8) * 0.12;
  });

  return (
    <group position={POSITION}>
      {/* Shared ground plaza between the two towers. */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GAP + TOWER_WIDTH * 2 + 2, TOWER_DEPTH + 3]} />
        <meshLambertMaterial color="#343c44" fog />
      </mesh>

      <OfficeTower x={-GAP / 2} height={TOWER_A_HEIGHT} variant={5} label="A" />
      <OfficeTower x={GAP / 2} height={TOWER_B_HEIGHT} variant={6} label="B" />

      {/* Glass sky bridge connecting the two towers partway up — the
          "shared campus" cue that ties the pair together as one
          development rather than two unrelated buildings that happen
          to be adjacent. */}
      <mesh position={[0, BRIDGE_Y, 0]}>
        <boxGeometry args={[GAP, 0.7, TOWER_DEPTH * 0.7]} />
        <meshPhongMaterial color="#1c2632" specular="#8fc4e8" shininess={50} transparent opacity={0.85} fog />
      </mesh>
      <mesh position={[0, BRIDGE_Y + 0.36, 0]}>
        <boxGeometry args={[GAP * 0.98, 0.02, TOWER_DEPTH * 0.66]} />
        <meshBasicMaterial ref={bridgeGlowRef} color="#8fc4e8" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* A few simple trees softening the shared plaza. */}
      {trees.map((tr, i) => (
        <group key={i} position={[tr.x, 0, tr.z]}>
          <mesh position={[0, tr.height * 0.4, 0]}>
            <cylinderGeometry args={[0.07, 0.09, tr.height * 0.8, 6]} />
            <meshLambertMaterial color="#3a2a1e" fog />
          </mesh>
          <mesh position={[0, tr.height * 0.85, 0]}>
            <icosahedronGeometry args={[tr.height * 0.4, 1]} />
            <meshLambertMaterial color="#3a7d44" fog />
          </mesh>
        </group>
      ))}
    </group>
  );
}
