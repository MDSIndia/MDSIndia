"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { INTRO_DURATION, clamp01, windowProgress } from "./timeline";
import { createFlightCurve, flightU } from "./path";

// How long the camera keeps gently coasting forward once the flight
// path itself ends — decoupled from the CSS hand-off's exact duration,
// just needs to comfortably span the light-dissolve.
const COAST_SECONDS = 1.6;

/** Drives the camera along the flight path, pushing FOV for a sense of
 * speed, then into a final punch-in as the star engulfs the frame —
 * fog brightens through cyan into near-white on approach. Once the
 * path itself ends, the camera doesn't freeze: it keeps drifting
 * forward along the same heading at a steadily decaying speed, so the
 * shot is still gently moving throughout the light-dissolve hand-off
 * rather than holding on a static frame.
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

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const u = flightU(t);
    const uLook = Math.min(1, u + 0.035);

    camera.position.copy(curve.getPointAt(u));
    const lookPos = curve.getPointAt(uLook);

    // Gentle decelerating coast past the end of the path, so the
    // camera is still softly moving forward through the whole
    // light-dissolve instead of stopping dead at u = 1.
    const coastT = clamp01((t - INTRO_DURATION) / COAST_SECONDS);
    if (coastT > 0) {
      curve.getTangentAt(1, tangent).normalize();
      const coastEase = 1 - (1 - coastT) * (1 - coastT);
      const coastDistance = coastEase * 3.2;
      camera.position.addScaledVector(tangent, coastDistance);
      lookPos.addScaledVector(tangent, coastDistance);
    }

    camera.up.set(0, 1, 0);
    camera.lookAt(lookPos);

    if (camera instanceof THREE.PerspectiveCamera) {
      const speedPush = windowProgress(t, 1.6, 4.6) * 16;
      const finalPush = windowProgress(t, 4.6, 5.7) * 10;
      const engulfPunch = windowProgress(t, 5.7, 6.2) * 14;
      camera.fov = baseFov + speedPush + finalPush - engulfPunch;
      camera.updateProjectionMatrix();
    }

    const establishFog = 1 - windowProgress(t, 0, 1.7);
    const portalApproach = windowProgress(t, 4.4, 5.8);
    const engulf = windowProgress(t, 5.7, 6.2);

    fog.density =
      0.16 * establishFog + 0.012 + portalApproach * 0.05 + engulf * 0.22;
    fog.color.copy(baseColor).lerp(portalColor, portalApproach).lerp(engulfColor, engulf);
    scene.fog = fog;
  });

  return null;
}
