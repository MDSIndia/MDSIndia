"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

// A premium, near-monochrome palette (pearl, silver, gunmetal,
// titanium, deep blue) rather than an ordinary-sedan color mix — cars
// that look like they belong in the same "future" as the skyline
// around them. Skewed lighter than a first pass (that one leaned 5:1
// toward near-black tones): against unlit black asphalt at night, a
// mostly-dark palette left most cars reading as flat dark silhouettes
// with no visible form, rather than distinct painted vehicles — these
// still read as premium/monochrome, just bright enough to actually
// catch the rig light and the paint gradient's own highlight.
const CAR_COLORS = ["#eef1f3", "#c9cdd3", "#7d838c", "#3a4568", "#5a6270", "#8b93a0"];

const WHEEL_RADIUS = 0.16;
// How many fading segments make up one car's light trail — a real
// motion-blur streak rather than a single semi-transparent smear, and
// cheap enough (a handful of extra instanced boxes per car) not to
// worry about relative to everything else already instanced here.
const TRAIL_SEGMENTS = 5;

interface CarState {
  laneX: number;
  dir: 1 | -1;
  speed: number;
  z: number;
  length: number;
  width: number;
  colorIndex: number;
  wheelSpin: number;
}

/** Ordinary ground traffic on the highway itself, alongside the
 * hovering FlyingCars above it — two lanes heading the same direction
 * as the camera (which gradually overtakes them, the way a faster car
 * passes slower traffic) and two oncoming lanes that sweep past in the
 * opposite direction. Each car is one continuous aerodynamic shell
 * (see carGeometry) rather than a box body with a separate box cabin
 * stacked on top, plus wheels, mirrors, and a full-width light bar —
 * cheap instanced primitives, but shaped like a concept vehicle instead
 * of a stack of bricks. Cars that fall behind the camera are recycled
 * further down the road, the same wraparound trick ParticleField/
 * FlyingCars use, so a small fixed count reads as continuous traffic
 * across the flight. */
