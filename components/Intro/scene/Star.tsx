"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { INTRO_DURATION, windowProgress, easeInQuad } from "./timeline";
import { STAR_POSITION } from "./path";
import { getRadialGlowTexture, getPortalGridTexture } from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Progressively larger, independently-spinning rings — mixed rotation
// directions/speeds so the stack reads as a mechanical, layered portal
// rather than one shape simply scaling up. Tube radius scales down for
// the outer rings so they stay visually "thinner/further" than the
// inner ones, the same depth cue real concentric hardware rings use.
const RING_CONFIGS = [
  { radius: 0.62, tube: 0.02, spin: 0.22, color: "#e8f8ff", nodes: 10 },
  { radius: 0.86, tube: 0.017, spin: -0.15, color: "#8fe6ff", nodes: 14 },
  { radius: 1.12, tube: 0.014, spin: 0.11, color: "#6fa8ff", nodes: 18 },
];

const BLADE_COUNT = 10;
const BLADE_RADIUS = 0.4;
const ARC_COUNT = 4;

/** A jagged energy-arc path bridging two radii — the same "irregular
 * lightning" silhouette real electrical arcing has, built once per arc
 * (not regenerated every flash) since a fixed jagged shape that simply
 * flashes on/off already reads as an arc; only real lightning renderers
 * need a fresh path per strike. */
function buildArcPath(seed: number, r0: number, r1: number, baseAngle: number) {
  const segments = 7;
  const points: THREE.Vector3[] = [];
  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const r = r0 + (r1 - r0) * t;
    const jitter = (seeded(seed * 13 + s, 941) - 0.5) * 0.09;
    const angle = baseAngle + jitter;
    points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
  }
  return new THREE.CatmullRomCurve3(points);
}

/** The distant beacon waiting at the end of the highway — a glowing
 * holographic portal rather than a point-light star: concentric
 * spinning rings studded with small mechanical nodes, a rotor of
 * turbine/iris blades near the core, occasional energy arcs jumping
 * between rings, a faint projected hologram reticle, a scanning arc
 * sweeping around the rim, and a soft energy core filling the middle —
 * built to read as an actual piece of hardware generating the light
 * rather than a flat decorative glow, so it lands as a real gateway to
 * arrive at instead of a distant special effect. */
