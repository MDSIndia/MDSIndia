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

// A premium, near-monochrome palette (pearl, silver, gunmetal,
// titanium, deep blue) rather than an ordinary-sedan color mix — cars
// that look like they belong in the same "future" as the skyline
// around them. Skewed lighter than a first pass (that one leaned 5:1
// toward near-black tones): against unlit black asphalt at night, a
// mostly-dark palette left most cars reading as flat dark silhouettes
// with no visible form, rather than distinct painted vehicles — these
// still read as premium/monochrome, just bright enough to actually
// catch the rig light and the paint gradient's own highlight.
// Pearl white weighted up (appears 3x) at explicit "use this type of
// car" reference — that concept car's whole identity is a pearl-white
// body, so it should be the traffic's dominant tone, not one option
// among six equally-likely others.
const CAR_COLORS = ["#eef1f3", "#eef1f3", "#eef1f3", "#c9cdd3", "#7d838c", "#3a4568", "#5a6270", "#8b93a0"];

// Scaled up alongside the car body's own ~50% size increase — a fixed
// wheel size against a bigger body would read as proportionally
// dinkier, undermining the bigger/more substantial look that size
// increase was for.
const WHEEL_RADIUS = 0.21;
// How many fading segments make up one car's light trail — a real
// motion-blur streak rather than a single semi-transparent smear, and
// cheap enough (a handful of extra instanced boxes per car) not to
// worry about relative to everything else already instanced here.
const TRAIL_SEGMENTS = 5;
// Segments making up the glowing side line — see the layout comment
// below for why a single straight bar became a swept multi-segment
// curve at explicit "use this type of car" reference.
const SIDE_LINE_SEGMENTS = 5;
const SIDE_LINE_FLARE = 0.06;

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
  // Raised 400% (10/18 -> 50/90), then pulled back roughly 50% three
  // times more (-> 25/45 -> 13/23 -> 7/12) across repeated follow-up
  // requests — now well below the original pre-increase count.
  const count = isMobile ? 7 : 12;
  const wheelCount = count * 4;
  const pairCount = count * 2; // mirrors come in L/R pairs

  const shellRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const wheelRef = useRef<THREE.InstancedMesh>(null);
  const rimRef = useRef<THREE.InstancedMesh>(null);
  const wheelGlowRef = useRef<THREE.InstancedMesh>(null);
  const sideLineRef = useRef<THREE.InstancedMesh>(null);
  const mirrorRef = useRef<THREE.InstancedMesh>(null);
  const headlightRef = useRef<THREE.InstancedMesh>(null);
  const taillightRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);
  const reflectionRef = useRef<THREE.InstancedMesh>(null);

  const shellGeometry = useMemo(() => createAeroCarBodyGeometry(), []);
  const cabinGeometry = useMemo(() => createCarCabinGeometry(), []);
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
    // Cars per lane, and which "slot" within its own lane this car
    // fills — at the low counts this scene now runs (see count above),
    // giving every car in a lane a fully independent random z (the
    // previous approach) could by chance clump several cars from the
    // *same* side together while leaving the other side's lanes with a
    // long empty stretch, which is exactly what read as "no cars on the
    // left" even though the lane-assignment itself was already
    // balanced left/right. Spacing each lane's own cars into even
    // slots (still jittered, not a rigid grid) guarantees every lane —
    // and so both sides — actually has cars spread across the visible
    // route instead of leaving it to chance.
    const carsPerLane = Math.ceil(count / LANES.length);
    cars.current = Array.from({ length: count }, (_, i) => {
      const laneIndex = i % LANES.length;
      const laneSlot = Math.floor(i / LANES.length);
      // A small fixed lateral offset from the lane's exact centerline —
      // real drivers don't track a mathematically perfect line, and
      // every car sitting dead-center in its lane was part of what read
      // as too uniform/mechanical rather than natural traffic.
      const laneX = LANES[laneIndex] + (seeded(i, 89) - 0.5) * 0.3;
      const dir: 1 | -1 = laneX < 0 ? -1 : 1;
      return {
        laneX,
        dir,
        speed: 6 + seeded(i, 81) * 5,
        z: 40 - ((laneSlot + seeded(i, 82) * 0.8) / carsPerLane) * 170,
        // Sized up ~50% (was 1.5-2.0 x 0.78-0.92) at explicit "cars
        // look so small, make them big" request.
        length: 2.3 + seeded(i, 83) * 0.6,
        width: 1.05 + seeded(i, 84) * 0.18,
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
    const wheelGlowMatrices: THREE.Matrix4[] = [];
    const sideLineMatrices: THREE.Matrix4[] = [];
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

      // A glowing character line running along each side of the body,
      // low on the shell — the one design cue every reference concept
      // car shared (a thin lit strip swept from nose to tail), and the
      // clearest way to sell "this body panel was designed," not just
      // painted. translateX (not a manual world-axis offset) so it
      // hugs the actual side of the shell regardless of which way the
      // car is facing, the same trick the cabin above uses for Z. Built
      // from several segments along a shallow parabola (low across the
      // door/rocker, sweeping up into the fender flares at each end)
      // rather than one straight bar, at explicit "use this type of
      // car" reference — the line curves with the body instead of
      // cutting straight through it.
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

          // A thin glowing disc set into the wheel face, behind and
          // slightly larger than the cover that sits on top of it — the
          // illuminated-wheel-hub cue the reference concept cars carry
          // (a lit ring built into the wheel design, its edge visible
          // all the way around the cover rather than hidden behind it),
          // reusing this scene's own "everything has an accent light"
          // language rather than a plain painted hubcap. Pushed before
          // the cover below so its slightly larger radius peeks out
          // from behind it.
          dummy.position.set(
            car.laneX + wx * (wheelXOff + 0.05),
            0.2,
            car.z + wz * wheelZOff
          );
          dummy.scale.setScalar(WHEEL_RADIUS * 0.95);
          dummy.updateMatrix();
          wheelGlowMatrices.push(dummy.matrix.clone());

          // A large aero cover disc nearly flush with the tire, the
          // closed-off wheel look common to EV/concept-car design
          // rather than an exposed spoked rim. Sized up alongside the
          // wheel's own radius increase (was a fixed 0.14 regardless of
          // WHEEL_RADIUS, which left a noticeably thick dark tire lip
          // once the wheel itself grew — now a thin lip instead,
          // matching the reference's own glowing-hub-with-a-slim-tire-
          // ring wheel design).
          dummy.position.set(
            car.laneX + wx * (wheelXOff + 0.075),
            0.2,
            car.z + wz * wheelZOff
          );
          dummy.scale.set(WHEEL_RADIUS * 0.75, 0.02, WHEEL_RADIUS * 0.75);
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
    applyInstances(wheelGlowRef.current, wheelGlowMatrices);
    applyInstances(sideLineRef.current, sideLineMatrices);
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
        <primitive object={cabinGeometry} attach="geometry" />
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

      {/* A thin glowing disc set just behind the wheel cover, its rim
          peeking out around the edge — the illuminated-wheel-hub cue
          the reference concept cars carry (a lit ring built into the
          wheel design itself), reusing this scene's "everything has an
          accent light" language rather than a plain painted hubcap. */}
      <instancedMesh ref={wheelGlowRef} args={[undefined, undefined, wheelCount]}>
        <cylinderGeometry args={[1, 1, 1, 20]} />
        <meshBasicMaterial
          color="#6fd6ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Glowing side character line — see the layout comment above for
          why this is here: the one design cue shared across every
          reference concept car. */}
      <instancedMesh ref={sideLineRef} args={[undefined, undefined, count * 2 * SIDE_LINE_SEGMENTS]}>
        <boxGeometry args={[1, 1, 1]} />
        {/* Shifted from blue-cyan (#6fd6ff) to teal (#4fe8c8) at
            explicit "use this type of car" reference — its own glowing
            side line reads distinctly teal/turquoise rather than blue. */}
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
