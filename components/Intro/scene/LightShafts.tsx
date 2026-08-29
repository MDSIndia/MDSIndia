"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { keepClearOfCrossStreets } from "./crossStreetPositions";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const SHAFT_COLORS = ["#7fabf5", "#8fd6ff", "#a89bff", "#ffcf8a"];

/** Soft, wide additive cones rising from a scattered handful of
 * rooftops — searchlights/spotlights scattering in hazy night air,
 * the "volumetric light" cue the reference skyline leans on heavily.
 * A real volumetric shaft needs raymarched fog/shadow scattering,
 * which is out of reach for hundreds of fast-moving instances in a
 * real-time flythrough; a wide, soft-edged, upward-tapering cone with
 * a bright base and additive blending is the standard cheap stand-in
 * — it reads as "light cutting through haze" at a glance without the
 * actual physics. A slow independent drift/sway on each so they don't
 * all sit perfectly rigid. */
export function LightShafts({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 5 : 10;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const placements = useMemo(() => {
    const list: {
      x: number;
      z: number;
      baseY: number;
      height: number;
      radius: number;
      color: string;
      tilt: number;
      phase: number;
    }[] = [];
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = keepClearOfCrossStreets(20 - seeded(i, 601) * 140);
      const x = side * (13 + seeded(i, 602) * 10);
      const baseY = 14 + seeded(i, 603) * 24;
      list.push({
        x,
        z,
        baseY,
        height: 20 + seeded(i, 604) * 22,
        radius: 1.6 + seeded(i, 605) * 1.8,
        color: SHAFT_COLORS[i % SHAFT_COLORS.length],
        tilt: (seeded(i, 606) - 0.5) * 0.5,
        phase: seeded(i, 607) * Math.PI * 2,
      });
    }
    return list;
  }, [count]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const color = new THREE.Color();
    placements.forEach((p, i) => {
      dummy.position.set(p.x, p.baseY + p.height / 2, p.z);
      dummy.rotation.set(0, 0, p.tilt);
      dummy.scale.set(p.radius, p.height, p.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(p.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [placements, dummy]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    placements.forEach((p, i) => {
      const sway = Math.sin(t * 0.25 + p.phase) * 0.08;
      dummy.position.set(p.x, p.baseY + p.height / 2, p.z);
      dummy.rotation.set(0, 0, p.tilt + sway);
      dummy.scale.set(p.radius, p.height, p.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      {/* Wide at the base (bright source), tapering to a soft point —
          openEnded so there's no visible flat cap at either end. */}
      <coneGeometry args={[1, 1, 16, 1, true]} />
      <meshBasicMaterial
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
