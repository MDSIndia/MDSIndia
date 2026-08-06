"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp01 } from "./timeline";
import {
  getWindowGridTexture,
  getWindowEmissiveTexture,
  getWindowNormalTexture,
} from "./glowTexture";
import { STAR_POSITION } from "./path";
import { keepClearOfCrossStreets } from "./crossStreetPositions";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Blue-dominant, matching the window-lighting mix below — a deliberate
// techie/cyberpunk color-grade for this skyline's accent lighting
// (lobby signs, facade washes) rather than a photoreal warm-white mix,
// with a single warm exception kept so it still reads as varied
// lighting rather than monotone.
const ACCENTS = ["#6fc3f0", "#8fd6ff", "#4fa8e0", "#bfe8ff", "#ffe9c7"];
// What every "lerp toward white" below actually lerps toward — a pale
// blue rather than pure white, so even the brightest, most-washed-out
// glows (rooftops right next to the finale star) keep a visible blue
// cast instead of clipping to plain white.
const GLOW_WHITE = "#dff3ff";
const ZERO_SCALE = new THREE.Matrix4().makeScale(0, 0, 0);
const ZERO_COLOR = new THREE.Color(0, 0, 0);
// Every box tower gets exactly this many mullion-rib slots (unused
// ones per building sit at ZERO_SCALE) — real vertical structural ribs
// protruding slightly off the facade, lit by the same directional
// light as everything else, so the facade actually picks up light on
// one side and shadow on the other as the camera moves past instead
// of staying a flat, unchanging texture regardless of viewing angle.
const MAX_MULLIONS = 9;

/** Instanced cyberpunk megacity flanking the highway: box towers mixed
 * with tapered round towers, low-rise podium bases, corporate spires,
 * rooftop landing pads and gardens, twin window-strip facades, and
 * antennas with blinking tips — a lot of archetype variation so the
 * skyline doesn't read as one repeated asset, while everything still
 * stays instanced (a fixed number of draw calls regardless of `count`,
 * one per element type) so the extra density is cheap. */
