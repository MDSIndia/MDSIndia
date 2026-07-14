"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";
import { createFlightCurve, flightU } from "./path";
import { Character, type RiderMotionState } from "./Character";

/** The rider — a real rigged human character (see Character.tsx)
 * hovering just above the road on plasma-trailed shoes, tracking
 * slightly ahead of the camera along the same flight curve.
 *
 * This component owns only the rider's *placement in the world*: the
 * flight-curve position, hover bob, lateral weave, speed-driven lean
 * and roll, and the fade-in/scale-in on first appearance — exactly as
 * before. What's actually inside that transform (character mesh, pose,
 * shoe VFX) is Character.tsx's concern. Timing/placement values are
 * handed off via a plain ref (not React props/state) since they update
 * every animation frame and must never trigger a React re-render. */
export function RiderTrail() {
  const groupRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => createFlightCurve(), []);
  const motionRef = useRef<RiderMotionState>({
    appear: 0,
    speedFactor: 0,
    finalPush: 0,
  });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const appear = windowProgress(t, 2.6, 3.4);
    const group = groupRef.current;
    if (!group) return;

    const u = Math.min(1, flightU(t) + 0.065);
    const p = curve.getPointAt(u);
    // Two overlapping sine waves rather than one — a real hover never
    // repeats on a single clean period, so this reads as floating
    // instead of a metronome bob. Always well clear of the road.
    const hover =
      0.68 + Math.sin(t * 6.5) * 0.06 + Math.sin(t * 4.15 + 1.3) * 0.035;
    // Tiny lateral weave, same idea — a body drifting slightly rather
    // than being pinned to a rail.
    const weave = Math.sin(t * 1.9 + 0.4) * 0.03 + Math.sin(t * 13.2) * 0.008;

    group.position.set(p.x + weave, hover, p.z);

    // Forward lean and a light balancing roll that both grow with
    // speed — an aerodynamic glide rather than a stiff upright pose.
    // Each is a sum of two frequencies so the motion doesn't read as
    // a single scripted oscillation.
    const speedFactor =
      windowProgress(t, 2.6, 6.6) * 0.6 + windowProgress(t, 6.3, 8.0) * 0.4;
    group.rotation.x =
      -0.1 - speedFactor * 0.22 + Math.sin(t * 3.7 + 0.9) * 0.015;
    group.rotation.z =
      Math.sin(t * 2.1) * 0.035 * (0.4 + speedFactor) +
      Math.sin(t * 5.3 + 2.1) * 0.012;
    group.rotation.y =
      Math.PI + Math.sin(t * 1.7 + 0.2) * 0.045 + Math.sin(t * 3.9) * 0.018;

    group.visible = appear > 0.01;
    group.scale.setScalar(0.7 + appear * 0.3);

    // Shoes emit maximum power on the final run into the star.
    const finalPush = windowProgress(t, 6.3, 8.0);

    motionRef.current.appear = appear;
    motionRef.current.speedFactor = speedFactor;
    motionRef.current.finalPush = finalPush;
  });

  return (
    <group ref={groupRef} visible={false}>
      <Character wrapperRef={groupRef} motionRef={motionRef} />
    </group>
  );
}