export function StreetCars({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 10 : 18;
  const wheelCount = count * 4;
  const pairCount = count * 2; // mirrors come in L/R pairs

  const shellRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const wheelRef = useRef<THREE.InstancedMesh>(null);
  const rimRef = useRef<THREE.InstancedMesh>(null);
  const mirrorRef = useRef<THREE.InstancedMesh>(null);
  const headlightRef = useRef<THREE.InstancedMesh>(null);
  const taillightRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);
  const reflectionRef = useRef<THREE.InstancedMesh>(null);

  const shellGeometry = useMemo(() => createAeroCarBodyGeometry(), []);
  const paintTexture = useMemo(() => getCarPaintTexture(), []);
  const glassTexture = useTexture(CAR_GLASS) as THREE.Texture;
  const LANES = useMemo(() => [-3.4, -1.5, 1.5, 3.4] as const, []);
  const bodyColors = useMemo(
    () => Array.from({ length: count }, () => new THREE.Color()),
    [count]
  );
  const trailColors = useMemo(
    () => Array.from({ length: count * TRAIL_SEGMENTS }, () => new THREE.Color()),
    [count]
  );
  // Two per car — a warm headlight pool and a red taillight pool, the
  // "wet road catching light" cue real night traffic footage always
  // has, matching the reference's own "Realistic Reflections" callout.
  const reflectionColors = useMemo(
    () => Array.from({ length: count * 2 }, () => new THREE.Color()),
    [count]
  );

  const cars = useRef<CarState[]>([]);
  if (cars.current.length === 0) {
    cars.current = Array.from({ length: count }, (_, i) => {
      const laneIndex = i % LANES.length;
      const laneX = LANES[laneIndex];
      const dir: 1 | -1 = laneX < 0 ? -1 : 1;
      return {
        laneX,
        dir,
        speed: 6 + seeded(i, 81) * 5,
        z: 40 - seeded(i, 82) * 170,
        length: 1.5 + seeded(i, 83) * 0.5,
        width: 0.78 + seeded(i, 84) * 0.14,
        colorIndex: Math.floor(seeded(i, 85) * CAR_COLORS.length),
        wheelSpin: seeded(i, 87) * Math.PI * 2,
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

  const layout = () => {
    const dummy = new THREE.Object3D();
    const shellMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];
    const wheelMatrices: THREE.Matrix4[] = [];
    const rimMatrices: THREE.Matrix4[] = [];
    const mirrorMatrices: THREE.Matrix4[] = [];
    const headlightMatrices: THREE.Matrix4[] = [];
    const taillightMatrices: THREE.Matrix4[] = [];
    const trailMatrices: THREE.Matrix4[] = [];
    const shadowMatrices: THREE.Matrix4[] = [];
    const reflectionMatrices: THREE.Matrix4[] = [];

    cars.current.forEach((car, i) => {
      const facing = car.dir < 0 ? 0 : Math.PI;
      const frontZ = car.z + (car.dir < 0 ? -car.length / 2 : car.length / 2);
      const backZ = car.z + (car.dir < 0 ? car.length / 2 : -car.length / 2);

      dummy.position.set(car.laneX, CAR_SHELL_HEIGHT / 2, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width, CAR_SHELL_HEIGHT, car.length);
      dummy.updateMatrix();
      shellMatrices.push(dummy.matrix.clone());
      bodyColors[i]?.set(CAR_COLORS[car.colorIndex]);

      // A real cabin box sitting on top of the tapered body — at
      // actual render distance a smoothly curved shell with no
      // silhouette break reads as a featureless blob, not a car; a
      // distinct raised box is what the eye actually recognizes as a
      // greenhouse even from far away. Positioned via translateZ (not
      // a manual world-axis offset) so it lands over the body's own
      // bulge regardless of which way the car is facing.
      dummy.position.set(car.laneX, CAR_SHELL_HEIGHT + CABIN_HEIGHT / 2, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.translateZ(((CABIN_Z_START + CABIN_Z_END) / 2) * car.length);
      dummy.scale.set(
        car.width * 0.72,
        CABIN_HEIGHT,
        (CABIN_Z_END - CABIN_Z_START) * car.length * 0.86
      );
      dummy.updateMatrix();
      canopyMatrices.push(dummy.matrix.clone());

      // Side mirrors at door height — a small detail but one of the
      // most immediately recognizable "this is a real car" cues.
      const mirrorZ = car.z + (car.dir < 0 ? -car.length * 0.06 : car.length * 0.06);
      [-1, 1].forEach((wx) => {
        dummy.position.set(car.laneX + wx * (car.width / 2 + 0.03), 0.4, mirrorZ);
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(0.07, 0.05, 0.12);
        dummy.updateMatrix();
        mirrorMatrices.push(dummy.matrix.clone());
      });

      const wheelXOff = car.width / 2 + 0.02;
      const wheelZOff = car.length / 2 - 0.32;
      [-1, 1].forEach((wx) => {
        [-1, 1].forEach((wz) => {
          // rotation.x carries the rolling spin (accumulated in
          // useFrame from distance actually travelled) on top of the
          // rotation.z that orients the cylinder into a wheel disc in
          // the first place — Euler 'XYZ' order applies z first, so
          // the x spin ends up rotating the disc around its own axle
          // rather than tumbling it end over end.
          dummy.position.set(car.laneX + wx * wheelXOff, 0.2, car.z + wz * wheelZOff);
          dummy.rotation.set(car.wheelSpin, 0, Math.PI / 2);
          dummy.scale.set(WHEEL_RADIUS, 0.14, WHEEL_RADIUS);
          dummy.updateMatrix();
          wheelMatrices.push(dummy.matrix.clone());

          // A large aero cover disc nearly flush with the tire, the
          // closed-off wheel look common to EV/concept-car design
          // rather than an exposed spoked rim.
          dummy.position.set(
            car.laneX + wx * (wheelXOff + 0.065),
            0.2,
            car.z + wz * wheelZOff
          );
          dummy.scale.set(0.14, 0.02, 0.14);
          dummy.updateMatrix();
          rimMatrices.push(dummy.matrix.clone());
        });
      });

      // A single full-width light bar front and back rather than
      // discrete lamp clusters — the continuous strip is itself a
      // recognizable "car of the future" design cue (the same move
      // real EV/concept vehicles make).
      dummy.position.set(car.laneX, 0.2, frontZ);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width * 0.78, 0.05, 0.03);
      dummy.updateMatrix();
      headlightMatrices.push(dummy.matrix.clone());

      dummy.position.set(car.laneX, 0.24, backZ);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width * 0.7, 0.045, 0.03);
      dummy.updateMatrix();
      taillightMatrices.push(dummy.matrix.clone());

      // A light-motion-blur streak trailing from the taillight — a
      // string of abutting segments fading toward zero brightness
      // rather than one flat translucent smear, so it reads as a real
      // streak of light thinning out with distance rather than a
      // static translucent bar glued to the bumper. Gap between
      // segments scales with the car's own speed: a faster car leaves
      // a visibly longer trail, the same relationship a real long-
      // exposure photo of traffic shows.
      const trailGap = 0.16 + car.speed * 0.028;
      for (let k = 0; k < TRAIL_SEGMENTS; k++) {
        const segCenter = (k + 0.5) * trailGap;
        const segZ = backZ - car.dir * segCenter;
        dummy.position.set(car.laneX, 0.22, segZ);
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(car.width * 0.6, 0.035, trailGap * 0.98);
        dummy.updateMatrix();
        trailMatrices.push(dummy.matrix.clone());

        const brightness = 1 - (k + 1) / (TRAIL_SEGMENTS + 1);
        trailColors[i * TRAIL_SEGMENTS + k]?.set("#ff2a2a").multiplyScalar(brightness);
      }

      // Ground contact shadow — without it a car's wheels meet the
      // road in a hard, evenly-lit line with no sense of it actually
      // resting on the asphalt, the same cue CityScape uses under
      // every building.
      dummy.position.set(car.laneX, 0.012, car.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(car.width * 1.3, car.length * 1.15, 1);
      dummy.updateMatrix();
      shadowMatrices.push(dummy.matrix.clone());

      // Colored ground-glow pools — the wet-road reflection cue,
      // stretched toward each light's own direction (headlight glow
      // reaches forward, taillight glow trails back) rather than a
      // perfectly round puddle. Kept small and dim (this used to be
      // sized closer to the shadow disc, bright red, additive — at the
      // very close range a car can legitimately pass the camera at
      // during a normal overtake, that combination bloomed into a huge
      // dominant red mass filling the frame, not a subtle wet-road
      // cue).
      dummy.position.set(car.laneX, 0.018, frontZ + car.dir * 0.15);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(car.width * 0.6, car.length * 0.28, 1);
      dummy.updateMatrix();
      reflectionMatrices.push(dummy.matrix.clone());
      reflectionColors[i * 2]?.set("#fff3d6").multiplyScalar(0.22);

      dummy.position.set(car.laneX, 0.018, backZ - car.dir * 0.25);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(car.width * 0.55, car.length * 0.38, 1);
      dummy.updateMatrix();
      reflectionMatrices.push(dummy.matrix.clone());
      reflectionColors[i * 2 + 1]?.set("#ff2a2a").multiplyScalar(0.18);
    });

    applyInstances(shellRef.current, shellMatrices, bodyColors);
    applyInstances(canopyRef.current, canopyMatrices);
    applyInstances(wheelRef.current, wheelMatrices);
    applyInstances(rimRef.current, rimMatrices);
    applyInstances(mirrorRef.current, mirrorMatrices);
    applyInstances(headlightRef.current, headlightMatrices);
    applyInstances(taillightRef.current, taillightMatrices);
    applyInstances(trailRef.current, trailMatrices, trailColors);
    applyInstances(shadowRef.current, shadowMatrices);
    applyInstances(reflectionRef.current, reflectionMatrices, reflectionColors);
  };

  useLayoutEffect(layout, []);

  useFrame((state, delta) => {
    const camZ = state.camera.position.z;

    cars.current.forEach((car, i) => {
      car.z += car.dir * car.speed * delta;
      // Rolling wheels: spin angle tracks actual distance travelled
      // (arc length / radius) rather than just elapsed time, so faster
      // cars visibly spin their wheels faster — a static wheel on a
      // moving car is one of the fastest "this is fake" tells once you
      // look closely.
      car.wheelSpin += (car.dir * car.speed * delta) / WHEEL_RADIUS;
      // Once a car has fallen out of view behind the camera (whichever
      // direction it's headed), recycle it further down the road so
      // the same small pool of cars keeps traffic feeling continuous.
      if (car.z > camZ + 6) {
        car.z = camZ - 70 - seeded(i + Math.floor(state.clock.elapsedTime), 86) * 90;
      }
    });

    layout();
  });

  return (
    <group>
      {/* Phong rather than flat Lambert — a real painted body throws
          back a soft specular highlight, which reads as glossy
          automotive paint instead of matte plastic. */}
      <instancedMesh ref={shellRef} args={[shellGeometry, undefined, count]}>
        <meshPhongMaterial map={paintTexture} specular="#3a4048" shininess={42} fog />
      </instancedMesh>

      {/* Cabin windows — a real SVG glass/frame texture (see
          car-glass.svg) rather than a flat painted color, plus a bit
          of specular sheen so it reads as glass. */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial map={glassTexture} specular="#3a4550" shininess={80} fog />
      </instancedMesh>

      {/* Phong rather than flat unlit basic — an unlit black cylinder
          renders as one flat silhouette regardless of angle, which at
          this dark a color was reading as a hole cut in the car rather
          than a tire; a soft rubber-dark specular is enough to pick up
          the rig light and show it as an actual 3D wheel. */}
      <instancedMesh ref={wheelRef} args={[undefined, undefined, wheelCount]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshPhongMaterial color="#1c1e22" specular="#3a3d42" shininess={16} fog={false} />
      </instancedMesh>

      {/* Aero wheel cover — a lighter, near-flush disc so the wheel
          reads as a closed EV-style cover rather than a plain black
          cylinder or an exposed spoked rim. */}
      <instancedMesh ref={rimRef} args={[undefined, undefined, wheelCount]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshPhongMaterial color="#8a8f96" specular="#cfd4da" shininess={70} fog={false} />
      </instancedMesh>

      <instancedMesh ref={mirrorRef} args={[undefined, undefined, pairCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#0e1114" specular="#2a3038" shininess={50} fog={false} />
      </instancedMesh>

      <instancedMesh ref={headlightRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#fff3d6"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={taillightRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ff2a2a"
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* Light-trail segments — brightness comes entirely from
          instanceColor (see trailColors above), so the base material
          color stays plain white here. */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, count * TRAIL_SEGMENTS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Ground contact shadow beneath each car. */}
      <instancedMesh ref={shadowRef} args={[undefined, undefined, count]}>
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

      {/* Colored wet-road reflection pools — brightness/color comes
          entirely from instanceColor (see reflectionColors above),
          same pattern the trail segments use. */}
      <instancedMesh ref={reflectionRef} args={[undefined, undefined, count * 2]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
