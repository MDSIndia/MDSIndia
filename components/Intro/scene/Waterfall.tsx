"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRadialGlowTexture } from "./glowTexture";

const CLIFF_HEIGHT = 18;
const CLIFF_WIDTH = 11;
const FALL_WIDTH = 7.5;
// Well beyond CityScape's own building band (buildings top out around
// x~22 at their outermost roll — see CityScape.tsx's `11 + seeded*11`
// spread) and further out than the MDS sphere landmark's own x=24, so
// this reads as its own set-piece off the shoulder of the skyline
// rather than clipping through procedurally-placed towers, the same
// "place it past the normal building range" approach Landmark.tsx
// already uses.
const POSITION: [number, number, number] = [-27, 0, -72];
const MIST_COUNT = 14;

let cachedFlowTexture: THREE.Texture | null = null;

/** A tileable vertical streak pattern — irregular light/dark bands
 * rather than a flat color — standing in for falling water's own
 * vertical striations. Scrolled via `offset.y` each frame (see
 * useFrame below) so the same static canvas reads as continuously
 * falling water instead of a still image. */
function getWaterFlowTexture(): THREE.Texture {
  if (cachedFlowTexture) return cachedFlowTexture;
  const w = 64;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#bfe8ff";
  ctx.fillRect(0, 0, w, h);

  function seeded(i: number, salt: number) {
    const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  // Vertical streaks of varying width/brightness — real falling water
  // isn't a flat sheet, it's a field of separate rivulets.
  for (let i = 0; i < 40; i++) {
    const x = seeded(i, 811) * w;
    const streakW = 1 + seeded(i, 812) * 3;
    const bright = 0.45 + seeded(i, 813) * 0.55;
    ctx.fillStyle = `rgba(255,255,255,${bright})`;
    ctx.fillRect(x, 0, streakW, h);
  }
  // Horizontal turbulence bands, softer, breaking up the pure-vertical
  // read so it doesn't look like ruled lines.
  for (let i = 0; i < 18; i++) {
    const y = seeded(i, 821) * h;
    const bandH = 3 + seeded(i, 822) * 10;
    ctx.fillStyle = `rgba(10,20,40,${0.06 + seeded(i, 823) * 0.1})`;
    ctx.fillRect(0, y, w, bandH);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 5);
  cachedFlowTexture = texture;
  return texture;
}

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A lit waterfall set-piece cascading off an elevated rock/concrete
 * shelf into a glowing pool at street level — the one purely organic,
 * non-architectural feature the reference skyline carries alongside
 * all its glass and steel. Built from a static cliff mass, two
 * scrolling-texture water sheets (a wide upper fall and a narrower,
 * faster lower fall, so the cascade doesn't read as one uniform
 * plane), a foam-bright lip, a glowing pool disc, and a scattering of
 * rising/fading mist sprites at the base. */
export function Waterfall({ isMobile }: { isMobile: boolean }) {
  const flowTexture = useMemo(() => getWaterFlowTexture(), []);
  const glowTexture = useMemo(() => getRadialGlowTexture(), []);
  const upperMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lowerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const poolMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const mistRef = useRef<THREE.InstancedMesh>(null);

  const mistCount = isMobile ? 6 : MIST_COUNT;
  const mistSeeds = useMemo(
    () =>
      Array.from({ length: mistCount }, (_, i) => ({
        x: (seeded(i, 831) - 0.5) * FALL_WIDTH * 1.1,
        z: (seeded(i, 832) - 0.5) * 2,
        speed: 0.4 + seeded(i, 833) * 0.5,
        phase: seeded(i, 834) * Math.PI * 2,
        scale: 0.5 + seeded(i, 835) * 0.7,
      })),
    [mistCount]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (upperMatRef.current) {
      upperMatRef.current.map!.offset.y = (upperMatRef.current.map!.offset.y - delta * 0.9) % 1;
    }
    if (lowerMatRef.current) {
      lowerMatRef.current.map!.offset.y = (lowerMatRef.current.map!.offset.y - delta * 1.4) % 1;
    }
    if (poolMatRef.current) {
      poolMatRef.current.opacity = 0.35 + Math.sin(t * 0.8) * 0.08;
    }

    const mesh = mistRef.current;
    if (mesh) {
      const dummy = new THREE.Object3D();
      mistSeeds.forEach((m, i) => {
        const cycle = ((t * m.speed + m.phase) % 3) / 3;
        dummy.position.set(POSITION[0] + m.x, 0.3 + cycle * 3.2, POSITION[2] + 2.5 + m.z);
        const s = m.scale * (0.6 + cycle * 0.8);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={POSITION}>
      {/* Rock/concrete cliff mass the falls cascades off. */}
      <mesh position={[0, CLIFF_HEIGHT / 2, -1]}>
        <boxGeometry args={[CLIFF_WIDTH, CLIFF_HEIGHT, 3]} />
        <meshPhongMaterial color="#141a26" specular="#3a5a8c" shininess={20} fog />
      </mesh>

      {/* Glowing lip at the top the water spills over. */}
      <mesh position={[0, CLIFF_HEIGHT - 0.1, 0.35]}>
        <boxGeometry args={[FALL_WIDTH, 0.18, 0.5]} />
        <meshBasicMaterial color="#eaf8ff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Upper fall — wide, slower scroll. */}
      <mesh position={[0, CLIFF_HEIGHT * 0.62, 0.5]}>
        <planeGeometry args={[FALL_WIDTH, CLIFF_HEIGHT * 0.72]} />
        <meshBasicMaterial
          ref={upperMatRef}
          map={flowTexture}
          transparent
          opacity={0.55}
          depthWrite={false}
          fog={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Lower fall — narrower, faster scroll, breaking the cascade
          into two distinct stages rather than one uniform sheet. */}
      <mesh position={[0, CLIFF_HEIGHT * 0.18, 0.55]}>
        <planeGeometry args={[FALL_WIDTH * 0.8, CLIFF_HEIGHT * 0.36]} />
        <meshBasicMaterial
          ref={lowerMatRef}
          map={flowTexture}
          transparent
          opacity={0.7}
          depthWrite={false}
          fog={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cyan additive glow layered behind the falls — reads as the
          same lit-water treatment the reference image's waterfall has,
          rather than a plain grey cascade. */}
      <mesh position={[0, CLIFF_HEIGHT * 0.4, 0.2]}>
        <planeGeometry args={[FALL_WIDTH * 1.2, CLIFF_HEIGHT * 0.9]} />
        <meshBasicMaterial color="#4fd6ff" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Glowing pool at the base. */}
      <mesh position={[0, 0.03, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[FALL_WIDTH * 0.85, 24]} />
        <meshBasicMaterial
          ref={poolMatRef}
          color="#6fe0ff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Rising, fading mist puffs at the base — the impact-spray cue
          that sells the falls as moving water rather than a static
          textured plane. */}
      <instancedMesh ref={mistRef} args={[undefined, undefined, mistCount]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTexture}
          color="#dff3ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
