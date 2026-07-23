"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp01, windowProgress } from "./timeline";
import { STAR_POSITION } from "./path";
import { getParticleDotTexture, getRadialGlowTexture } from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** The moment the camera is engulfed by the star. */
const BLAST_START = 8.55;
const PALETTE = ["#ffffff", "#00d4ff", "#7fb2ff", "#0055FF", "#bfe9ff"];

/** The star doesn't explode — it blooms: a graceful "digital big bang"
 * of colored energy particles, a brief central flash, and a few
 * staggered expanding shockwave rings, all blue/cyan/white. Fires once
 * as the cinematic reaches its final moment and keeps expanding through
 * the hand-off into the homepage. */
export function CosmicBlast({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 90 : 180;
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Sprite>(null);

  const dotTexture = useMemo(() => getParticleDotTexture(), []);
  const glowTexture = useMemo(() => getRadialGlowTexture(), []);

  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      positions[i * 3] = STAR_POSITION[0];
      positions[i * 3 + 1] = STAR_POSITION[1];
      positions[i * 3 + 2] = STAR_POSITION[2];

      const theta = seeded(i, 61) * Math.PI * 2;
      const phi = Math.acos(2 * seeded(i, 62) - 1);
      const speed = 6 + seeded(i, 63) * 22;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed * 0.6;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

      tmpColor.set(PALETTE[i % PALETTE.length]);
      colorArr[i * 3] = tmpColor.r;
      colorArr[i * 3 + 1] = tmpColor.g;
      colorArr[i * 3 + 2] = tmpColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));
    return { geometry: geo, velocities };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.26,
        map: dotTexture,
        alphaMap: dotTexture,
        alphaTest: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [dotTexture]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const elapsedSinceBlast = Math.max(0, t - BLAST_START);
    const ignite = windowProgress(t, BLAST_START, BLAST_START + 0.15);
    const life = clamp01(elapsedSinceBlast / 2.3);
    material.opacity = ignite * (1 - life * 0.85);

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] = STAR_POSITION[0] + velocities[i * 3] * elapsedSinceBlast;
      arr[i * 3 + 1] =
        STAR_POSITION[1] +
        velocities[i * 3 + 1] * elapsedSinceBlast -
        elapsedSinceBlast * elapsedSinceBlast * 0.3;
      arr[i * 3 + 2] =
        STAR_POSITION[2] + velocities[i * 3 + 2] * elapsedSinceBlast;
    }
    pos.needsUpdate = true;

    [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
      const delay = i * 0.24;
      const p = clamp01((t - BLAST_START - delay) / 1.7);
      if (!ref.current) return;
      ref.current.scale.setScalar(0.3 + p * 26);
      ref.current.position.set(...STAR_POSITION);
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity =
        (1 - p) *
        0.55 *
        windowProgress(t, BLAST_START + delay, BLAST_START + delay + 0.1);
    });

    if (flashRef.current) {
      flashRef.current.position.set(...STAR_POSITION);
      const flashMat = flashRef.current.material as THREE.SpriteMaterial;
      const flashLife = clamp01(elapsedSinceBlast / 0.5);
      flashMat.opacity =
        (1 - flashLife) * windowProgress(t, BLAST_START, BLAST_START + 0.08);
    }
  });

  return (
    <group>
      <points geometry={geometry} material={material} />

      <sprite ref={flashRef} scale={[9, 9, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {[ring1Ref, ring2Ref, ring3Ref].map((ref, i) => (
        <mesh key={i} ref={ref} rotation={[(Math.PI / 2) * (i % 2), i * 0.4, 0]}>
          <torusGeometry args={[1, 0.05, 8, 64]} />
          <meshBasicMaterial
            color={PALETTE[i + 1]}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
