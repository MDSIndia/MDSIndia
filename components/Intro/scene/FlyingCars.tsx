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

// A premium, near-monochrome palette (pearl, graphite, gunmetal,
// titanium, deep blue) — the same "car of the future" family the
// ground traffic uses, it's how they get around that's futuristic,
// not a loud paint job.
const CAR_COLORS = ["#eef1f3", "#15171b", "#7d838c", "#2a3550", "#3a3f45", "#5a6572"];
// Small abstract hover drones stay in the same techie blue family the
// buildings already use, just pulled back from full saturation so
// they read as lit hardware rather than a solid glowing toy block.
const DRONE_COLORS = ["#2fa8cc", "#3f7ab8"];
// Same reasoning as StreetCars' own TRAIL_SEGMENTS — a fading string
// of segments behind each vehicle's taillight rather than one flat
// translucent smear.
const TRAIL_SEGMENTS = 5;

interface FlyingCar {
  x: number;
  y: number;
  z: number;
  dir: 1 | -1;
  speed: number;
  bobAmp: number;
  bobFreq: number;
  phase: number;
  length: number;
  width: number;
  colorIndex: number;
}

interface Drone {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  radius: number;
  color: THREE.Color;
}

/** The city's traffic goes airborne: one continuous aerodynamic shell
 * per car (see carGeometry — the same shape StreetCars uses, no wheels
 * here, a glowing repulsor plate stands in for them), cruising at
 * rooftop-to-midtower height above the highway, plus a scattering of
 * small abstract hover drones weaving between them for scale variety.
 * Both groups use the same forward-flight-with-wraparound approach
 * StreetCars used for ground traffic (recycled once they fall behind
 * the camera), just lifted off the road and given a gentle hover bob
 * instead of wheels on asphalt. */
