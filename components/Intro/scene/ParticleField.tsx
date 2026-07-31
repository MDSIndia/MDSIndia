"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { windowProgress } from "./timeline";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const AMBIENT_COUNT_DESKTOP = 200;
const AMBIENT_COUNT_MOBILE = 90;
const STREAK_COUNT_DESKTOP = 90;
const STREAK_COUNT_MOBILE = 40;

type StreakState = { z: number; x: number; y: number; len: number };

/** Two particle systems: a slow ambient drift that establishes the void
 * (Scene 1), and a tunnel of streaking energy lines whose speed and
 * length ramp up as the flight accelerates toward warp speed. */
export function ParticleField({ isMobile }: { isMobile: boolean }) {
  const ambientCount = isMobile ? AMBIENT_COUNT_MOBILE : AMBIENT_COUNT_DESKTOP;
  const streakCount = isMobile ? STREAK_COUNT_MOBILE : STREAK_COUNT_DESKTOP;

  const ambientRef = useRef<THREE.Points>(null);
  const streaksRef = useRef<THREE.InstancedMesh>(null);
  const streakState = useRef<StreakState[]>([]);

  const ambientGeo = useMemo(() => {
    const positions = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      positions[i * 3] = (seeded(i, 1) - 0.5) * 42;
      positions[i * 3 + 1] = seeded(i, 2) * 22;
      positions[i * 3 + 2] = 46 - seeded(i, 3) * 110;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [ambientCount]);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const ambientMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.14,
        color: "#7fe3ff",
        transparent: true,
        opacity: 0,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: circleTexture,
        alphaMap: circleTexture,
        alphaTest: 0.05,
      }),
    [circleTexture]
  );

  const streakMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#00d4ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useLayoutEffect(() => {
    streakState.current = Array.from({ length: streakCount }, (_, i) => ({
      z: 46 - seeded(i, 4) * 110,
      x: (seeded(i, 5) - 0.5) * 16,
      y: seeded(i, 6) * 8,
      len: 1.4 + seeded(i, 7) * 3.2,
    }));
    const mesh = streaksRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    streakState.current.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.set(1, 1, s.len);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [streakCount]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    ambientMaterial.opacity = windowProgress(t, 0, 2.0) * 0.55;
    if (ambientRef.current) ambientRef.current.rotation.y += delta * 0.01;

    // Peak streak speed and stretch are both raised beyond the old
    // values — longer, faster-flying particles are one of the clearest
    // "warp speed" cues, independent of the camera's own translation.
    const speed = windowProgress(t, 2.6, 8.0) * (isMobile ? 58 : 86);
    streakMaterial.opacity = windowProgress(t, 2.8, 4.4) * 0.85;

    const mesh = streaksRef.current;
    if (mesh && speed > 0) {
      const dummy = new THREE.Object3D();
      const camZ = state.camera.position.z;
      const stretch = 1 + windowProgress(t, 4.4, 8.0) * 3.0;
      streakState.current.forEach((s, i) => {
        s.z += speed * delta;
        if (s.z > camZ + 6) {
          s.z = camZ - 90 - seeded(i, 9) * 30;
          s.x = (seeded(i + 1, 5) - 0.5) * 16;
          s.y = seeded(i + 1, 6) * 8;
        }
        dummy.position.set(s.x, s.y, s.z);
        dummy.scale.set(1, 1, s.len * stretch);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={ambientRef} geometry={ambientGeo} material={ambientMaterial} />
      <instancedMesh
        ref={streaksRef}
        args={[undefined, undefined, streakCount]}
        material={streakMaterial}
      >
        <boxGeometry args={[0.035, 0.035, 1]} />
      </instancedMesh>
    </group>
  );
}