export function CityScape({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 110 : 200;
  const buildingsShortRef = useRef<THREE.InstancedMesh>(null);
  const buildingsMedRef = useRef<THREE.InstancedMesh>(null);
  const buildingsTallRef = useRef<THREE.InstancedMesh>(null);
  const roundTowersRef = useRef<THREE.InstancedMesh>(null);
  const facetedTowersRef = useRef<THREE.InstancedMesh>(null);
  const twistedTowersRef = useRef<THREE.InstancedMesh>(null);
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
  const contactShadowRef = useRef<THREE.InstancedMesh>(null);
  const roofEquipRef = useRef<THREE.InstancedMesh>(null);
  const storefrontRef = useRef<THREE.InstancedMesh>(null);
  const hangingGardenRef = useRef<THREE.InstancedMesh>(null);
  const mullionRef = useRef<THREE.InstancedMesh>(null);

  // One shared canvas gets cloned per structural mesh so each can tile
  // the window grid at its own density (a squat podium needs far fewer
  // repeats than a tower) without redrawing the pattern three times.
  // The instance's own vertexColor-less tint (bodyColor, set via
  // setColorAt) multiplies against this in the shader, so the grid
  // still reads as a distinct, colored building rather than one fixed
  // texture pasted across the whole skyline.
  //
  // Box towers specifically get three height-bucketed clones (rather
  // than one fixed repeat for every box tower from 4 to 54 units tall)
  // — a single fixed repeat means a real building's window rows get
  // stretched or squashed depending on how tall that particular
  // instance happens to be, which is a big part of why a skyline built
  // this way reads as a printed pattern rather than real floors: real
  // windows are close to a fixed physical size no matter how tall the
  // building is. Bucketing can't be pixel-perfect per instance without
  // a custom shader, but three tuned repeats gets short/mid/tall
  // buildings each into roughly the right ballpark.
  const windowMaps = useMemo(() => {
    const base = getWindowGridTexture();
    const towerShort = base.clone();
    towerShort.repeat.set(3, 5);
    towerShort.needsUpdate = true;
    const towerMed = base.clone();
    towerMed.repeat.set(3, 11);
    towerMed.needsUpdate = true;
    const towerTall = base.clone();
    towerTall.repeat.set(3, 20);
    towerTall.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 9);
    round.needsUpdate = true;
    const faceted = base.clone();
    faceted.repeat.set(4, 9);
    faceted.needsUpdate = true;
    const twisted = base.clone();
    twisted.repeat.set(3, 10);
    twisted.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 2.5);
    podium.needsUpdate = true;
    return { towerShort, towerMed, towerTall, round, faceted, twisted, podium };
  }, []);

  // Emissive counterpart to windowMaps, same repeats so the glow mask
  // lines up pane-for-pane with the diffuse grid it's layered under.
  const windowEmissiveMaps = useMemo(() => {
    const base = getWindowEmissiveTexture();
    const towerShort = base.clone();
    towerShort.repeat.set(3, 5);
    towerShort.needsUpdate = true;
    const towerMed = base.clone();
    towerMed.repeat.set(3, 11);
    towerMed.needsUpdate = true;
    const towerTall = base.clone();
    towerTall.repeat.set(3, 20);
    towerTall.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 9);
    round.needsUpdate = true;
    const faceted = base.clone();
    faceted.repeat.set(4, 9);
    faceted.needsUpdate = true;
    const twisted = base.clone();
    twisted.repeat.set(3, 10);
    twisted.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 2.5);
    podium.needsUpdate = true;
    return { towerShort, towerMed, towerTall, round, faceted, twisted, podium };
  }, []);

  // Bump counterpart to windowMaps, same repeats so the derived surface
  // normal lines up pane-for-pane with the diffuse grid — this is what
  // actually breaks the "flat printed texture" read: each pane now has
  // a real (if subtle) raised-glass-in-a-recessed-frame bevel that the
  // rig light rakes across differently depending on viewing angle,
  // instead of every face responding to light exactly like a plain
  // untextured box regardless of what's painted on it.
  const windowNormalMaps = useMemo(() => {
    const base = getWindowNormalTexture();
    const towerShort = base.clone();
    towerShort.repeat.set(3, 5);
    towerShort.needsUpdate = true;
    const towerMed = base.clone();
    towerMed.repeat.set(3, 11);
    towerMed.needsUpdate = true;
    const towerTall = base.clone();
    towerTall.repeat.set(3, 20);
    towerTall.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 9);
    round.needsUpdate = true;
    const faceted = base.clone();
    faceted.repeat.set(4, 9);
    faceted.needsUpdate = true;
    const twisted = base.clone();
    twisted.repeat.set(3, 10);
    twisted.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 2.5);
    podium.needsUpdate = true;
    return { towerShort, towerMed, towerTall, round, faceted, twisted, podium };
  }, []);

  // A square prism progressively rotated around its own vertical axis
  // from base to roof — the "organic twisted skyscraper" silhouette
  // (Cayan Tower/Absolute Towers-style) that no amount of per-instance
  // scale/rotation on a plain box can produce. Built once from a
  // tapered CylinderGeometry by hand-rotating each vertex around Y in
  // proportion to its height, then shared across every twisted-tower
  // instance the same way the box/round geometries already are.
  const twistedGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.52, 1, 1, 4, 24, false);
    const pos = geo.attributes.position;
    // A gentler twist than a first pass — real twisted towers (Cayan
    // Tower, Absolute Towers) rotate on the order of 30-45° base-to-
    // roof; the window texture's own horizontal banding spirals along
    // with the geometry, and a much sharper twist made that banding
    // look like a melted/streaked smear rather than an elegant helix.
    const totalTwist = Math.PI / 5.5;
    const v = new THREE.Vector3();
    for (let idx = 0; idx < pos.count; idx++) {
      v.fromBufferAttribute(pos, idx);
      const heightT = v.y + 0.5; // 0 at the base, 1 at the roof
      const angle = totalTwist * heightT;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      pos.setXYZ(idx, v.x * cos - v.z * sin, v.y, v.x * sin + v.z * cos);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    const buildingShortMatrices: THREE.Matrix4[] = [];
    const buildingShortColors: THREE.Color[] = [];
    const buildingMedMatrices: THREE.Matrix4[] = [];
    const buildingMedColors: THREE.Color[] = [];
    const buildingTallMatrices: THREE.Matrix4[] = [];
    const buildingTallColors: THREE.Color[] = [];
    const mullionMatrices: THREE.Matrix4[] = [];
    const roundMatrices: THREE.Matrix4[] = [];
    const roundColors: THREE.Color[] = [];
    const facetedMatrices: THREE.Matrix4[] = [];
    const facetedColors: THREE.Color[] = [];
    const twistedMatrices: THREE.Matrix4[] = [];
    const twistedColors: THREE.Color[] = [];
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
    const contactShadowMatrices: THREE.Matrix4[] = [];
    const roofEquipMatrices: THREE.Matrix4[] = [];
    const roofEquipColors: THREE.Color[] = [];
    const storefrontMatrices: THREE.Matrix4[] = [];
    const hangingGardenMatrices: THREE.Matrix4[] = [];
    const hangingGardenColors: THREE.Color[] = [];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      // The camera's own lateral travel tops out around ~1.6 units
      // off-center (it converges back to center for the star ending),
      // so this offset only needs enough clearance to avoid a tower
      // clipping into frame as a flat black wall — kept close enough
      // to still read as a flanking skyline on narrow mobile FOVs.
      // Nudged clear of any cross street's own buffer zone (see
      // crossStreetPositions.ts) rather than left to land wherever the
      // raw seeded value happens to fall — without this, buildings
      // would plant themselves right on top of the perpendicular
      // streets CrossStreets draws, since the two are otherwise
      // generated completely independently.
      const z = keepClearOfCrossStreets(55 - seeded(i, 2) * 165);
      // Buildings this close to the camera's own starting point sit at
      // a very short forward distance from frame 0 — at that range even
      // the flanking offset falls outside the horizontal FOV entirely
      // (a nearby building has to be much closer to center to still
      // land in frame than a distant one does), which is why the
      // skyline used to only "arrive" several seconds in once the
      // camera had flown far enough for its own offset to look small
      // by comparison. Shrinking the *spread* (not the floor) tapers
      // these buildings toward the near edge of the flanking band the
      // nearer they are to the start, so a chunk of skyline is reliably
      // inside the frustum from the very first frame — the floor stays
      // fixed at 11 (HighwayRoad's plane is only 8 units to its edge;
      // see the x >= 11 invariant documented in Ground.tsx) so this
      // never pulls a building onto the road itself.
      //
      // The spread itself is deliberately tight (was 24, tapering to
      // 8) — a wide spread scatters buildings across a 24-unit-deep
      // band with no two front faces lining up, which read as a messy,
      // un-aligned street edge rather than real city blocks, where
      // most buildings hug a fairly consistent setback from the curb
      // with only occasional variation.
      const startBias = clamp01((z - 15) / 40);
      const x = side * (11 + seeded(i, 1) * (11 - startBias * 6));
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
      // Footprint depth, independent of width — real towers are rarely
      // square in plan; a rectangular block (or a slab far longer one
      // way than the other) is much more common than the perfectly
      // square footprint every box tower used to share, which is part
      // of what made the skyline's massing itself read as one repeated
      // shape at different scales. Only the plain box archetype below
      // actually varies this (round/faceted/twisted are inherently
      // radially symmetric); every other footprint-dependent
      // calculation past the archetype branch defaults to the square
      // case by starting here.
      let depth = width;
      // Random draw rather than a fixed cycle through the palette, so
      // neighboring buildings don't fall into an ABAB repeat.
      const accent = ACCENTS[Math.floor(seeded(i, 61) * ACCENTS.length)];
      // Four silhouettes instead of two: a plain box is still the
      // majority (~58%), but a tapered round tower (~20%), a sharply
      // tapered faceted/crystalline tower (~12%), and an organic
      // twisted tower (~10%) break up the skyline so it doesn't read
      // as one repeated rectangular asset. One probability-based roll
      // (not `i % n`) so the mix doesn't fall into a visible repeating
      // pattern as the camera passes.
      const archetypeRoll = seeded(i, 55);
      const isRound = archetypeRoll > 0.8;
      const isFaceted = !isRound && archetypeRoll > 0.68;
      const isTwisted = !isRound && !isFaceted && archetypeRoll > 0.58;

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
      // Brighter base reflectance on mobile — a scene lit for a
      // desktop monitor reads noticeably dimmer on a smaller,
      // typically outdoor/handheld screen, and mobile also lost the
      // Phong specular sheen (see the material choice below) that
      // desktop uses to add a bit of extra highlight brightness.
      const dark = (0.1 + seeded(i, 6) * 0.2) * (isMobile ? 1.45 : 1);
      const warmth = seeded(i, 64);
      // A fixed blue bias on the B channel (independent of `warmth`)
      // plus a smaller warm-channel spread than before — even the
      // "warmer" facades stay a cool blue-grey rather than crossing
      // into neutral or warm territory.
      const bodyColor = new THREE.Color(
        dark + warmth * 0.008,
        dark + warmth * 0.006,
        dark + 0.045 + (1 - warmth) * 0.015
      );
      // A light nudge toward this building's own accent — enough that a
      // distant silhouette still carries a faint color cast from
      // ambient city light bouncing off the facade, but real concrete/
      // glass/metal cladding is still fundamentally grey, not tinted
      // paint. The old 0.32 lerp read as every building being molded
      // from the same blue plastic; this keeps the material itself
      // neutral and lets the actual window lights (and the accent trim
      // below) carry the color.
      bodyColor.lerp(new THREE.Color(accent), 0.1);

      if (isRound) {
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.5, height, width * 0.5);
        dummy.rotation.set(0, seeded(i, 5) * Math.PI, 0);
        dummy.updateMatrix();
        roundMatrices.push(dummy.matrix.clone());
        roundColors.push(bodyColor);
        buildingShortMatrices.push(ZERO_SCALE.clone());
        buildingShortColors.push(ZERO_COLOR.clone());
        buildingMedMatrices.push(ZERO_SCALE.clone());
        buildingMedColors.push(ZERO_COLOR.clone());
        buildingTallMatrices.push(ZERO_SCALE.clone());
        buildingTallColors.push(ZERO_COLOR.clone());
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
        twistedMatrices.push(ZERO_SCALE.clone());
        twistedColors.push(ZERO_COLOR.clone());
        for (let r = 0; r < MAX_MULLIONS; r++) mullionMatrices.push(ZERO_SCALE.clone());
      } else if (isFaceted) {
        // A sharply tapered hex-frustum tower — the taper itself is
        // baked into the shared geometry (see facetedGeometry below),
        // so per-instance scale just sets overall size.
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.62, height, width * 0.62);
        dummy.rotation.set(0, seeded(i, 5) * Math.PI, 0);
        dummy.updateMatrix();
        facetedMatrices.push(dummy.matrix.clone());
        facetedColors.push(bodyColor);
        buildingShortMatrices.push(ZERO_SCALE.clone());
        buildingShortColors.push(ZERO_COLOR.clone());
        buildingMedMatrices.push(ZERO_SCALE.clone());
        buildingMedColors.push(ZERO_COLOR.clone());
        buildingTallMatrices.push(ZERO_SCALE.clone());
        buildingTallColors.push(ZERO_COLOR.clone());
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        twistedMatrices.push(ZERO_SCALE.clone());
        twistedColors.push(ZERO_COLOR.clone());
        for (let r = 0; r < MAX_MULLIONS; r++) mullionMatrices.push(ZERO_SCALE.clone());
      } else if (isTwisted) {
        // The twist itself is baked into the shared geometry (see
        // twistedGeometry below); per-instance scale/rotation just
        // sets overall size and which way it's turned.
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.56, height, width * 0.56);
        dummy.rotation.set(0, seeded(i, 5) * Math.PI, 0);
        dummy.updateMatrix();
        twistedMatrices.push(dummy.matrix.clone());
        twistedColors.push(bodyColor);
        buildingShortMatrices.push(ZERO_SCALE.clone());
        buildingShortColors.push(ZERO_COLOR.clone());
        buildingMedMatrices.push(ZERO_SCALE.clone());
        buildingMedColors.push(ZERO_COLOR.clone());
        buildingTallMatrices.push(ZERO_SCALE.clone());
        buildingTallColors.push(ZERO_COLOR.clone());
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
        for (let r = 0; r < MAX_MULLIONS; r++) mullionMatrices.push(ZERO_SCALE.clone());
      } else {
        // Rectangular rather than square footprint — see the `depth`
        // comment above. Biased slightly wide-of-square more often than
        // narrow (real slab towers are more commonly wider along one
        // face than perfectly square) but the range covers both.
        depth = width * (0.6 + seeded(i, 63) * 0.75);
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, depth);
        dummy.rotation.set(0, (seeded(i, 5) - 0.5) * 0.3, 0);
        dummy.updateMatrix();
        // Routed into one of three height buckets (see windowMaps
        // above) so its window rows use a repeat tuned to roughly its
        // own height instead of one fixed repeat shared by every box
        // tower from 4 to 54 units tall.
        if (height <= 16) {
          buildingShortMatrices.push(dummy.matrix.clone());
          buildingShortColors.push(bodyColor);
          buildingMedMatrices.push(ZERO_SCALE.clone());
          buildingMedColors.push(ZERO_COLOR.clone());
          buildingTallMatrices.push(ZERO_SCALE.clone());
          buildingTallColors.push(ZERO_COLOR.clone());
        } else if (height <= 32) {
          buildingMedMatrices.push(dummy.matrix.clone());
          buildingMedColors.push(bodyColor);
          buildingShortMatrices.push(ZERO_SCALE.clone());
          buildingShortColors.push(ZERO_COLOR.clone());
          buildingTallMatrices.push(ZERO_SCALE.clone());
          buildingTallColors.push(ZERO_COLOR.clone());
        } else {
          buildingTallMatrices.push(dummy.matrix.clone());
          buildingTallColors.push(bodyColor);
          buildingShortMatrices.push(ZERO_SCALE.clone());
          buildingShortColors.push(ZERO_COLOR.clone());
          buildingMedMatrices.push(ZERO_SCALE.clone());
          buildingMedColors.push(ZERO_COLOR.clone());
        }
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
        twistedMatrices.push(ZERO_SCALE.clone());
        twistedColors.push(ZERO_COLOR.clone());

        // Real vertical mullion ribs on the road-facing side, evenly
        // spaced and standing slightly proud of the wall — genuine 3D
        // structure rather than another layer of texture, so the
        // facade actually shades itself as the camera passes instead
        // of reading as a flat printed pattern from every angle.
        const ribCount = Math.max(4, Math.min(MAX_MULLIONS, Math.round(depth * 1.3)));
        for (let r = 0; r < MAX_MULLIONS; r++) {
          if (r < ribCount) {
            const t = (r + 1) / (ribCount + 1) - 0.5;
            dummy.position.set(x - side * (width / 2 + 0.05), height / 2, z + t * depth * 0.94);
            dummy.scale.set(0.06, height * 0.99, 0.1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            mullionMatrices.push(dummy.matrix.clone());
          } else {
            mullionMatrices.push(ZERO_SCALE.clone());
          }
        }
      }

      // Ground contact shadow — a soft dark disc at each building's
      // foot, multiplied into the ground plane beneath it. Without
      // this, even with a real ground plane now underneath everything,
      // a building's base meets it in a hard, evenly-lit line with no
      // sense of one object resting on another — this is the cheap
      // stylized-scene stand-in for real ambient occlusion.
      dummy.position.set(x, 0.01, z);
      dummy.scale.set(width * 1.6, width * 1.6, 1);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      contactShadowMatrices.push(dummy.matrix.clone());

      // Street-level storefront glow — a thin, warm strip right at
      // ground level on a minority of buildings, the way real retail
      // frontage reads as a distinct lit band below the office floors.
      // This used to fire on 75% of buildings at almost two floors
      // tall, which along a run of buildings right next to the camera
      // (the ones filling the bottom corners of frame) merged into a
      // solid wall of glowing amber slabs rather than reading as
      // individual storefronts — a real ground-floor retail band is a
      // fraction of a story tall, not nearly as tall as the office
      // floor above it.
      const hasStorefront = seeded(i, 97) > 0.6;
      if (hasStorefront) {
        dummy.position.set(
          x - side * (width / 2 + 0.03),
          0.45,
          z
        );
        dummy.scale.set(0.05, 0.4, depth * 0.92);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        storefrontMatrices.push(dummy.matrix.clone());
      } else {
        storefrontMatrices.push(ZERO_SCALE.clone());
      }

      // Hanging gardens — cascading vertical greenery bands wrapped
      // partway up a subset of tall facades, the "living building"
      // amenity real mixed-use towers increasingly build in rather
      // than every surface being glass and steel. Weighted toward
      // taller buildings (there's more facade to hang a garden on),
      // 1-2 bands per building at different heights so it reads as
      // planted terraces rather than one uniform green stripe.
      const gardenBandCount =
        height > 14 && seeded(i, 108) > 0.72 ? (seeded(i, 109) > 0.5 ? 2 : 1) : 0;
      const gardenGreens = ["#3a7d44", "#4f9e5f", "#2f6b3a"];
      for (let g = 0; g < gardenBandCount; g++) {
        const bandY = 2 + seeded(i * 3 + g, 110) * Math.max(1, height - 5);
        const bandHeight = 1.2 + seeded(i * 3 + g, 111) * 1.6;
        dummy.position.set(x - side * (width / 2 + 0.04), bandY, z);
        dummy.scale.set(0.1, bandHeight, depth * 0.7);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        hangingGardenMatrices.push(dummy.matrix.clone());
        hangingGardenColors.push(
          new THREE.Color(gardenGreens[Math.floor(seeded(i * 3 + g, 112) * gardenGreens.length)])
        );
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
            ? new THREE.Color(dark * 1.4, dark * 1.35, dark * 2.15)
            : new THREE.Color(dark * 0.4, dark * 0.42, dark * 0.62)
        );
      } else {
        podiumMatrices.push(ZERO_SCALE.clone());
        podiumColors.push(ZERO_COLOR.clone());
      }

      // Accent light strip — a lit sign band, a lobby facade wash, an
      // illuminated stairwell — real buildings that have one make it a
      // deliberate architectural feature, not something every single
      // tower in the skyline carries on both faces. Rolled per-building
      // at ~28% rather than always-on, so it reads as the exception
      // (the landmark building with the lit sign) instead of the rule.
      const hasAccentStrip = seeded(i, 96) > 0.72;

      // Facade A: faces the road.
      if (hasAccentStrip) {
        dummy.position.set(
          x - side * (width / 2 + 0.02),
          2 + seeded(i, 7) * Math.max(1, height - 4),
          z
        );
        dummy.scale.set(0.06, 0.6 + seeded(i, 8) * 2.4, 0.4);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        windowAMatrices.push(dummy.matrix.clone());
        // Lerped toward white rather than the raw accent hue — a flat
        // saturated color under additive blending still reads as a
        // colored strip, not a light that's actually switched on; mixing
        // in white pushes every channel up (not just the ones the accent
        // already maxes out), which is what makes it read as a bright,
        // hot light source instead of a tinted panel.
        windowAColors.push(new THREE.Color(accent).lerp(new THREE.Color(GLOW_WHITE), 0.25));
      } else {
        windowAMatrices.push(ZERO_SCALE.clone());
        windowAColors.push(ZERO_COLOR.clone());
      }

      // Facade B: the opposite edge, so towers still glow when the
      // path curves and briefly reveals their far side. Same roll as
      // facade A — a building with a lit accent shows it on both faces
      // rather than one side rolling independently of the other.
      if (hasAccentStrip) {
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
          new THREE.Color(ACCENTS[Math.floor(seeded(i, 62) * ACCENTS.length)]).lerp(
            new THREE.Color(GLOW_WHITE),
            0.25
          )
        );
      } else {
        windowBMatrices.push(ZERO_SCALE.clone());
        windowBColors.push(ZERO_COLOR.clone());
      }

      // A random subset of tall plain-box buildings tapers into a
      // corporate spire — the other archetypes already have their own
      // distinct rooflines.
      const isSpireCandidate =
        height > 24 && seeded(i, 57) > 0.72 && !isRound && !isFaceted && !isTwisted;
      if (isSpireCandidate) {
        const spireHeight = 6 + seeded(i, 21) * 10;
        dummy.position.set(x, height + spireHeight / 2, z);
        dummy.scale.set(width * 0.28, spireHeight, width * 0.28);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        spireMatrices.push(dummy.matrix.clone());
        spireColors.push(new THREE.Color(0.16, 0.2, 0.36));
      } else {
        spireMatrices.push(ZERO_SCALE.clone());
        spireColors.push(ZERO_COLOR.clone());
      }

      // Rooftop lighting cap — real skylines only have a handful of
      // illuminated rooftops (an aviation beacon, an accent wash on a
      // landmark tower), not a glowing cap on every other building,
      // which is what a base rate this high read as: a uniform toy-city
      // LED crown rather than scattered real fixtures. Weighted toward
      // the buildings nearest the finale star, where the star's own
      // approaching light is the brightest thing in the shot and it
      // makes sense for more rooftops to be catching some of it.
      const hasRoofGlow = seeded(i, 66) > 0.78 - starProximity * 0.4;
      if (hasRoofGlow) {
        dummy.position.set(x, height + 0.05, z);
        dummy.scale.set(
          width * (0.7 + starProximity * 0.4),
          0.06,
          width * (0.7 + starProximity * 0.4)
        );
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        roofGlowMatrices.push(dummy.matrix.clone());
        roofGlowColors.push(
          new THREE.Color(accent).lerp(new THREE.Color(GLOW_WHITE), 0.2 + starProximity * 0.45)
        );
      } else {
        roofGlowMatrices.push(ZERO_SCALE.clone());
        roofGlowColors.push(ZERO_COLOR.clone());
      }

      // Rooftop mechanical equipment — an HVAC/elevator-overrun box
      // and a water tank on a chunk of mid-size-and-up buildings. A
      // perfectly clean rooftop with nothing on it is one of the
      // clearest "this is a rendered asset" tells; real rooftops are
      // cluttered with utility housings.
      const hasRoofEquip = height > 8 && seeded(i, 98) > 0.55;
      if (hasRoofEquip) {
        const equipW = width * (0.16 + seeded(i, 99) * 0.14);
        const equipH = 0.5 + seeded(i, 100) * 0.7;
        const equipX = x + (seeded(i, 101) - 0.5) * width * 0.5;
        const equipZ = z + (seeded(i, 102) - 0.5) * width * 0.5;
        dummy.position.set(equipX, height + equipH / 2, equipZ);
        dummy.scale.set(equipW, equipH, equipW * (0.8 + seeded(i, 103) * 0.6));
        dummy.rotation.set(0, seeded(i, 104) * Math.PI, 0);
        dummy.updateMatrix();
        roofEquipMatrices.push(dummy.matrix.clone());
        roofEquipColors.push(new THREE.Color(0.14, 0.15, 0.17));

        // A second, smaller housing (standing in for a water tank or
        // vent stack) a fraction of the time, tucked at the opposite
        // corner from the equipment box — same shared box geometry as
        // the equipment housing itself, just narrower.
        const hasTank = seeded(i, 105) > 0.55;
        if (hasTank) {
          const tankR = width * (0.1 + seeded(i, 106) * 0.06);
          const tankH = 0.6 + seeded(i, 107) * 0.5;
          dummy.position.set(
            x - (equipX - x),
            height + tankH / 2,
            z - (equipZ - z)
          );
          dummy.scale.set(tankR, tankH, tankR);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          roofEquipMatrices.push(dummy.matrix.clone());
          roofEquipColors.push(new THREE.Color(0.18, 0.17, 0.15));
        }
      }

      // Parapet ledge — a slight overhang where a box tower's walls
      // meet the roof, the same real-building cue as a cornice: the
      // wall doesn't just stop, it caps. The other archetypes already
      // get a clean roofline of their own (cylindrical, faceted-tip,
      // twisted-tip), so this is reserved for the plain box where a
      // hard flat top edge otherwise reads as an unfinished extrusion.
      if (!isRound && !isFaceted && !isTwisted) {
        dummy.position.set(x, height - 0.14, z);
        dummy.scale.set(width * 1.1, 0.3, depth * 1.1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        parapetMatrices.push(dummy.matrix.clone());
        parapetColors.push(new THREE.Color(0.22, 0.27, 0.42));
      } else {
        parapetMatrices.push(ZERO_SCALE.clone());
        parapetColors.push(ZERO_COLOR.clone());
      }

      // No signature glow band / drone landing pads here — those read
      // as sci-fi set dressing rather than anything a real office tower
      // or observation deck would have, so both are omitted entirely
      // (their instanced meshes are still declared below with a fixed
      // zero-scale matrix, since removing the draw calls outright would
      // mean re-threading every other index-aligned array in this pass).
      signatureBandMatrices.push(ZERO_SCALE.clone());
      landingPadMatrices.push(ZERO_SCALE.clone());
      landingPadColors.push(ZERO_COLOR.clone());

      // A small fraction of podium roofs gets a rooftop garden — a
      // real amenity on modern low-rise podiums — weighted toward the
      // buildings nearest the star so that stretch of skyline reads as
      // more built-up right where the camera lingers longest.
      const hasGarden = hasPodium && seeded(i, 60) > 0.85 - starProximity * 0.4;
      if (hasGarden) {
        const podiumHeight = 2.5 + seeded(i, 23) * 3;
        const podiumWidth = width * (1.5 + seeded(i, 24) * 0.6);
        dummy.position.set(x, podiumHeight + 0.05, z);
        dummy.scale.set(podiumWidth * 0.7, 0.05, podiumWidth * 0.7);
        dummy.updateMatrix();
        gardenMatrices.push(dummy.matrix.clone());
        gardenColors.push(new THREE.Color("#4f9e5f"));
      } else {
        gardenMatrices.push(ZERO_SCALE.clone());
        gardenColors.push(ZERO_COLOR.clone());
      }

      // A random subset of tall buildings gets a slim communication/
      // lightning-rod antenna topped with a slow-blinking red aviation
      // warning light — the one blinking light real skyscrapers
      // actually carry, so it's always red rather than rolling a
      // cyan/magenta option.
      const hasAntenna = height > 20 && seeded(i, 58) > 0.68 - starProximity * 0.45;
      if (hasAntenna) {
        const antennaHeight = 2.5 + seeded(i, 22) * 4;
        dummy.position.set(x, height + antennaHeight / 2, z);
        dummy.scale.set(0.05, antennaHeight, 0.05);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        antennaMatrices.push(dummy.matrix.clone());

        dummy.position.set(x, height + antennaHeight, z);
        dummy.scale.set(0.16, 0.16, 0.16);
        dummy.updateMatrix();
        antennaLightMatrices.push(dummy.matrix.clone());
        antennaLightColors.push(new THREE.Color("#ff3b30"));
      } else {
        antennaMatrices.push(ZERO_SCALE.clone());
        antennaLightMatrices.push(ZERO_SCALE.clone());
        antennaLightColors.push(ZERO_COLOR.clone());
      }
    }

    // roofEquipMatrices gets 0, 1, or 2 pushes per building (equipment
    // box, optionally also a tank) rather than the fixed one-per-index
    // every other array here uses — pad it out to its worst-case size
    // (count * 2) with zero-scale placeholders, the same trick
    // DistantSkyline uses for its own variable-per-building window
    // lights, so no stray instance is left sitting at the identity
    // matrix (which would render as a visible box at the origin).
    while (roofEquipMatrices.length < count * 2) {
      roofEquipMatrices.push(ZERO_SCALE.clone());
      roofEquipColors.push(ZERO_COLOR.clone());
    }

    // Same padding trick for hangingGardenMatrices — 0, 1, or 2 bands
    // per building.
    while (hangingGardenMatrices.length < count * 2) {
      hangingGardenMatrices.push(ZERO_SCALE.clone());
      hangingGardenColors.push(ZERO_COLOR.clone());
    }

    return {
      buildingShortMatrices,
      buildingShortColors,
      buildingMedMatrices,
      buildingMedColors,
      buildingTallMatrices,
      buildingTallColors,
      roundMatrices,
      roundColors,
      facetedMatrices,
      facetedColors,
      twistedMatrices,
      twistedColors,
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
      contactShadowMatrices,
      roofEquipMatrices,
      roofEquipColors,
      storefrontMatrices,
      hangingGardenMatrices,
      hangingGardenColors,
      mullionMatrices,
    };
  }, [count, isMobile]);

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
    () =>
      applyInstances(buildingsShortRef.current, data.buildingShortMatrices, data.buildingShortColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(buildingsMedRef.current, data.buildingMedMatrices, data.buildingMedColors),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(buildingsTallRef.current, data.buildingTallMatrices, data.buildingTallColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(roundTowersRef.current, data.roundMatrices, data.roundColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(facetedTowersRef.current, data.facetedMatrices, data.facetedColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(twistedTowersRef.current, data.twistedMatrices, data.twistedColors),
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
    () => applyInstances(contactShadowRef.current, data.contactShadowMatrices),
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
  useLayoutEffect(
    () => applyInstances(roofEquipRef.current, data.roofEquipMatrices, data.roofEquipColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(storefrontRef.current, data.storefrontMatrices),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(hangingGardenRef.current, data.hangingGardenMatrices, data.hangingGardenColors),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(mullionRef.current, data.mullionMatrices),
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
    // Extra flat boost on mobile so the window/roof glow reads
    // brighter on a smaller screen, same reasoning as the body albedo
    // and rig light intensity above.
    const mobileBoost = isMobile ? 0.14 : 0;
    // Windows are lit at full opacity throughout rather than ramping up
    // from a dimmer baseline — the city should read as already-lit
    // from the very first frame, not gradually brightening.
    [windowsARef, windowsBRef].forEach((ref) => {
      const mat = ref.current?.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = 1;
    });

    // A steady rooftop light spill rather than a visible pulse — real
    // rooftop fixtures don't breathe like a neon sign.
    const roofMat = roofGlowRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (roofMat) roofMat.opacity = Math.min(1, 0.4 + mobileBoost);

    // Slow aviation-style blink (~once every couple seconds), not a
    // rapid strobe.
    const antennaMat = antennaLightRef.current?.material as
      | THREE.MeshBasicMaterial
      | undefined;
    if (antennaMat) {
      const blink = Math.sin(t * 1.4) > 0.85 ? 1 : 0.08;
      antennaMat.opacity = Math.min(1, blink + mobileBoost * 0.3);
    }

    {
      const meshA = windowsARef.current;
      const meshB = windowsBRef.current;
      if (meshA && meshB) {
        const steps = 3;
        for (let s = 0; s < steps; s++) {
          const idx = flickerCursor.current % count;
          flickerCursor.current++;
          const lit = seeded(idx, Math.floor(t * 0.5)) > 0.25;
          if (lit) {
            flickerColor.set(ACCENTS[idx % ACCENTS.length]).lerp(new THREE.Color(GLOW_WHITE), 0.25);
          } else {
            flickerColor.set("#050506");
          }
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
          which is why this went unnoticed until the switch to Lambert).
          Phong rather than Lambert specifically for the three glass-
          faced meshes (tower/round/podium): a real curtain-wall facade
          throws back a soft specular highlight where it catches the
          rig light, which is what actually reads as glass rather than
          painted concrete — a low, tight specular (dim color, modest
          shininess) keeps it a subtle sheen rather than a plastic
          sparkle. */}
      <instancedMesh ref={buildingsShortRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.towerShort}
            normalMap={windowNormalMaps.towerShort}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.towerShort}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.towerShort}
            normalMap={windowNormalMaps.towerShort}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.towerShort}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={22}
            fog
          />
        )}
      </instancedMesh>

      <instancedMesh ref={buildingsMedRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.towerMed}
            normalMap={windowNormalMaps.towerMed}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.towerMed}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.towerMed}
            normalMap={windowNormalMaps.towerMed}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.towerMed}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={22}
            fog
          />
        )}
      </instancedMesh>

      <instancedMesh ref={buildingsTallRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.towerTall}
            normalMap={windowNormalMaps.towerTall}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.towerTall}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.towerTall}
            normalMap={windowNormalMaps.towerTall}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.towerTall}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={22}
            fog
          />
        )}
      </instancedMesh>

      {/* Parapet ledge — plain, unlit-facade-tone box; no window map,
          this is trim rather than more facade. */}
      <instancedMesh ref={parapetRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      <instancedMesh ref={roundTowersRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.72, 1, 1, 10]} />
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.round}
            normalMap={windowNormalMaps.round}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.round}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.round}
            normalMap={windowNormalMaps.round}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.round}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={22}
            fog
          />
        )}
      </instancedMesh>

      {/* Sharply tapered hex-frustum tower — a crystalline silhouette
          distinct from both the box and the near-cylindrical round
          tower. */}
      <instancedMesh ref={facetedTowersRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.42, 1, 1, 6]} />
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.faceted}
            normalMap={windowNormalMaps.faceted}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.faceted}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.faceted}
            normalMap={windowNormalMaps.faceted}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.faceted}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={26}
            fog
          />
        )}
      </instancedMesh>

      {/* Organic twisted tower — the geometry itself carries the twist
          (see twistedGeometry above), so this instance just supplies
          the window map/material like every other archetype. */}
      <instancedMesh
        ref={twistedTowersRef}
        args={[twistedGeometry, undefined, count]}
      >
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.twisted}
            normalMap={windowNormalMaps.twisted}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.twisted}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.twisted}
            normalMap={windowNormalMaps.twisted}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.twisted}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={26}
            fog
          />
        )}
      </instancedMesh>

      <instancedMesh ref={podiumsRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        {isMobile ? (
          <meshLambertMaterial
            map={windowMaps.podium}
            normalMap={windowNormalMaps.podium}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            emissiveMap={windowEmissiveMaps.podium}
            emissive="#bfe4ff"
            emissiveIntensity={1.05}
            toneMapped={false}
            fog
          />
        ) : (
          <meshPhongMaterial
            map={windowMaps.podium}
            normalMap={windowNormalMaps.podium}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            emissiveMap={windowEmissiveMaps.podium}
            emissive="#bfe4ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            specular="#3a4a66"
            shininess={18}
            fog
          />
        )}
      </instancedMesh>

      <instancedMesh ref={spiresRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.7, 1, 4]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      {/* toneMapped=false on every additive glow material below: the
          Canvas's default ACES tone mapping compresses/desaturates
          bright highlights toward white, which is what was quietly
          fighting every blue hex value above — Star.tsx's sprites
          already opt out of this for the same reason, this just
          extends that to the city's own glow. */}
      <instancedMesh ref={windowsARef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
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
          toneMapped={false}
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
          toneMapped={false}
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
          color="#7fd4ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Ground contact shadow — multiplied into the ground plane
          beneath each building's foot; MultiplyBlending darkens
          whatever's already there rather than adding light on top, so
          it reads as a shadow rather than another glowing element. */}
      <instancedMesh ref={contactShadowRef} args={[undefined, undefined, count]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial
          color="#4a5568"
          transparent
          blending={THREE.MultiplyBlending}
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
          toneMapped={false}
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
          toneMapped={false}
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
          toneMapped={false}
        />
      </instancedMesh>

      {/* Rooftop mechanical equipment — plain unlit dark boxes/tanks,
          trim rather than more facade, so a real utility housing
          rather than another glass volume. */}
      <instancedMesh ref={roofEquipRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      {/* Street-level storefront glow — a single warm bright band
          reused across every building that gets one, so it doesn't
          need its own per-instance color. */}
      <instancedMesh ref={storefrontRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ffe9c7"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Hanging garden bands — lit rather than fully unlit flat green,
          so the foliage picks up the same rig lighting the structural
          buildings do instead of reading as a flat green decal. */}
      <instancedMesh ref={hangingGardenRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      {/* Real vertical mullion ribs — genuine geometry standing proud
          of the facade (not texture), so box towers actually self-
          shade under the directional light as the camera moves past
          instead of reading as one flat plane from every angle. */}
      <instancedMesh ref={mullionRef} args={[undefined, undefined, count * MAX_MULLIONS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#0e1420" specular="#2c3a55" shininess={20} fog />
      </instancedMesh>
    </group>
  );
}
