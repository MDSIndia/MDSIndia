"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Lower and wider than the original boxy proportions — a real
// high-speed monorail car reads as a long, low, sleek slab, not a
// squat cube. Slightly longer too, so a 4-car train reads as one
// continuous train rather than a string of separate short boxes.
const CAR_LENGTH = 2.6;
const CAR_GAP = 0.1;
const CAR_WIDTH = 1.25;
const CAR_HEIGHT = 0.72;
const NOSE_LENGTH = 0.85;
const CARS_PER_TRAIN = 4;
// Was ±16.5 (inside CityScape's own building band, x=11 to ~22 — see
// Ground.tsx's x >= 11 invariant), then ±9.6 (the road-shoulder
// corridor, which a building's own near facade can still occasionally
// reach given its half-width) — both left real odds of a tower ending
// up between the camera and the track. Now run directly above the
// highway itself, straddling just outside the outermost car lane
// (StreetCars' own lanes sit at x=-3.4..3.4): nothing in this scene
// (no building, by definition — even the road-shoulder street
// furniture starts further out) can ever sit between the camera and a
// point directly ahead of it down the road it's already flying along.
// The camera looks straight down this corridor for the entire flight,
// so the guideway is continuously in frame rather than something the
// camera might happen to catch off to the side.
const TRACK_X = [-4.6, 4.6] as const;
// Above FlyingCars' own ceiling (y=4 to 15, see FlyingCars.tsx) so nose
// cones/trailing light streams never clip through the air traffic
// below them.
const TRACK_Y = 16.5;
const RECYCLE_MARGIN = 8;
const RECYCLE_SPAN = 150;
const TRAIL_SEGMENTS = 6;

interface Train {
  side: 0 | 1; // index into TRACK_X
  headZ: number;
  speed: number;
  colorIndex: number;
}

// A premium pearl/silver body — close to white so the blue accent
// stripe and window band (the actual "futuristic" cues) have something
// bright to stand out against, rather than competing with a dark body.
const TRAIN_COLORS = ["#eef2f5", "#dfe6ec", "#e6ecef"];
const ACCENT_COLOR = "#4fd6ff";

/** A sleek monorail running on an elevated guideway flanking the
 * highway on both sides — the skyline's own transit line. Each train
 * is a lead car with a smooth tapered nose cone (a cone geometry
 * flattened by non-uniform scale into the car's own low, wide cross-
 * section) coupled to plain rectangular cars behind it, the way a real
 * high-speed train has one aerodynamic nose and uniform carriages
 * behind — rather than every car sharing an identical boxy shape. A
 * continuous blue window band plus a separate, brighter accent stripe
 * along the lower body carry the "futuristic transit" read, and a
 * fading light-trail streaks off the last car the same way road
 * traffic's own taillights do. Built from the same instanced-
 * primitives-plus-recycling approach StreetCars/FlyingCars already use
 * (a small fixed pool of cars, wrapped back to the far end of the
 * track once they pass the camera), just constrained to a single
 * straight line at a fixed height/x instead of a lane. */
