"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  createAeroCarBodyGeometry,
  getCarPaintTexture,
  CAR_SHELL_HEIGHT,
  CABIN_HEIGHT,
  CABIN_Z_START,
  CABIN_Z_END,
} from "./carGeometry";
import { CAR_GLASS } from "./adImages";

useTexture.preload(CAR_GLASS);

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// The same premium, near-monochrome "car of the future" palette the
// moving traffic uses.
const CAR_COLORS = ["#eef1f3", "#15171b", "#7d838c", "#2a3550", "#3a3f45", "#5a6572"];

/** Small curbside parking bays tucked into the narrow strip between
 * the highway shoulder and the building line (the same corridor
 * BuildingBanners hangs its wall banners in) — a flat pull-in pad with
 * painted white stall stripes and two or three cars nose-in against
 * the curb. Purely static (no per-frame animation): unlike the moving
 * traffic in StreetCars, parked cars just need to sit there and read
 * as "somebody actually lives/works here," so this is one cheap
 * instanced layout pass with no useFrame at all. */
export function ParkingLot({ isMobile }: { isMobile: boolean }) {
  const lotCount = isMobile ? 7 : 14;
  const carsPerLot = 2;
  const carCount = lotCount * carsPerLot;

  const padRef = useRef<THREE.InstancedMesh>(null);
  const stripeRef = useRef<THREE.InstancedMesh>(null);
  const shellRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const wheelRef = useRef<THREE.InstancedMesh>(null);
  const rimRef = useRef<THREE.InstancedMesh>(null);
  const mirrorRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);

  const shellGeometry = useMemo(() => createAeroCarBodyGeometry(), []);
  const paintTexture = useMemo(() => getCarPaintTexture(), []);
  const glassTexture = useTexture(CAR_GLASS) as THREE.Texture;

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const padMatrices: THREE.Matrix4[] = [];
    const stripeMatrices: THREE.Matrix4[] = [];
    const shellMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];
    const bodyColors: THREE.Color[] = [];
    const wheelMatrices: THREE.Matrix4[] = [];
    const rimMatrices: THREE.Matrix4[] = [];
    const mirrorMatrices: THREE.Matrix4[] = [];
    const shadowMatrices: THREE.Matrix4[] = [];

    const stallWidth = 1.05;
    const bayDepth = 2.1;

    for (let i = 0; i < lotCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = 44 - seeded(i, 111) * 175;
      // Sits flush against the building line (x >= 11, see CityScape's
      // own x >= 11 invariant), just off the road shoulder.
      const bayX = side * (9.0 + seeded(i, 112) * 1.1);
      const bayWidth = stallWidth * carsPerLot + 0.3;

      dummy.position.set(bayX, 0.012, z);
      dummy.scale.set(bayDepth, bayWidth, 1);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      padMatrices.push(dummy.matrix.clone());

      // Painted stall-divider stripes — one more than the number of
      // cars, marking both outer edges plus the split between them.
      for (let s = 0; s <= carsPerLot; s++) {
        const stripeZ = z - bayWidth / 2 + s * stallWidth;
        dummy.position.set(bayX, 0.02, stripeZ);
        dummy.scale.set(bayDepth * 0.92, 0.05, 1);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        stripeMatrices.push(dummy.matrix.clone());
      }

      for (let c = 0; c < carsPerLot; c++) {
        const carIdx = i * carsPerLot + c;
        const carZ = z - bayWidth / 2 + stallWidth * (c + 0.5);
        // Nose-in against the curb: rotated 90° off the road heading
        // so the car faces the building rather than down the highway.
        const facing = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        const carX = bayX - side * 0.55;
        const length = 1.6 + seeded(carIdx, 113) * 0.3;
        const width = 0.8 + seeded(carIdx, 114) * 0.1;

        dummy.position.set(carX, CAR_SHELL_HEIGHT / 2, carZ);
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(width, CAR_SHELL_HEIGHT, length);
        dummy.updateMatrix();
        shellMatrices.push(dummy.matrix.clone());
        bodyColors.push(
          new THREE.Color(CAR_COLORS[Math.floor(seeded(carIdx, 115) * CAR_COLORS.length)])
        );

        // A real cabin box sitting on top of the tapered body — at
        // actual render distance a smoothly curved shell with no
        // silhouette break reads as a featureless blob, not a car; a
        // distinct raised box is what the eye actually recognizes as
        // a greenhouse even from far away.
        dummy.position.set(carX, CAR_SHELL_HEIGHT + CABIN_HEIGHT / 2, carZ);
        dummy.rotation.set(0, facing, 0);
        dummy.translateZ(((CABIN_Z_START + CABIN_Z_END) / 2) * length);
        dummy.scale.set(
          width * 0.72,
          CABIN_HEIGHT,
          (CABIN_Z_END - CABIN_Z_START) * length * 0.86
        );
        dummy.updateMatrix();
        canopyMatrices.push(dummy.matrix.clone());

        // Side mirrors — same "unmistakably a real car" cue StreetCars
        // uses, just built once here since these never move.
        dummy.position.set(carX, 0.4, carZ);
        dummy.rotation.set(0, facing, 0);
        dummy.translateX(width / 2 + 0.03);
        dummy.translateZ(length * 0.06);
        dummy.scale.set(0.12, 0.05, 0.07);
        dummy.updateMatrix();
        mirrorMatrices.push(dummy.matrix.clone());

        dummy.position.set(carX, 0.4, carZ);
        dummy.rotation.set(0, facing, 0);
        dummy.translateX(-(width / 2 + 0.03));
        dummy.translateZ(length * 0.06);
        dummy.scale.set(0.12, 0.05, 0.07);
        dummy.updateMatrix();
        mirrorMatrices.push(dummy.matrix.clone());

        const axleOff = length / 2 - 0.32;
        const trackOff = width / 2 + 0.02;
        [-1, 1].forEach((wx) => {
          [-1, 1].forEach((wz) => {
            dummy.position.set(carX + wz * axleOff, 0.2, carZ + wx * trackOff);
            dummy.rotation.set(0, 0, Math.PI / 2);
            dummy.scale.set(0.16, 0.14, 0.16);
            dummy.updateMatrix();
            wheelMatrices.push(dummy.matrix.clone());

            // Hubcap/rim, same treatment as StreetCars' moving traffic.
            dummy.position.set(
              carX + wz * axleOff,
              0.2,
              carZ + wx * (trackOff + 0.065)
            );
            dummy.scale.set(0.14, 0.02, 0.14);
            dummy.updateMatrix();
            rimMatrices.push(dummy.matrix.clone());
          });
        });

        // Ground contact shadow beneath each parked car.
        dummy.position.set(carX, 0.014, carZ);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(length * 1.15, width * 1.3, 1);
        dummy.updateMatrix();
        shadowMatrices.push(dummy.matrix.clone());
      }
    }

    return {
      padMatrices,
      stripeMatrices,
      shellMatrices,
      canopyMatrices,
      bodyColors,
      wheelMatrices,
      rimMatrices,
      mirrorMatrices,
      shadowMatrices,
    };
  }, [lotCount, carCount]);

  const applyInstances = (
    mesh: THREE.InstancedMesh | null,
    matrices: THREE.Matrix4[],
    colors?: THREE.Color[]
  ) => {
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    colors?.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => applyInstances(padRef.current, data.padMatrices), [data]);
  useLayoutEffect(() => applyInstances(stripeRef.current, data.stripeMatrices), [data]);
  useLayoutEffect(
    () => applyInstances(shellRef.current, data.shellMatrices, data.bodyColors),
    [data]
  );
  useLayoutEffect(() => applyInstances(canopyRef.current, data.canopyMatrices), [data]);
  useLayoutEffect(() => applyInstances(wheelRef.current, data.wheelMatrices), [data]);
  useLayoutEffect(() => applyInstances(rimRef.current, data.rimMatrices), [data]);
  useLayoutEffect(() => applyInstances(mirrorRef.current, data.mirrorMatrices), [data]);
  useLayoutEffect(() => applyInstances(shadowRef.current, data.shadowMatrices), [data]);

  return (
    <group>
      <instancedMesh ref={padRef} args={[undefined, undefined, lotCount]}>
        <planeGeometry args={[1, 1]} />
        <meshLambertMaterial color="#232428" fog />
      </instancedMesh>

      <instancedMesh ref={stripeRef} args={[undefined, undefined, lotCount * (carsPerLot + 1)]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#d8d8d2" transparent opacity={0.55} fog={false} />
      </instancedMesh>

      {/* Phong rather than flat Lambert — a real painted body throws
          back a soft specular highlight, which reads as glossy
          automotive paint instead of matte plastic. */}
      <instancedMesh ref={shellRef} args={[shellGeometry, undefined, carCount]}>
        <meshPhongMaterial map={paintTexture} specular="#3a4048" shininess={42} fog />
      </instancedMesh>

      {/* Cabin windows — a real SVG glass/frame texture (see
          car-glass.svg) rather than a flat painted color. */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, carCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial map={glassTexture} specular="#3a4550" shininess={80} fog />
      </instancedMesh>

      {/* Phong rather than flat unlit basic — matches StreetCars' own
          fix: an unlit black cylinder is one flat silhouette regardless
          of angle, reading as a hole rather than a tire. */}
      <instancedMesh ref={wheelRef} args={[undefined, undefined, carCount * 4]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshPhongMaterial color="#1c1e22" specular="#3a3d42" shininess={16} fog={false} />
      </instancedMesh>

      {/* Aero wheel cover — matches StreetCars' moving traffic. */}
      <instancedMesh ref={rimRef} args={[undefined, undefined, carCount * 4]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshPhongMaterial color="#8a8f96" specular="#cfd4da" shininess={70} fog={false} />
      </instancedMesh>

      <instancedMesh ref={mirrorRef} args={[undefined, undefined, carCount * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#0e1114" specular="#2a3038" shininess={50} fog={false} />
      </instancedMesh>

      <instancedMesh ref={shadowRef} args={[undefined, undefined, carCount]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial
          color="#3a4048"
          transparent
          opacity={0.55}
          blending={THREE.MultiplyBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
