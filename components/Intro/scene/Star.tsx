"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { INTRO_DURATION, windowProgress, easeInQuad } from "./timeline";
import { STAR_POSITION } from "./path";
import { getRadialGlowTexture, getRayTexture } from "./glowTexture";

const RAY_ANGLES = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
const RAY_COLORS = ["#8fe6ff", "#7fb2ff", "#a9e9ff", "#6fa8ff"];

/** The distant beacon waiting at the end of the highway — a brilliant
 * star, not a portal or a ring: a soft white core, a cyan/blue halo,
 * and a handful of lens-flare rays, all built from camera-facing
 * sprites (never a solid disc or torus) so it always reads as a point
 * of light rather than a shape, however close the camera gets. */
export function Star() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Sprite>(null);
  const innerGlowRef = useRef<THREE.Sprite>(null);
  const outerGlowRef = useRef<THREE.Sprite>(null);
  const rayRefs = useRef<(THREE.Sprite | null)[]>([]);
  const sparkleGroupRef = useRef<THREE.Group>(null);

  const glowTexture = useMemo(() => getRadialGlowTexture(), []);
  const rayTexture = useMemo(() => getRayTexture(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    // A tiny, distant point of light that accelerates into a bright
    // beacon as the camera closes in — capped well short of actually
    // filling the horizon (it used to grow to 30x, easily engulfing
    // the whole frame including the buildings around it) so the
    // skyline stays visible right up to the end instead of the glow
    // doing all the work alone.
    const growth = windowProgress(t, 6.2, INTRO_DURATION, easeInQuad);
    const scale = 0.1 + growth * growth * 13;
    group.visible = growth > 0.002;
    group.scale.setScalar(scale);
    group.position.set(...STAR_POSITION);

    const engulf = windowProgress(t, 8.4, INTRO_DURATION);
    // A gentle, irregular flicker rather than a smooth mechanical pulse.
    const flicker = 0.92 + Math.sin(t * 9.2) * 0.04 + Math.sin(t * 3.1) * 0.04;
    // Once fully engulfed, the star doesn't hold forever — it recedes
    // gradually across the light-dissolve so the WebGL glow keeps
    // pace with the CSS veil fading on top of it, rather than sitting
    // frozen at max brightness until an abrupt unmount.
    const recede = 1 - windowProgress(t, INTRO_DURATION, INTRO_DURATION + 1.3);

    const coreMat = coreRef.current?.material as
      | THREE.SpriteMaterial
      | undefined;
    if (coreMat)
      coreMat.opacity = Math.min(1, (0.85 + engulf * 0.15) * flicker) * recede;

    const innerMat = innerGlowRef.current?.material as
      | THREE.SpriteMaterial
      | undefined;
    if (innerMat) innerMat.opacity = (0.5 + engulf * 0.35) * flicker * recede;

    const outerMat = outerGlowRef.current?.material as
      | THREE.SpriteMaterial
      | undefined;
    if (outerMat) outerMat.opacity = (0.22 + engulf * 0.3) * recede;

    rayRefs.current.forEach((ray, i) => {
      if (!ray) return;
      const mat = ray.material as THREE.SpriteMaterial;
      mat.opacity =
        (0.32 + Math.sin(t * (1.4 + i * 0.3)) * 0.14) *
        (0.6 + engulf * 0.4) *
        recede;
      mat.rotation = RAY_ANGLES[i] + t * 0.04;
    });

    if (sparkleGroupRef.current) {
      sparkleGroupRef.current.scale.setScalar(0.2 + recede * 0.8);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* subtle cyan/blue rays fanning out from the star */}
      {RAY_ANGLES.map((angle, i) => (
        <sprite
          key={i}
          ref={(el) => {
            rayRefs.current[i] = el;
          }}
          scale={[3.4, 0.16, 1]}
        >
          <spriteMaterial
            map={rayTexture}
            color={RAY_COLORS[i]}
            transparent
            opacity={0.3}
            rotation={angle}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
      ))}

      {/* soft outer bloom */}
      <sprite ref={outerGlowRef} scale={[2.4, 2.4, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#6fc6ff"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {/* cyan/blue inner glow */}
      <sprite ref={innerGlowRef} scale={[1.15, 1.15, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#bfefff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {/* brilliant white core */}
      <sprite ref={coreRef} scale={[0.55, 0.55, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffffff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      <group ref={sparkleGroupRef}>
        <Sparkles count={70} scale={2} size={2.5} speed={0.5} color="#cfeeff" />
      </group>
    </group>
  );
}
