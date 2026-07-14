"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { INTRO_DURATION, clamp01, windowProgress } from "./timeline";
import { createFlightCurve, flightU } from "./path";

// How long the camera keeps gently coasting forward once the flight
// path itself ends — decoupled from the CSS hand-off's exact duration,
// just needs to comfortably span the light-dissolve.
const COAST_SECONDS = 1.6;

// Exponential-smoothing time constant for the tiny inertia added on
// top of the exact curve position — small enough (50ms) that it never
// visibly lags the path, it just rounds off a mathematically-exact
// per-frame snap into something that feels like a physical rig with a
// touch of momentum rather than a value teleporting to a formula.
const POSITION_SMOOTHING_TAU = 0.05;
// The look-at target gets its own, slightly looser time constant —
// a camera operator's attention trails the subject a touch more than
// the rig's own body does, which is what actually reads as "someone
// is flying this" rather than a subject glued dead-center in frame.
const LOOK_SMOOTHING_TAU = 0.09;

/** Drives the camera along the flight path — the path/waypoints and
 * overall timing are untouched — while adding the *feel* of a
 * professional cinematic drone on top of it: light positional inertia,
 * banking derived from the path's own curvature (not scripted), and a
 * tiny speed-scaled shake. Also pushes FOV for a sense of speed, then
 * into a final punch-in as the star engulfs the frame — fog brightens
 * through cyan into near-white on approach. Once the path itself ends,
 * the camera doesn't freeze: it keeps drifting forward along the same
 * heading at a steadily decaying speed, so the shot is still gently
 * moving throughout the light-dissolve hand-off.
 *
 * Base FOV is wider on mobile: a portrait viewport's aspect ratio is
 * much narrower than desktop, so the same vertical FOV yields a far
 * narrower *horizontal* FOV — narrow enough that the skyline flanking
 * the road fell entirely outside the frustum on phones. */
export function CameraRig({ isMobile }: { isMobile: boolean }) {
  const { camera, scene } = useThree();
  const baseFov = isMobile ? 64 : 46;
  const curve = useMemo(() => createFlightCurve(), []);
  const fog = useMemo(() => new THREE.FogExp2("#020208", 0.05), []);
  const baseColor = useMemo(() => new THREE.Color("#020208"), []);
  const portalColor = useMemo(() => new THREE.Color("#7fd8ff"), []);
  const engulfColor = useMemo(() => new THREE.Color("#f4fbff"), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const tangentAhead = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const smoothedPos = useRef<THREE.Vector3 | null>(null);
  const smoothedLook = useRef<THREE.Vector3 | null>(null);
  const smoothedBank = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const u = flightU(t);
    const uLook = Math.min(1, u + 0.035);

    targetPos.copy(curve.getPointAt(u));
    const lookPos = curve.getPointAt(uLook);

    // Gentle decelerating coast past the end of the path, so the
    // camera is still softly moving forward through the whole
    // light-dissolve instead of stopping dead at u = 1.
    const coastT = clamp01((t - INTRO_DURATION) / COAST_SECONDS);
    if (coastT > 0) {
      curve.getTangentAt(1, tangent).normalize();
      const coastEase = 1 - (1 - coastT) * (1 - coastT);
      const coastDistance = coastEase * 3.2;
      targetPos.addScaledVector(tangent, coastDistance);
      lookPos.addScaledVector(tangent, coastDistance);
    }

    // Tiny positional inertia on top of the exact curve position.
    if (!smoothedPos.current) smoothedPos.current = targetPos.clone();
    const posLerp = 1 - Math.exp(-delta / POSITION_SMOOTHING_TAU);
    smoothedPos.current.lerp(targetPos, posLerp);

    // Tiny speed-scaled shake — three weighted, incommensurate
    // frequencies per axis (rather than one clean sine pair) so it
    // reads as organic turbulence, not a metronome vibration, plus a
    // slow envelope so the amount of shake itself drifts a little
    // instead of holding at one constant intensity.
    const speedAmount = clamp01(
      windowProgress(t, 2.6, 6.6) + windowProgress(t, 6.3, 8.0) * 0.6
    );
    const shakeEnvelope = 0.75 + 0.25 * Math.sin(t * 0.9 + 5.2);
    const shakeAmp = speedAmount * 0.03 * shakeEnvelope;
    const shakeX =
      (Math.sin(t * 34.7) * 0.5 +
        Math.sin(t * 58.3 + 1.7) * 0.3 +
        Math.sin(t * 13.1 + 4.2) * 0.2) *
      shakeAmp;
    const shakeY =
      (Math.sin(t * 41.3 + 2.1) * 0.5 +
        Math.sin(t * 22.9 + 0.6) * 0.3 +
        Math.sin(t * 67.1 + 3.8) * 0.2) *
      shakeAmp;

    camera.position.copy(smoothedPos.current);
    camera.position.x += shakeX;
    camera.position.y += shakeY;

    // Subtle curvature-derived banking: the roll comes from how the
    // path's own tangent is turning right now (a drone's natural
    // response), not from a scripted turn window — so it stays near
    // zero on the straights and only leans wherever the existing
    // curve actually bends.
    curve.getTangentAt(u, tangent);
    curve.getTangentAt(Math.min(1, u + 0.02), tangentAhead);
    const turn = tangent.x * tangentAhead.z - tangent.z * tangentAhead.x;
    const targetBank = THREE.MathUtils.clamp(-turn * 18, -0.09, 0.09);
    smoothedBank.current = THREE.MathUtils.lerp(
      smoothedBank.current,
      targetBank,
      clamp01(delta * 4)
    );

    camera.up.set(Math.sin(smoothedBank.current), Math.cos(smoothedBank.current), 0);

    // The look-at target gets its own, slightly looser smoothing than
    // the rig's position — an operator's attention trailing the
    // subject a touch, rather than the frame staying mathematically
    // perfectly centered every instant.
    if (!smoothedLook.current) smoothedLook.current = lookPos.clone();
    const lookLerp = 1 - Math.exp(-delta / LOOK_SMOOTHING_TAU);
    smoothedLook.current.lerp(lookPos, lookLerp);
    camera.lookAt(smoothedLook.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const speedPush = windowProgress(t, 2.6, 6.6) * 20;
      const finalPush = windowProgress(t, 7.1, 8.5) * 13;
      const engulfPunch = windowProgress(t, 8.5, INTRO_DURATION) * 14;
      camera.fov = baseFov + speedPush + finalPush - engulfPunch;
      camera.updateProjectionMatrix();
    }

    const establishFog = 1 - windowProgress(t, 0, 2.4);
    const portalApproach = windowProgress(t, 7.2, 8.6);
    const engulf = windowProgress(t, 8.5, INTRO_DURATION);

    fog.density =
      0.16 * establishFog + 0.012 + portalApproach * 0.05 + engulf * 0.22;
    fog.color.copy(baseColor).lerp(portalColor, portalApproach).lerp(engulfColor, engulf);
    scene.fog = fog;
  });

  return null;
}