export function FlyingCars({ isMobile }: { isMobile: boolean }) {
  const carCount = isMobile ? 8 : 14;
  const droneCount = isMobile ? 6 : 12;

  const shellRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const padRef = useRef<THREE.InstancedMesh>(null);
  const mirrorRef = useRef<THREE.InstancedMesh>(null);
  const headlightRef = useRef<THREE.InstancedMesh>(null);
  const taillightRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);

  const droneBodyRef = useRef<THREE.InstancedMesh>(null);
  const droneGlowRef = useRef<THREE.InstancedMesh>(null);

  const shellGeometry = useMemo(() => createAeroCarBodyGeometry(), []);
  const paintTexture = useMemo(() => getCarPaintTexture(), []);
  const glassTexture = useTexture(CAR_GLASS) as THREE.Texture;
  const bodyColors = useMemo(
    () => Array.from({ length: carCount }, () => new THREE.Color()),
    [carCount]
  );
  const trailColors = useMemo(
    () => Array.from({ length: carCount * TRAIL_SEGMENTS }, () => new THREE.Color()),
    [carCount]
  );

  const cars = useRef<FlyingCar[]>([]);
  if (cars.current.length === 0) {
    cars.current = Array.from({ length: carCount }, (_, i) => {
      const dir: 1 | -1 = i % 2 === 0 ? -1 : 1;
      return {
        x: (seeded(i, 201) - 0.5) * 15,
        y: 4 + seeded(i, 202) * 11,
        z: 40 - seeded(i, 203) * 170,
        dir,
        speed: 7 + seeded(i, 204) * 6,
        // Slow, shallow drift rather than a bouncy bob — real vehicle
        // suspension/hover stabilization damps out fast oscillation,
        // and a fast bob is one of the things that read as a toy
        // bobbing on an invisible string rather than something with
        // real mass cruising through the air.
        bobAmp: 0.1 + seeded(i, 205) * 0.16,
        bobFreq: 0.3 + seeded(i, 206) * 0.3,
        phase: seeded(i, 207) * Math.PI * 2,
        length: 1.5 + seeded(i, 208) * 0.5,
        width: 0.78 + seeded(i, 209) * 0.14,
        colorIndex: Math.floor(seeded(i, 210) * CAR_COLORS.length),
      };
    });
  }

  const drones = useMemo<Drone[]>(
    () =>
      Array.from({ length: droneCount }, (_, i) => ({
        baseX: (seeded(i, 41) - 0.5) * 26,
        baseY: 6 + seeded(i, 42) * 20,
        baseZ: 40 - seeded(i, 43) * 170,
        speed: 0.3 + seeded(i, 44) * 0.6,
        radius: 1.5 + seeded(i, 45) * 3,
        color: new THREE.Color(DRONE_COLORS[i % DRONE_COLORS.length]),
      })),
    [droneCount]
  );

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

  const layoutCars = (t: number) => {
    const dummy = new THREE.Object3D();
    const shellMatrices: THREE.Matrix4[] = [];
    const canopyMatrices: THREE.Matrix4[] = [];
    const padMatrices: THREE.Matrix4[] = [];
    const mirrorMatrices: THREE.Matrix4[] = [];
    const headlightMatrices: THREE.Matrix4[] = [];
    const taillightMatrices: THREE.Matrix4[] = [];
    const trailMatrices: THREE.Matrix4[] = [];

    cars.current.forEach((car, i) => {
      const facing = car.dir < 0 ? 0 : Math.PI;
      const bobY = car.y + Math.sin(t * car.bobFreq + car.phase) * car.bobAmp;
      const frontZ = car.z + (car.dir < 0 ? -car.length / 2 : car.length / 2);
      const backZ = car.z + (car.dir < 0 ? car.length / 2 : -car.length / 2);

      dummy.position.set(car.x, bobY, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width, CAR_SHELL_HEIGHT, car.length);
      dummy.updateMatrix();
      shellMatrices.push(dummy.matrix.clone());
      bodyColors[i]?.set(CAR_COLORS[car.colorIndex]);

      // A real cabin box sitting on top of the tapered body — at
      // actual render distance a smoothly curved shell with no
      // silhouette break reads as a featureless blob, not a car; a
      // distinct raised box is what the eye actually recognizes as a
      // greenhouse even from far away.
      dummy.position.set(car.x, bobY + CAR_SHELL_HEIGHT / 2 + CABIN_HEIGHT / 2, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.translateZ(((CABIN_Z_START + CABIN_Z_END) / 2) * car.length);
      dummy.scale.set(
        car.width * 0.72,
        CABIN_HEIGHT,
        (CABIN_Z_END - CABIN_Z_START) * car.length * 0.86
      );
      dummy.updateMatrix();
      canopyMatrices.push(dummy.matrix.clone());

      // A soft, dim under-glow standing in for wheels — small and
      // low-opacity rather than a bright solid slab, so it reads as a
      // faint repulsor haze instead of a glowing toy light-up base.
      dummy.position.set(car.x, bobY - CAR_SHELL_HEIGHT / 2 - 0.06, car.z);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width * 0.7, 0.04, car.length * 0.7);
      dummy.updateMatrix();
      padMatrices.push(dummy.matrix.clone());

      // Side mirrors — the same "unmistakably a real car" cue the
      // ground traffic uses.
      const mirrorZ = car.z + (car.dir < 0 ? -car.length * 0.06 : car.length * 0.06);
      [-1, 1].forEach((wx) => {
        dummy.position.set(car.x + wx * (car.width / 2 + 0.03), bobY + CAR_SHELL_HEIGHT / 2, mirrorZ);
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(0.07, 0.05, 0.12);
        dummy.updateMatrix();
        mirrorMatrices.push(dummy.matrix.clone());
      });

      // A single full-width light bar front and back rather than
      // discrete lamp clusters — the continuous strip is itself a
      // recognizable "car of the future" design cue.
      dummy.position.set(car.x, bobY - CAR_SHELL_HEIGHT * 0.32, frontZ);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width * 0.78, 0.05, 0.03);
      dummy.updateMatrix();
      headlightMatrices.push(dummy.matrix.clone());

      dummy.position.set(car.x, bobY - CAR_SHELL_HEIGHT * 0.28, backZ);
      dummy.rotation.set(0, facing, 0);
      dummy.scale.set(car.width * 0.7, 0.045, 0.03);
      dummy.updateMatrix();
      taillightMatrices.push(dummy.matrix.clone());

      // Light-motion-blur streak trailing from the taillight — same
      // fading-segment trick StreetCars uses on the ground, scaled by
      // this vehicle's own (generally higher) flight speed.
      const trailGap = 0.16 + car.speed * 0.028;
      for (let k = 0; k < TRAIL_SEGMENTS; k++) {
        const segCenter = (k + 0.5) * trailGap;
        const segZ = backZ - car.dir * segCenter;
        dummy.position.set(car.x, bobY - CAR_SHELL_HEIGHT * 0.28, segZ);
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(car.width * 0.55, 0.035, trailGap * 0.98);
        dummy.updateMatrix();
        trailMatrices.push(dummy.matrix.clone());

        const brightness = 1 - (k + 1) / (TRAIL_SEGMENTS + 1);
        trailColors[i * TRAIL_SEGMENTS + k]?.set("#ff2a2a").multiplyScalar(brightness);
      }
    });

    applyInstances(shellRef.current, shellMatrices, bodyColors);
    applyInstances(canopyRef.current, canopyMatrices);
    applyInstances(padRef.current, padMatrices);
    applyInstances(mirrorRef.current, mirrorMatrices);
    applyInstances(headlightRef.current, headlightMatrices);
    applyInstances(taillightRef.current, taillightMatrices);
    applyInstances(trailRef.current, trailMatrices, trailColors);
  };

  const layoutDrones = () => {
    const mesh = droneBodyRef.current;
    const glow = droneGlowRef.current;
    if (!mesh || !glow) return;
    const dummy = new THREE.Object3D();
    drones.forEach((d, i) => {
      dummy.position.set(d.baseX, d.baseY, d.baseZ);
      dummy.scale.set(0.14, 0.06, 0.28);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, d.color);

      dummy.scale.setScalar(0.22);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
      glow.setColorAt(i, d.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => layoutCars(0), []);
  useLayoutEffect(layoutDrones, [drones]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const camZ = state.camera.position.z;

    cars.current.forEach((car, i) => {
      car.z += car.dir * car.speed * delta;
      // Recycled further down the road once the camera has left it
      // behind, the same wraparound StreetCars used on the ground.
      if (car.z > camZ + 6) {
        car.z = camZ - 70 - seeded(i + Math.floor(t), 211) * 90;
      }
    });
    layoutCars(t);

    const dummy = new THREE.Object3D();
    const mesh = droneBodyRef.current;
    const glow = droneGlowRef.current;
    if (mesh && glow) {
      drones.forEach((d, i) => {
        const angle = t * d.speed + i;
        const x = d.baseX + Math.cos(angle) * d.radius;
        const y = d.baseY + Math.sin(t * 0.6 + i) * 0.6;
        const z = d.baseZ + Math.sin(angle) * d.radius * 0.6;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(0.14, 0.06, 0.28);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0.22);
        dummy.updateMatrix();
        glow.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      glow.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Phong rather than flat Lambert — a real painted body throws
          back a soft specular highlight, which is what actually reads
          as glossy automotive paint instead of matte plastic. */}
      <instancedMesh ref={shellRef} args={[shellGeometry, undefined, carCount]}>
        <meshPhongMaterial map={paintTexture} specular="#3a4048" shininess={42} fog />
      </instancedMesh>

      {/* Cabin windows — a real SVG glass/frame texture (see
          car-glass.svg) rather than a flat painted color, plus a bit
          of specular sheen so it reads as glass. */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, carCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial map={glassTexture} specular="#3a4550" shininess={80} fog />
      </instancedMesh>

      {/* Faint repulsor haze standing in for wheels — dim and small
          rather than a bright solid slab, so it reads as a subtle
          under-glow instead of a light-up toy base. */}
      <instancedMesh ref={padRef} args={[undefined, undefined, carCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#bfe0f0"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={mirrorRef} args={[undefined, undefined, carCount * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#0e1114" specular="#2a3038" shininess={50} fog={false} />
      </instancedMesh>

      <instancedMesh ref={headlightRef} args={[undefined, undefined, carCount]}>
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

      <instancedMesh ref={taillightRef} args={[undefined, undefined, carCount]}>
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
          instanceColor (see trailColors above). */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, carCount * TRAIL_SEGMENTS]}>
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

      {/* Small abstract hover drones — scale variety against the
          car-shaped traffic, kept in the same techie blue as the rest
          of the skyline. */}
      <instancedMesh ref={droneBodyRef} args={[undefined, undefined, droneCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial vertexColors fog={false} />
      </instancedMesh>
      <instancedMesh ref={droneGlowRef} args={[undefined, undefined, droneCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
