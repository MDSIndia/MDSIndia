"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  createAeroCarBodyGeometry,
  createCarCabinGeometry,
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
// main highway traffic uses.
// Pearl white weighted up (appears 3x) at explicit "use this type of
// car" reference — see StreetCars' own copy of this comment for why.
const CAR_COLORS = ["#eef1f3", "#eef1f3", "#eef1f3", "#c9cdd3", "#7d838c", "#3a4568", "#5a6270", "#8b93a0"];
// Segments making up the glowing side line — see the layout comment
// below for why a single straight bar became a swept multi-segment
// curve at explicit "use this type of car" reference.
const SIDE_LINE_SEGMENTS = 5;
const SIDE_LINE_FLARE = 0.06;

interface CurbCar {
  laneX: number;
  dir: 1 | -1;
  speed: number;
  z: number;
  length: number;
  width: number;
  colorIndex: number;
  wheelSpin: number;
}

/** A slow curb-lane of local traffic tucked into the narrow strip
 * between the highway shoulder and the building line (the same
 * corridor BuildingBanners hangs its wall banners in) — loading-zone
 * pavement markings with cars actually easing along them, rather than
 * the permanently parked, never-moving cars this used to be. Every
 * vehicle in the scene now moves; a car frozen mid-frame next to
 * moving highway traffic was reading as broken rather than "parked". */
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
  const sideLineRef = useRef<THREE.InstancedMesh>(null);
  const markerRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);

  const shellGeometry = useMemo(() => createAeroCarBodyGeometry(), []);
  const cabinGeometry = useMemo(() => createCarCabinGeometry(), []);
  const paintTexture = useMemo(() => getCarPaintTexture(), []);
  const glassTexture = useTexture(CAR_GLASS) as THREE.Texture;

  // The loading-zone pad/stripe markings on the pavement — purely
  // static ground decoration, independent of the cars now moving
  // through the lane above them.
  const groundData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const padMatrices: THREE.Matrix4[] = [];
    const stripeMatrices: THREE.Matrix4[] = [];
    const stallWidth = 1.05;
    const bayDepth = 2.1;

    for (let i = 0; i < lotCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = 44 - seeded(i, 111) * 175;
      const bayX = side * (9.0 + seeded(i, 112) * 1.1);
      const bayWidth = stallWidth * carsPerLot + 0.3;

      dummy.position.set(bayX, 0.012, z);
      dummy.scale.set(bayDepth, bayWidth, 1);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      padMatrices.push(dummy.matrix.clone());

      for (let s = 0; s <= carsPerLot; s++) {
        const stripeZ = z - bayWidth / 2 + s * stallWidth;
        dummy.position.set(bayX, 0.02, stripeZ);
        dummy.scale.set(bayDepth * 0.92, 0.05, 1);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        stripeMatrices.push(dummy.matrix.clone());
      }
    }

    return { padMatrices, stripeMatrices };
  }, [lotCount]);

  const bodyColors = useMemo(
    () => Array.from({ length: carCount }, () => new THREE.Color()),
    [carCount]
  );

  // One slow-moving car per former "parking stall" — same curb-hugging
  // x band as the old static bays, now actually driving along it
  // (forward-facing, in the direction its own side of the road
  // travels) rather than nosed in perpendicular against the curb.
  const cars = useRef<CurbCar[]>([]);
  if (cars.current.length === 0) {
    cars.current = Array.from({ length: carCount }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      return {
        laneX: side * (9.0 + seeded(i, 112) * 1.1),
        dir: side as 1 | -1,
        // Deliberately slower than the main highway traffic (StreetCars,
        // 6-11) — a curb lane reads as local/service traffic easing
        // along, not racing down the highway.
        speed: 1.6 + seeded(i, 116) * 1.8,
        z: 44 - seeded(i, 111) * 175,
        // Sized up ~50%, matching StreetCars'/FlyingCars' own pass, at
        // explicit "cars look so small, make them big" request.
        length: 2.4 + seeded(i, 113) * 0.3,
        width: 1.08 + seeded(i, 114) * 0.12,
        colorIndex: Math.floor(seeded(i, 115) * CAR_COLORS.length),
        wheelSpin: seeded(i, 117) * Math.PI * 2,
      };
    });
  }

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

  useLayoutEffect(() => applyInstances(padRef.current, groundData.padMatrices), [groundData]);
  useLayoutEffect(
    () => applyInstances(stripeRef.current, groundData.stripeMatrices),
    [groundData]
  );

  const layout = () => {
    const dummy = new THREE.Object3D();
    const shellMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];
    const wheelMatrices: THREE.Matrix4[] = [];
    const rimMatrices: THREE.Matrix4[] = [];
    const mirrorMatrices: THREE.Matrix4[] = [];
    const sideLineMatrices: THREE.Matrix4[] = [];
    const markerMatrices: THREE.Matrix4[] = [];
    const shadowMatrices: THREE.Matrix4[] = [];

    cars.current.forEach((car, i) => {
      const facing = car.dir < 0 ? 0 : Math.PI;
      const backZ = car.z + (car.dir < 0 ? car.length / 2 : -car.length / 2);

      dummy.position.set(car.laneX, CAR_SHELL_HEIGHT / 2, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width, CAR_SHELL_HEIGHT, car.length);
      dummy.updateMatrix();
      shellMatrices.push(dummy.matrix.clone());
      bodyColors[i]?.set(CAR_COLORS[car.colorIndex]);

      dummy.position.set(car.laneX, CAR_SHELL_HEIGHT + CABIN_HEIGHT / 2, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.translateZ(((CABIN_Z_START + CABIN_Z_END) / 2) * car.length);
      // Widened 0.72 -> 0.85 at explicit "use this type of car"
      // reference — a huge, near-full-width panoramic glass canopy
      // rather than a narrower greenhouse with visible bodywork on
      // either side.
      dummy.scale.set(
        car.width * 0.85,
        CABIN_HEIGHT,
        (CABIN_Z_END - CABIN_Z_START) * car.length * 0.86
      );
      dummy.updateMatrix();
      canopyMatrices.push(dummy.matrix.clone());

      // Glowing side character line — see StreetCars' own copy of this
      // for why (the one design cue every reference concept car
      // shared), extended here so parked cars match moving traffic
      // instead of looking like a plainer variant. Built from several
      // segments along a shallow parabola (low across the door/rocker,
      // sweeping up into the fender flares at each end) rather than one
      // straight bar, at explicit "use this type of car" reference.
      const lineSpan = car.length * 0.8;
      [-1, 1].forEach((wx) => {
        for (let k = 0; k < SIDE_LINE_SEGMENTS; k++) {
          const segT = k / (SIDE_LINE_SEGMENTS - 1);
          const segZ = car.z + (segT - 0.5) * lineSpan;
          const segH = SIDE_LINE_FLARE * (2 * segT - 1) ** 2;
          dummy.position.set(car.laneX, CAR_SHELL_HEIGHT * 0.42 + segH, segZ);
          dummy.rotation.set(0, facing, 0);
          dummy.translateX(wx * (car.width / 2 + 0.012));
          dummy.scale.set(0.018, 0.028, (lineSpan / SIDE_LINE_SEGMENTS) * 1.2);
          dummy.updateMatrix();
          sideLineMatrices.push(dummy.matrix.clone());
        }
      });

      [-1, 1].forEach((wx) => {
        dummy.position.set(car.laneX + wx * (car.width / 2 + 0.03), 0.4, car.z);
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(0.12, 0.05, 0.07);
        dummy.updateMatrix();
        mirrorMatrices.push(dummy.matrix.clone());
      });

      const axleOff = car.length / 2 - 0.32;
      const trackOff = car.width / 2 + 0.02;
      [-1, 1].forEach((wx) => {
        [-1, 1].forEach((wz) => {
          dummy.position.set(car.laneX + wx * trackOff, 0.2, car.z + wz * axleOff);
          dummy.rotation.set(car.wheelSpin, 0, Math.PI / 2);
          dummy.scale.set(0.16, 0.14, 0.16);
          dummy.updateMatrix();
          wheelMatrices.push(dummy.matrix.clone());

          dummy.position.set(
            car.laneX + wx * (trackOff + 0.065),
            0.2,
            car.z + wz * axleOff
          );
          dummy.rotation.set(0, 0, Math.PI / 2);
          dummy.scale.set(0.14, 0.02, 0.14);
          dummy.updateMatrix();
          rimMatrices.push(dummy.matrix.clone());
        });
      });

      // Tail-light glow rather than the old dim "parked courtesy light"
      // — this car is actually driving now, so it gets the same kind
      // of active light StreetCars' own traffic shows.
      dummy.position.set(car.laneX, 0.22, backZ);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width * 0.62, 0.035, 0.025);
      dummy.updateMatrix();
      markerMatrices.push(dummy.matrix.clone());

      dummy.position.set(car.laneX, 0.014, car.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(car.width * 1.3, car.length * 1.15, 1);
      dummy.updateMatrix();
      shadowMatrices.push(dummy.matrix.clone());
    });

    applyInstances(shellRef.current, shellMatrices, bodyColors);
    applyInstances(canopyRef.current, canopyMatrices);
    applyInstances(wheelRef.current, wheelMatrices);
    applyInstances(rimRef.current, rimMatrices);
    applyInstances(mirrorRef.current, mirrorMatrices);
    applyInstances(sideLineRef.current, sideLineMatrices);
    applyInstances(markerRef.current, markerMatrices);
    applyInstances(shadowRef.current, shadowMatrices);
  };

  useLayoutEffect(layout, []);

  useFrame((state, delta) => {
    const camZ = state.camera.position.z;
    cars.current.forEach((car, i) => {
      car.z += car.dir * car.speed * delta;
      car.wheelSpin += (car.dir * car.speed * delta) / 0.16;
      if (car.z > camZ + 6) {
        car.z = camZ - 60 - seeded(i + Math.floor(state.clock.elapsedTime), 118) * 90;
      }
    });
    layout();
  });

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
        <primitive object={cabinGeometry} attach="geometry" />
        <meshPhongMaterial map={glassTexture} specular="#3a4550" shininess={80} fog />
      </instancedMesh>

      <instancedMesh ref={wheelRef} args={[undefined, undefined, carCount * 4]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshPhongMaterial color="#1c1e22" specular="#3a3d42" shininess={16} fog={false} />
      </instancedMesh>

      <instancedMesh ref={rimRef} args={[undefined, undefined, carCount * 4]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshPhongMaterial color="#8a8f96" specular="#cfd4da" shininess={70} fog={false} />
      </instancedMesh>

      <instancedMesh ref={mirrorRef} args={[undefined, undefined, carCount * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#0e1114" specular="#2a3038" shininess={50} fog={false} />
      </instancedMesh>

      {/* Glowing side character line — see StreetCars' own copy of this
          for why. */}
      <instancedMesh ref={sideLineRef} args={[undefined, undefined, carCount * 2 * SIDE_LINE_SEGMENTS]}>
        <boxGeometry args={[1, 1, 1]} />
        {/* Shifted from blue-cyan (#6fd6ff) to teal (#4fe8c8) at
            explicit "use this type of car" reference — see StreetCars'
            own copy of this comment for why. */}
        <meshBasicMaterial
          color="#4fe8c8"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={markerRef} args={[undefined, undefined, carCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ff2a2a"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
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