export function ElevatedTrain({ isMobile }: { isMobile: boolean }) {
  const trainCount = isMobile ? 2 : 4;
  const totalCars = trainCount * CARS_PER_TRAIN;

  const trackRef = useRef<THREE.InstancedMesh>(null);
  const trackGlowRef = useRef<THREE.InstancedMesh>(null);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const noseRef = useRef<THREE.InstancedMesh>(null);
  const windowRef = useRef<THREE.InstancedMesh>(null);
  const accentStripeRef = useRef<THREE.InstancedMesh>(null);
  const noseGlowRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);

  const bodyColors = useMemo(
    () => Array.from({ length: totalCars }, () => new THREE.Color()),
    [totalCars]
  );
  const noseColors = useMemo(
    () => Array.from({ length: trainCount }, () => new THREE.Color()),
    [trainCount]
  );
  const trailColors = useMemo(
    () => Array.from({ length: trainCount * TRAIL_SEGMENTS }, () => new THREE.Color()),
    [trainCount]
  );

  // The lead car's nose cone — a plain coneGeometry, pre-rotated so its
  // axis runs along Z with the apex at -Z. The train itself now travels
  // toward +z (opposite the camera's own -z heading — reversed at
  // explicit request, see useFrame below), so the nose instance gets an
  // extra 180° yaw at placement time (see the `c === 0` block below)
  // rather than re-baking this shared geometry — same trick, one fewer
  // geometry to maintain. Non-uniform per-instance scale flattens the
  // circular cross-section into the car's own low, wide profile — a
  // smoothly tapered aerodynamic nose with no custom vertex work
  // needed.
  const noseGeometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.5, 1, 10);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const trains = useRef<Train[]>([]);
  if (trains.current.length === 0) {
    trains.current = Array.from({ length: trainCount }, (_, i) => ({
      side: (i % 2) as 0 | 1,
      headZ: 40 - seeded(i, 701) * RECYCLE_SPAN,
      speed: 9 + seeded(i, 702) * 4,
      colorIndex: Math.floor(seeded(i, 703) * TRAIN_COLORS.length),
    }));
  }

  // Track is static — built once, not per-frame. No visible support
  // pylons underneath it (removed at explicit request — the guideway
  // reads as a levitating/magnetic rail rather than a pier-supported
  // viaduct, consistent with everything else in this scene floating on
  // its own glow rather than a physical strut).
  const trackData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const trackMatrices: THREE.Matrix4[] = [];
    const trackGlowMatrices: THREE.Matrix4[] = [];

    TRACK_X.forEach((tx) => {
      dummy.position.set(tx, TRACK_Y, -30);
      dummy.scale.set(0.35, 0.16, 220);
      dummy.updateMatrix();
      trackMatrices.push(dummy.matrix.clone());

      // A thin additive glow line along the top edge of the rail — the
      // guideway itself reads as lit infrastructure rather than a dead
      // grey beam, matching the same "everything has an accent light"
      // language the rest of this skyline uses.
      dummy.position.set(tx, TRACK_Y + 0.1, -30);
      dummy.scale.set(0.08, 0.02, 220);
      dummy.updateMatrix();
      trackGlowMatrices.push(dummy.matrix.clone());
    });

    return { trackMatrices, trackGlowMatrices };
  }, []);

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

  useLayoutEffect(() => {
    applyInstances(trackRef.current, trackData.trackMatrices);
    applyInstances(trackGlowRef.current, trackData.trackGlowMatrices);
  }, [trackData]);

  const layoutTrains = () => {
    const dummy = new THREE.Object3D();
    const bodyMatrices: THREE.Matrix4[] = [];
    const noseMatrices: THREE.Matrix4[] = [];
    const windowMatrices: THREE.Matrix4[] = [];
    const accentMatrices: THREE.Matrix4[] = [];
    const noseGlowMatrices: THREE.Matrix4[] = [];
    const trailMatrices: THREE.Matrix4[] = [];

    trains.current.forEach((train, ti) => {
      const tx = TRACK_X[train.side];
      const carY = TRACK_Y + CAR_HEIGHT / 2 + 0.14;
      // Trains travel toward +z (see useFrame below — opposite the
      // camera's own -z heading), so "ahead" (the lead car's own
      // direction of travel) means larger z. train.headZ is the lead
      // car's own position (c=0); each following car trails behind it
      // at a *smaller* z.
      for (let c = 0; c < CARS_PER_TRAIN; c++) {
        const carZ = train.headZ - c * (CAR_LENGTH + CAR_GAP);
        const frontZ = carZ + CAR_LENGTH / 2;

        dummy.position.set(tx, carY, carZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(CAR_WIDTH, CAR_HEIGHT, CAR_LENGTH);
        dummy.updateMatrix();
        bodyMatrices.push(dummy.matrix.clone());
        bodyColors[ti * CARS_PER_TRAIN + c]?.set(TRAIN_COLORS[train.colorIndex]);

        // A single lit window band along each side rather than
        // separate panes — reads clearly as "an occupied, lit transit
        // car" at flythrough speed the way individually modeled
        // windows wouldn't at this distance.
        dummy.position.set(tx, carY + CAR_HEIGHT * 0.12, carZ);
        dummy.scale.set(CAR_WIDTH * 1.02, CAR_HEIGHT * 0.38, CAR_LENGTH * 0.88);
        dummy.updateMatrix();
        windowMatrices.push(dummy.matrix.clone());

        // A separate, brighter accent stripe along the lower body — the
        // continuous LED light-line real concept monorails carry below
        // the windows, distinct from (and brighter than) the window
        // band's own glow.
        dummy.position.set(tx, carY - CAR_HEIGHT * 0.32, carZ);
        dummy.scale.set(CAR_WIDTH * 1.03, 0.05, CAR_LENGTH * 0.94);
        dummy.updateMatrix();
        accentMatrices.push(dummy.matrix.clone());

        // The lead car alone gets a tapered nose cone flush against its
        // front face, plus a bright glow where the two meet — a
        // headlamp cue that also makes it obvious which end leads.
        if (c === 0) {
          // Nose tip extends further in the direction of travel (+z)
          // beyond the car's own front face, with a 180° yaw so the
          // geometry's baked -z apex now points +z instead.
          dummy.position.set(tx, carY, frontZ + NOSE_LENGTH / 2);
          dummy.rotation.set(0, Math.PI, 0);
          dummy.scale.set(CAR_WIDTH * 0.94, CAR_HEIGHT * 0.94, NOSE_LENGTH);
          dummy.updateMatrix();
          noseMatrices.push(dummy.matrix.clone());
          noseColors[ti]?.set(TRAIN_COLORS[train.colorIndex]);

          dummy.position.set(tx, carY, frontZ - 0.02);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(CAR_WIDTH * 0.8, CAR_HEIGHT * 0.5, 0.06);
          dummy.updateMatrix();
          noseGlowMatrices.push(dummy.matrix.clone());
        }
      }

      // Fading light-trail streaming off the last car — the same
      // "Light Trails" cue road traffic's own taillights carry, scaled
      // to the train's own length/speed rather than a car's. Trails
      // behind the train in the direction opposite travel (-z, since
      // the train now heads +z).
      const lastCarZ = train.headZ - (CARS_PER_TRAIN - 1) * (CAR_LENGTH + CAR_GAP);
      const tailZ = lastCarZ - CAR_LENGTH / 2;
      const trailGap = 0.22 + train.speed * 0.03;
      for (let k = 0; k < TRAIL_SEGMENTS; k++) {
        const segZ = tailZ - (k + 0.5) * trailGap;
        dummy.position.set(tx, carY - CAR_HEIGHT * 0.32, segZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(CAR_WIDTH * 0.7, 0.045, trailGap * 0.98);
        dummy.updateMatrix();
        trailMatrices.push(dummy.matrix.clone());

        const brightness = 1 - (k + 1) / (TRAIL_SEGMENTS + 1);
        trailColors[ti * TRAIL_SEGMENTS + k]?.set(ACCENT_COLOR).multiplyScalar(brightness);
      }
    });

    applyInstances(bodyRef.current, bodyMatrices, bodyColors);
    applyInstances(noseRef.current, noseMatrices, noseColors);
    applyInstances(windowRef.current, windowMatrices);
    applyInstances(accentStripeRef.current, accentMatrices);
    applyInstances(noseGlowRef.current, noseGlowMatrices);
    applyInstances(trailRef.current, trailMatrices, trailColors);
  };

  useLayoutEffect(layoutTrains, []);

  useFrame((state, delta) => {
    const camZ = state.camera.position.z;
    trains.current.forEach((train, i) => {
      // Trains travel toward +z — opposite the camera's own -z heading
      // (reversed at explicit request from the original same-direction
      // version) — so they read as oncoming transit rushing past rather
      // than a line the camera is merely overtaking from behind, which
      // at the camera's own higher cruise speed read as barely moving
      // relative to the frame.
      train.headZ += train.speed * delta;
      // The train's own rear now trails behind it at *smaller* z (see
      // layoutTrains' carZ formula above) — this is the train's own
      // minimum z extent, so once it exceeds camZ + margin the entire
      // train (not just part of it) has cleared behind the camera.
      const tailZ = train.headZ - (CARS_PER_TRAIN - 1) * (CAR_LENGTH + CAR_GAP) - CAR_LENGTH / 2;
      if (tailZ > camZ + RECYCLE_MARGIN) {
        train.headZ = camZ - 40 - seeded(i + Math.floor(state.clock.elapsedTime), 704) * 60;
      }
    });
    layoutTrains();
  });

  return (
    <group>
      <instancedMesh ref={trackRef} args={[undefined, undefined, TRACK_X.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#1c2028" specular="#3a4a60" shininess={35} fog />
      </instancedMesh>

      <instancedMesh ref={trackGlowRef} args={[undefined, undefined, TRACK_X.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={ACCENT_COLOR}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Phong rather than flat Lambert — a real painted body throws
          back a soft specular highlight, the same "premium metal" cue
          the road traffic's own paint uses. */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, totalCars]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial specular="#8a96a6" shininess={55} fog />
      </instancedMesh>

      {/* Lead-car nose cone — see noseGeometry above for why a plain
          cone reads as an aerodynamic taper once flattened by scale. */}
      <instancedMesh ref={noseRef} args={[noseGeometry, undefined, trainCount]}>
        <meshPhongMaterial specular="#8a96a6" shininess={55} fog />
      </instancedMesh>

      <instancedMesh ref={windowRef} args={[undefined, undefined, totalCars]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#bfe8ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* The brighter lower-body accent stripe — a distinct, more
          saturated blue than the window band above it. */}
      <instancedMesh ref={accentStripeRef} args={[undefined, undefined, totalCars]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={ACCENT_COLOR}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={noseGlowRef} args={[undefined, undefined, trainCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#fff3d6"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Fading light-trail behind the last car — brightness comes
          entirely from instanceColor (see trailColors above), same
          fading-segment trick StreetCars/FlyingCars use for their own
          taillight trails. */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, trainCount * TRAIL_SEGMENTS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
