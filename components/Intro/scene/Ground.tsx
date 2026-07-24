"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** A wide dark ground plane beneath the whole city corridor. Without
 * it, everything outside the narrow 16-unit road — which is every
 * building, since they all sit at x >= 11 — has nothing physically
 * connecting it to the street; the skyline reads as floating rather
 * than standing on anything. A single cheap plane fixes that for the
 * whole scene at once, lit by the same rig light as the buildings so
 * it picks up a soft gradient across it rather than sitting as a flat,
 * disconnected color underneath everything. */
export function Ground() {
  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: "#050912",
        fog: true,
      }),
    []
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -30]} material={material}>
      <planeGeometry args={[260, 260]} />
    </mesh>
  );
}
