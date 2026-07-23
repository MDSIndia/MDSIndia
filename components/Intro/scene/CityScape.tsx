"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INTRO_DURATION, clamp01, windowProgress } from "./timeline";
import { getWindowGridTexture } from "./glowTexture";
import { STAR_POSITION } from "./path";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const ACCENTS = ["#00D4FF", "#7B2FBE", "#0055FF", "#ff2ecb"];
const ZERO_SCALE = new THREE.Matrix4().makeScale(0, 0, 0);
const ZERO_COLOR = new THREE.Color(0, 0, 0);

/** Instanced cyberpunk megacity flanking the highway: box towers mixed
 * with tapered round towers, low-rise podium bases, corporate spires,
 * rooftop landing pads and gardens, twin window-strip facades, and
 * antennas with blinking tips — a lot of archetype variation so the
 * skyline doesn't read as one repeated asset, while everything still
 * stays instanced (a fixed number of draw calls regardless of `count`,
 * one per element type) so the extra density is cheap. */
export function CityScape({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 110 : 200;
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const roundTowersRef = useRef<THREE.InstancedMesh>(null);
  const podiumsRef = useRef<THREE.InstancedMesh>(null);
  const windowsARef = useRef<THREE.InstancedMesh>(null);
  const windowsBRef = useRef<THREE.InstancedMesh>(null);
  const spiresRef = useRef<THREE.InstancedMesh>(null);
  const roofGlowRef = useRef<THREE.InstancedMesh>(null);
  const landingPadsRef = useRef<THREE.InstancedMesh>(null);
  const gardensRef = useRef<THREE.InstancedMesh>(null);
  const signatureBandRef = useRef<THREE.InstancedMesh>(null);
  const antennaRef = useRef<THREE.InstancedMesh>(null);
  const antennaLightRef = useRef<THREE.InstancedMesh>(null);
  const parapetRef = useRef<THREE.InstancedMesh>(null);

  // One shared canvas gets cloned per structural mesh so each can tile
  // the window grid at its own density (a squat podium needs far fewer
  // repeats than a tower) without redrawing the pattern three times.
  // The instance's own vertexColor-less tint (bodyColor, set via
  // setColorAt) multiplies against this in the shader, so the grid
  // still reads as a distinct, colored building rather than one fixed
  // texture pasted across the whole skyline.
  const windowMaps = useMemo(() => {
    const base = getWindowGridTexture();
    const tower = base.clone();
    tower.repeat.set(3, 9);
    tower.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 9);
    round.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 2.5);
    podium.needsUpdate = true;
    return { tower, round, podium };
  }, []);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const buildingMatrices: THREE.Matrix4[] = [];
    const buildingColors: THREE.Color[] = [];
    const roundMatrices: THREE.Matrix4[] = [];
    const roundColors: THREE.Color[] = [];
    const podiumMatrices: THREE.Matrix4[] = [];
    const podiumColors: THREE.Color[] = [];
    const windowAMatrices: THREE.Matrix4[] = [];
    const windowAColors: THREE.Color[] = [];
    const windowBMatrices: THREE.Matrix4[] = [];
    const windowBColors: THREE.Color[] = [];
    const spireMatrices: THREE.Matrix4[] = [];
    const spireColors: THREE.Color[] = [];
    const roofGlowMatrices: THREE.Matrix4[] = [];
    const roofGlowColors: THREE.Color[] = [];
    const landingPadMatrices: THREE.Matrix4[] = [];
    const landingPadColors: THREE.Color[] = [];
    const gardenMatrices: THREE.Matrix4[] = [];
    const gardenColors: THREE.Color[] = [];
    const antennaMatrices: THREE.Matrix4[] = [];
    const antennaLightMatrices: THREE.Matrix4[] = [];
    const antennaLightColors: THREE.Color[] = [];
    const parapetMatrices: THREE.Matrix4[] = [];
    const parapetColors: THREE.Color[] = [];
    const signatureBandMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      // The camera's own lateral travel tops out around ~1.6 units
      // off-center (it converges back to center for the star ending),
      // so this offset only needs enough clearance to avoid a tower
      // clipping into frame as a flat black wall — kept close enough
      // to still read as a flanking skyline on narrow mobile FOVs.
      const z = 55 - seeded(i, 2) * 165;
      // Buildings this close to the camera's own starting point sit at
      // a very short forward distance from frame 0 — at that range even
      // the normal 11-35 flanking offset falls outside the horizontal
      // FOV entirely (a nearby building has to be much closer to center
      // to still land in frame than a distant one does), which is why
      // the skyline used to only "arrive" several seconds in once the
      // camera had flown far enough for its own offset to look small
      // by comparison. Pulling the near end of the range inward tapers
      // buildings closer to the road the nearer they are to the start,
      // so a chunk of skyline is reliably inside the frustum from the
      // very first frame instead of leaving it to chance.
      const startBias = clamp01((z - 15) / 40);
      const x = side * (11 - startBias * 6 + seeded(i, 1) * (24 - startBias * 8));
      // How close this building sits to the star waiting at the end of
      // the highway — buildings in that final stretch are the ones the
      // star's own light actually washes over as the camera arrives, so
      // they're the ones worth dressing up with extra detail (more
      // antennas, landing pads, rooftop gardens, a denser secondary
      // window band); buildings earlier in the flight fall back to the
      // base probabilities untouched.
      const starProximity = clamp01(1 - Math.abs(z - STAR_POSITION[2]) / 55);
      // A wide height range, biased toward variety: squat mid-rises
      // next to towering corporate spires and mega-arcologies.
      const height = 4 + seeded(i, 3) * 50;
      // Taller buildings read as more slender in real skylines — bias
      // width down as height increases instead of picking the two
      // independently, which used to produce oddly cube-shaped towers.
      const heightFactor = clamp01((height - 4) / 50);
      const width = (1.6 + seeded(i, 4) * 5) * (1.18 - heightFactor * 0.4);
      // Random draw rather than a fixed cycle through the palette, so
      // neighboring buildings don't fall into an ABAB repeat.
      const accent = ACCENTS[Math.floor(seeded(i, 61) * ACCENTS.length)];
      // A tapered round/cylindrical tower instead of a box on a random
      // ~22% of buildings — a distinct silhouette so the skyline isn't
      // every building being the same rectangular shape. Probability-
      // based (not `i % 5`) so it doesn't fall into a visible repeat
      // every fifth building as the camera passes.
      const isRound = seeded(i, 55) > 0.78;

      // Wider variance than a single flat dark tone, plus a subtle
      // per-building colour temperature (some coolER blue-grey glass,
      // some warmER concrete-grey) — real facades aren't one material.
      // This is a real reflectance value now that the body is lit (see
      // the rig lights in IntroCinematic) rather than a raw output
      // color — a genuinely near-zero albedo like the old 0.02-0.065
      // stays black no matter how much light hits it, which is what
      // made every face read as the same flat cutout regardless of
      // which way it faced. A realistic dark-facade reflectance leaves
      // the directional light room to actually carve out a lit side vs.
      // a shadow side.
      const dark = 0.1 + seeded(i, 6) * 0.2;
      const warmth = seeded(i, 64);
      const bodyColor = new THREE.Color(
        dark + warmth * 0.012,
        dark + warmth * 0.008,
        dark + (1 - warmth) * 0.02
      );
      // Nudged toward the same neon accent as this building's own
      // windows — reads as ambient city-light bouncing off the facade,
      // so even a distant silhouette (before the window strips are
      // legible) still carries a futuristic color cast instead of
      // sitting as a neutral grey cutout.
      bodyColor.lerp(new THREE.Color(accent), 0.16);

      if (isRound) {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.5, height, width * 0.5);
        dummy.rotation.set(0, seeded(i, 5) * Math.PI, 0);
        dummy.updateMatrix();
        roundMatrices.push(dummy.matrix.clone());
        roundColors.push(bodyColor);
        buildingMatrices.push(ZERO_SCALE.clone());
        buildingColors.push(ZERO_COLOR.clone());
      } else {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, width);
        dummy.rotation.set(0, (seeded(i, 5) - 0.5) * 0.3, 0);
        dummy.updateMatrix();
        buildingMatrices.push(dummy.matrix.clone());
        buildingColors.push(bodyColor);
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
      }

      // A wider, shorter podium base on a random subset of towers —
      // the low-rise "skirt" real skyscrapers sit on, which breaks up
      // the skyline into tiers instead of every tower planting
      // straight into the road.
      const hasPodium = seeded(i, 56) > 0.62;
      if (hasPodium) {
        const podiumHeight = 2.5 + seeded(i, 23) * 3;
        const podiumWidth = width * (1.5 + seeded(i, 24) * 0.6);
        dummy.position.set(x, podiumHeight / 2, z);
        dummy.scale.set(podiumWidth, podiumHeight, podiumWidth);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        podiumMatrices.push(dummy.matrix.clone());
        // Some podiums read as a lit lobby (brighter), others as the
        // shadowed street-level base real buildings have from
        // neighboring towers blocking light — not a uniform tint.
        const podiumLit = seeded(i, 65) > 0.5;
        podiumColors.push(
          podiumLit
            ? new THREE.Color(dark * 1.7, dark * 1.5, dark * 1.9)
            : new THREE.Color(dark * 0.45, dark * 0.45, dark * 0.5)
        );
      } else {
        podiumMatrices.push(ZERO_SCALE.clone());
        podiumColors.push(ZERO_COLOR.clone());
      }

      // Facade A: faces the road.
      dummy.position.set(
        x - side * (width / 2 + 0.02),
        2 + seeded(i, 7) * Math.max(1, height - 4),
        z
      );
      dummy.scale.set(0.06, 0.6 + seeded(i, 8) * 2.4, 0.4);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      windowAMatrices.push(dummy.matrix.clone());
      windowAColors.push(new THREE.Color(accent));

      // Facade B: the opposite edge, so towers still glow when the
      // path curves and briefly reveals their far side.
      dummy.position.set(
        x + side * (width / 2 + 0.02),
        2 + seeded(i, 9) * Math.max(1, height - 4),
        z + 1.2
      );
      dummy.scale.set(0.06, 0.5 + seeded(i, 10) * 2.0, 0.4);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      windowBMatrices.push(dummy.matrix.clone());
      windowBColors.push(
        new THREE.Color(ACCENTS[Math.floor(seeded(i, 62) * ACCENTS.length)])
      );

      // A random subset of tall (non-round) buildings tapers into a
      // corporate spire.
      const isSpireCandidate = height > 24 && seeded(i, 57) > 0.72 && !isRound;
      if (isSpireCandidate) {
        const spireHeight = 6 + seeded(i, 21) * 10;
        dummy.position.set(x, height + spireHeight / 2, z);
        dummy.scale.set(width * 0.28, spireHeight, width * 0.28);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        spireMatrices.push(dummy.matrix.clone());
        spireColors.push(new THREE.Color(0.22, 0.24, 0.3));
      } else {
        spireMatrices.push(ZERO_SCALE.clone());
        spireColors.push(ZERO_COLOR.clone());
      }

      // Rooftop lighting cap — every building gets a soft glow at its
      // crown so the skyline reads as lit from above, not just the side.
      // Buildings near the finale star get a bigger, hotter (whiter)
      // version — the star's own approaching light is the brightest
      // thing in the whole shot, so the rooftops nearest it should
      // read as catching some of that intensity rather than glowing
      // exactly like every other building's crown.
      dummy.position.set(x, height + 0.05, z);
      dummy.scale.set(
        width * (0.9 + starProximity * 0.5),
        0.06,
        width * (0.9 + starProximity * 0.5)
      );
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      roofGlowMatrices.push(dummy.matrix.clone());
      roofGlowColors.push(
        new THREE.Color(accent).lerp(new THREE.Color("#ffffff"), starProximity * 0.55)
      );

      // Parapet ledge — a slight overhang where a box tower's walls
      // meet the roof, the same real-building cue as a cornice: the
      // wall doesn't just stop, it caps. Round towers already get a
      // clean cylindrical roofline (plus a landing-pad ring on some),
      // so this is reserved for the box archetype where a hard flat
      // top edge otherwise reads as an unfinished extrusion.
      if (!isRound) {
        dummy.position.set(x, height - 0.14, z);
        dummy.scale.set(width * 1.1, 0.3, width * 1.1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        parapetMatrices.push(dummy.matrix.clone());
        parapetColors.push(new THREE.Color(0.3, 0.31, 0.36));
      } else {
        parapetMatrices.push(ZERO_SCALE.clone());
        parapetColors.push(ZERO_COLOR.clone());
      }

      // Signature glow band — a bright accent ring wrapped partway up
      // the facade, appearing only on box towers close to the finale
      // star. This doesn't exist anywhere else in the skyline, so the
      // buildings that get one read as this stretch's own "hero"
      // architecture rather than more of the same towers repeating.
      const hasSignatureBand =
        !isRound && starProximity > 0.3 && seeded(i, 67) > 0.4;
      if (hasSignatureBand) {
        const bandY = height * (0.55 + seeded(i, 68) * 0.25);
        dummy.position.set(x, bandY, z);
        dummy.scale.set(width * 1.03, 0.16, width * 1.03);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        signatureBandMatrices.push(dummy.matrix.clone());
      } else {
        signatureBandMatrices.push(ZERO_SCALE.clone());
      }

      // About half of round towers (which read well as observation
      // decks) get a glowing landing-pad ring — more likely still the
      // closer the tower sits to the finale star, so that stretch of
      // skyline reads as more built-up right where the camera lingers
      // longest during the approach.
      const hasLandingPad = isRound && seeded(i, 59) > 0.45 - starProximity * 0.35;
      if (hasLandingPad) {
        dummy.position.set(x, height + 0.08, z);
        dummy.scale.set(width * 0.62, 0.05, width * 0.62);
        dummy.updateMatrix();
        landingPadMatrices.push(dummy.matrix.clone());
        landingPadColors.push(new THREE.Color("#00e5ff"));
      } else {
        landingPadMatrices.push(ZERO_SCALE.clone());
        landingPadColors.push(ZERO_COLOR.clone());
      }

      // A small fraction of podium roofs gets a rooftop garden accent
      // for color variety — again weighted toward the buildings
      // nearest the star.
      const hasGarden = hasPodium && seeded(i, 60) > 0.85 - starProximity * 0.4;
      if (hasGarden) {
        const podiumHeight = 2.5 + seeded(i, 23) * 3;
        const podiumWidth = width * (1.5 + seeded(i, 24) * 0.6);
        dummy.position.set(x, podiumHeight + 0.05, z);
        dummy.scale.set(podiumWidth * 0.7, 0.05, podiumWidth * 0.7);
        dummy.updateMatrix();
        gardenMatrices.push(dummy.matrix.clone());
        gardenColors.push(new THREE.Color("#3fffb0"));
      } else {
        gardenMatrices.push(ZERO_SCALE.clone());
        gardenColors.push(ZERO_COLOR.clone());
      }

      // A random ~30% of buildings gets a communication antenna with a
      // blinking tip — far more of them near the star, where the extra
      // silhouette detail actually gets seen up close.
      const hasAntenna = seeded(i, 58) > 0.68 - starProximity * 0.45;
      if (hasAntenna) {
        const antennaHeight = 2.5 + seeded(i, 22) * 4;
        dummy.position.set(x, height + antennaHeight / 2, z);
        dummy.scale.set(0.05, antennaHeight, 0.05);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        antennaMatrices.push(dummy.matrix.clone());

        dummy.position.set(x, height + antennaHeight, z);
        dummy.scale.set(0.22, 0.22, 0.22);
        dummy.updateMatrix();
        antennaLightMatrices.push(dummy.matrix.clone());
        antennaLightColors.push(
          new THREE.Color(seeded(i, 63) > 0.5 ? "#ff3355" : "#00e5ff")
        );
      } else {
        antennaMatrices.push(ZERO_SCALE.clone());
        antennaLightMatrices.push(ZERO_SCALE.clone());
        antennaLightColors.push(ZERO_COLOR.clone());
      }
    }

    return {
      buildingMatrices,
      buildingColors,
      roundMatrices,
      roundColors,
      podiumMatrices,
      podiumColors,
      windowAMatrices,
      windowAColors,
      windowBMatrices,
      windowBColors,
      spireMatrices,
      spireColors,
      roofGlowMatrices,
      roofGlowColors,
      landingPadMatrices,
      landingPadColors,
      gardenMatrices,
      gardenColors,
      antennaMatrices,
      antennaLightMatrices,
      antennaLightColors,
      parapetMatrices,
      parapetColors,
      signatureBandMatrices,
    };
  }, [count]);

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

  useLayoutEffect(
    () => applyInstances(buildingsRef.current, data.buildingMatrices, data.buildingColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(roundTowersRef.current, data.roundMatrices, data.roundColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(podiumsRef.current, data.podiumMatrices, data.podiumColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(windowsARef.current, data.windowAMatrices, data.windowAColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(windowsBRef.current, data.windowBMatrices, data.windowBColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(spiresRef.current, data.spireMatrices, data.spireColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(roofGlowRef.current, data.roofGlowMatrices, data.roofGlowColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(parapetRef.current, data.parapetMatrices, data.parapetColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(signatureBandRef.current, data.signatureBandMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(landingPadsRef.current, data.landingPadMatrices, data.landingPadColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(gardensRef.current, data.gardenMatrices, data.gardenColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(antennaRef.current, data.antennaMatrices),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(
        antennaLightRef.current,
        data.antennaLightMatrices,
        data.antennaLightColors
      ),
    [data]
  );

  // A handful of window-facade instances get their color nudged toward
  // "off" or "on" each frame, on a slow rotating cursor through the
  // instance list — a cheap approximation of windows flicking on and
  // off across a living city, without touching every instance per frame.
  const flickerCursor = useRef(0);
  const flickerColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // The star's light spills onto nearby facades as the camera closes in.
    const portalBoost = windowProgress(t, 7.2, INTRO_DURATION) * 0.5;
    const windowOpacity = 0.9 + portalBoost;

    [windowsARef, windowsBRef].forEach((ref) => {
      const mat = ref.current?.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = windowOpacity;
    });

    const roofMat = roofGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (roofMat) roofMat.opacity = 0.35 + Math.sin(t * 1.1) * 0.15;

    const padMat = landingPadsRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (padMat) padMat.opacity = 0.55 + Math.sin(t * 1.6) * 0.25;

    const antennaMat = antennaLightRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (antennaMat) antennaMat.opacity = 0.5 + Math.sin(t * 5.5) * 0.5;

    const bandMat = signatureBandRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (bandMat) bandMat.opacity = (0.6 + Math.sin(t * 2.4) * 0.3) * (0.7 + portalBoost);

    {
      const meshA = windowsARef.current;
      const meshB = windowsBRef.current;
      if (meshA && meshB) {
        const steps = 3;
        for (let s = 0; s < steps; s++) {
          const idx = flickerCursor.current % count;
          flickerCursor.current++;
          const lit = seeded(idx, Math.floor(t * 0.5)) > 0.4;
          flickerColor.set(lit ? ACCENTS[idx % ACCENTS.length] : "#050506");
          meshA.setColorAt(idx, flickerColor);
          meshB.setColorAt((idx + 7) % count, flickerColor);
        }
        if (meshA.instanceColor) meshA.instanceColor.needsUpdate = true;
        if (meshB.instanceColor) meshB.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Structural building volumes use a lit material rather than the
          flat-color unlit basic material everything else in this scene
          uses — with zero shading, every face of a box reads as one
          uniform flat color and the whole skyline flattens into cutout
          silhouettes instead of dimensional buildings. Lambert shading
          against the rig lights below gives each face its own
          brightness based on which way it's turned, which is what
          actually reads as a solid 3D mass.
          Deliberately no `vertexColors` prop here even though these are
          per-instance colored via setColorAt: instanceColor is read
          automatically whenever it's set, independent of that flag —
          but turning the flag on anyway, with no geometry-level `color`
          attribute on these primitives, zeroes the lit result out
          entirely under this material (verified empirically; the old
          unlit basic material tolerated the same combination fine,
          which is why this went unnoticed until the switch to Lambert). */}
      <instancedMesh ref={buildingsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial map={windowMaps.tower} fog />
      </instancedMesh>

      {/* Parapet ledge — plain, unlit-facade-tone box; no window map,
          this is trim rather than more facade. */}
      <instancedMesh ref={parapetRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      <instancedMesh ref={roundTowersRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.72, 1, 1, 10]} />
        <meshLambertMaterial map={windowMaps.round} fog />
      </instancedMesh>

      <instancedMesh ref={podiumsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial map={windowMaps.podium} fog />
      </instancedMesh>

      <instancedMesh ref={spiresRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.7, 1, 4]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      <instancedMesh ref={windowsARef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={windowsBRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={roofGlowRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.72, 0.72, 1, 6]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* Signature glow band — only ever visible on the handful of
          towers nearest the finale star (everything else gets
          ZERO_SCALE), so a single fixed bright accent is enough; no
          instanceColor here after the vertexColors/instanceColor
          combination proved unreliable elsewhere in this scene. */}
      <instancedMesh ref={signatureBandRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#cdeeff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={landingPadsRef} args={[undefined, undefined, count]}>
        <torusGeometry args={[0.7, 0.05, 6, 24]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={gardensRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.72, 0.72, 1, 6]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={antennaRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshBasicMaterial color="#0a0a12" fog={false} />
      </instancedMesh>

      <instancedMesh ref={antennaLightRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}