export function Star({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Sprite>(null);
  const innerGlowRef = useRef<THREE.Sprite>(null);
  const outerGlowRef = useRef<THREE.Sprite>(null);
  const gridRef = useRef<THREE.Sprite>(null);
  const ringGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const ringMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sweepRef = useRef<THREE.Mesh>(null);
  const sparkleGroupRef = useRef<THREE.Group>(null);
  const irisGroupRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const fringeRef = useRef<THREE.Mesh>(null);
  const arcRefs = useRef<(THREE.Mesh | null)[]>([]);

  const glowTexture = useMemo(() => getRadialGlowTexture(), []);
  const gridTexture = useMemo(() => getPortalGridTexture(), []);

  const blades = useMemo(
    () =>
      Array.from({ length: BLADE_COUNT }, (_, i) => ({
        angle: (i / BLADE_COUNT) * Math.PI * 2,
        length: 0.2 + seeded(i, 951) * 0.08,
      })),
    []
  );

  const arcs = useMemo(
    () =>
      Array.from({ length: ARC_COUNT }, (_, i) => {
        const ringA = i % 2;
        const r0 = RING_CONFIGS[ringA].radius;
        const r1 = RING_CONFIGS[ringA + 1].radius;
        const baseAngle = seeded(i, 961) * Math.PI * 2;
        return {
          curve: buildArcPath(i, r0, r1, baseAngle),
          phase: seeded(i, 962) * Math.PI * 2,
          period: 2.6 + seeded(i, 963) * 2.2,
          color: i % 2 === 0 ? "#eaf9ff" : "#9fd8ff",
        };
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    // A tiny, distant point of light that accelerates into a bright
    // portal as the camera closes in — capped well short of actually
    // filling the horizon (it used to grow to 30x, easily engulfing
    // the whole frame including the buildings around it) so the
    // skyline stays visible right up to the end instead of the glow
    // doing all the work alone.
    const growth = windowProgress(t, 6.2, INTRO_DURATION, easeInQuad);
    const scale = 0.1 + growth * growth * 13;
    group.visible = growth > 0.002;
    group.scale.setScalar(scale);
    group.position.set(...STAR_POSITION);
    // Face the camera's own straight-down-the-road approach — the ring
    // stack is built flat in the XY plane (the default facing of a
    // torus with no rotation), which already matches this scene's
    // fixed x=0 camera path, so no per-frame billboarding is needed.

    const engulf = windowProgress(t, 8.4, INTRO_DURATION);
    // A gentle, irregular flicker rather than a smooth mechanical pulse
    // — a hologram's own faint instability, not a hard glitch.
    const flicker = 0.92 + Math.sin(t * 9.2) * 0.04 + Math.sin(t * 3.1) * 0.04;
    // Once fully engulfed, the portal doesn't hold forever — it recedes
    // gradually across the light-dissolve so the WebGL glow keeps pace
    // with the CSS veil fading on top of it, rather than sitting frozen
    // at max brightness until an abrupt unmount.
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

    const gridMat = gridRef.current?.material as
      | THREE.SpriteMaterial
      | undefined;
    if (gridMat) {
      gridMat.opacity = (0.55 + Math.sin(t * 1.3) * 0.12) * flicker * recede;
      gridMat.rotation = t * 0.05;
    }

    ringGroupRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const cfg = RING_CONFIGS[i];
      ring.rotation.z = t * cfg.spin;
      const mesh = ringMeshRefs.current[i];
      const mat = mesh?.material as THREE.MeshBasicMaterial | undefined;
      if (mat)
        mat.opacity =
          (0.55 + Math.sin(t * (1.1 + i * 0.4) + i) * 0.18) *
          (0.6 + engulf * 0.4) *
          recede;
    });

    if (sweepRef.current) {
      // A bright arc continuously sweeping around the outermost ring —
      // the one clearly "scanning" cue that reads as an active
      // hologram readout rather than a static decorative ring.
      sweepRef.current.rotation.z = -t * 0.6;
      const mat = sweepRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.5 + engulf * 0.4) * recede;
    }

    // A turbine/iris rotor near the core — the single strongest "this
    // is a real machine generating the light" cue, since a spinning
    // hardware rotor reads as mechanism where a plain glow only reads
    // as an effect. The whole assembly spins opposite the innermost
    // ring for contrasting motion; each blade also gets its own slight
    // pitch breathing on top, like a shutter easing open and closed
    // rather than a rigid fan.
    if (irisGroupRef.current) {
      irisGroupRef.current.rotation.z = -t * 0.4;
    }
    bladeRefs.current.forEach((blade, i) => {
      if (!blade) return;
      const pitch = Math.sin(t * 1.6 + i * 0.7) * 0.18;
      blade.rotation.y = 0.5 + pitch;
      const mat = blade.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.5 + engulf * 0.4) * recede;
    });

    // Occasional energy arcs jumping between rings — a fixed jagged
    // path per arc (see buildArcPath) that flashes briefly on its own
    // period/phase, never synchronized with the other arcs, the same
    // "each on its own clock" fix applied to the skyline's antenna
    // beacons elsewhere in this scene.
    arcRefs.current.forEach((arc, i) => {
      if (!arc) return;
      const a = arcs[i];
      const cycle = ((t + a.phase) % a.period) / a.period;
      const flash = cycle < 0.08 ? Math.sin((cycle / 0.08) * Math.PI) : 0;
      const mat = arc.material as THREE.MeshBasicMaterial;
      mat.opacity = flash * recede;
    });

    // A faint chromatic-fringe ring just outside the outermost one —
    // a slight color split at the rim the way a real lens/optical
    // instrument shows fringing at high contrast edges, reinforcing
    // "this was actually captured by a camera" rather than a flat CG
    // decal.
    if (fringeRef.current) {
      const mat = fringeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.16 + Math.sin(t * 0.7) * 0.05) * recede;
    }

    if (sparkleGroupRef.current) {
      sparkleGroupRef.current.scale.setScalar(0.2 + recede * 0.8);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Faint projected hologram reticle sitting behind the rings —
          see getPortalGridTexture: this is what actually reads as a
          "hologram" rather than just glowing rings. */}
      <sprite ref={gridRef} scale={[1.9, 1.9, 1]}>
        <spriteMaterial
          map={gridTexture}
          color="#bfefff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {/* Concentric spinning portal rings, each studded with small
          mechanical nodes (bolts/conduits) spaced around its own
          circumference — an unbroken glowing loop reads as a decal;
          discrete nodes riding the ring read as an actual constructed
          piece of hardware. */}
      {RING_CONFIGS.map((cfg, i) => (
        <group
          key={i}
          ref={(el) => {
            ringGroupRefs.current[i] = el;
          }}
        >
          <mesh
            ref={(el) => {
              ringMeshRefs.current[i] = el;
            }}
          >
            <torusGeometry args={[cfg.radius, cfg.tube, 8, 72]} />
            <meshBasicMaterial
              color={cfg.color}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
          {Array.from({ length: cfg.nodes }, (_, n) => {
            const angle = (n / cfg.nodes) * Math.PI * 2;
            const isMajor = n % 3 === 0;
            const size = cfg.tube * (isMajor ? 2.6 : 1.7);
            return (
              <mesh
                key={n}
                position={[Math.cos(angle) * cfg.radius, Math.sin(angle) * cfg.radius, 0]}
              >
                <boxGeometry args={[size, size, size]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.85}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  fog={false}
                  toneMapped={false}
                />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Faint chromatic-fringe ring just outside the outermost one. */}
      <mesh ref={fringeRef}>
        <torusGeometry args={[1.22, 0.01, 6, 64]} />
        <meshBasicMaterial
          color="#ff8fd8"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Bright scanning arc sweeping around the outermost ring. */}
      <mesh ref={sweepRef}>
        <torusGeometry args={[1.12, 0.024, 8, 48, Math.PI * 0.55]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Occasional energy arcs jumping between ring radii. */}
      {arcs.map((arc, i) => (
        <mesh
          key={i}
          ref={(el) => {
            arcRefs.current[i] = el;
          }}
        >
          <tubeGeometry args={[arc.curve, 16, 0.006, 4, false]} />
          <meshBasicMaterial
            color={arc.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Turbine/iris rotor near the core — the mechanism the light
          actually seems to come from, rather than light with nothing
          generating it. */}
      <group ref={irisGroupRef}>
        {blades.map((blade, i) => (
          <mesh
            key={i}
            ref={(el) => {
              bladeRefs.current[i] = el;
            }}
            position={[
              Math.cos(blade.angle) * BLADE_RADIUS * 0.55,
              Math.sin(blade.angle) * BLADE_RADIUS * 0.55,
              0,
            ]}
            rotation={[0, 0.5, blade.angle]}
          >
            <boxGeometry args={[blade.length, 0.045, 0.008]} />
            <meshBasicMaterial
              color="#dff4ff"
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

      {/* soft outer bloom */}
      <sprite ref={outerGlowRef} scale={[2.0, 2.0, 1]}>
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
      <sprite ref={innerGlowRef} scale={[1.0, 1.0, 1]}>
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

      {/* brilliant white energy core filling the portal's center */}
      <sprite ref={coreRef} scale={[0.5, 0.5, 1]}>
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
        <Sparkles count={isMobile ? 30 : 70} scale={2} size={2.5} speed={0.5} color="#cfeeff" />
      </group>
    </group>
  );
}
