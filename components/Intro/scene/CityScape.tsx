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
import { keepClearOfLandmarks } from "./landmarkClearance";
import { getLeafCardTexture } from "./leafTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Per-instance "closed-door" description a door leaf/handle pair needs
// to animate sliding open each frame — everything the automatic-door
// useFrame loop needs to reconstruct that instance's matrix at any
// point in its open/close cycle without re-deriving it from the
// building's own geometry. Only pushed for leaves that actually exist
// (hasEntrance); the fixed-size instancedMesh slots for buildings
// without one are left at ZERO_SCALE once by the initial matrices and
// never touched again per-frame, so this list only needs to cover the
// active subset, not every instance slot.
type DoorMaterial = "glass" | "wood" | "iron";

interface DoorLeafAnim {
  index: number; // this leaf's slot in the count*2 glass/wood/iron/handle/panel arrays
  material: DoorMaterial;
  leafX: number; leafY: number; leafZ: number;
  handleX: number; handleY: number; handleZ: number;
  panelX: number; panelY: number; panelZ: number;
  yaw: number;
  dirX: number; dirZ: number; // unit vector this leaf slides along when opening
  leafDepth: number; leafHeight: number; leafWidth: number;
  handleSize: number; handleHeight: number;
  panelDepth: number; panelHeight: number; panelWidth: number;
  maxSlide: number;
  period: number;
  phase: number;
}

// Smooth 0->1 ease, used for both the open and close legs of the door
// cycle so neither snaps to a standing start/stop.
function smoothstep01(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// Shape of one door's open/close cycle over normalized cycle-time
// [0,1): ease open, hold open, ease closed, hold closed — a real
// automatic door doesn't linger mid-travel or snap between states.
function doorOpenFraction(cycleT: number) {
  const OPEN_END = 0.16;
  const HOLD_OPEN_END = 0.52;
  const CLOSE_END = 0.68;
  if (cycleT < OPEN_END) return smoothstep01(cycleT / OPEN_END);
  if (cycleT < HOLD_OPEN_END) return 1;
  if (cycleT < CLOSE_END) return 1 - smoothstep01((cycleT - HOLD_OPEN_END) / (CLOSE_END - HOLD_OPEN_END));
  return 0;
}

/** World-space (x, z) of a point offset (localX, localZ) from a
 * building's own center, in the building's own local frame, rotated by
 * the building's yaw — for every element meant to sit flush against a
 * box tower's wall (mullions, storefront glow, the entrance canopy/
 * door/bollards). Box towers get a small random yaw of their own (see
 * buildingYaw below) so the skyline doesn't read as a perfectly
 * axis-aligned grid; anything "attached" to the wall has to rotate
 * along with that yaw or it drifts away from the wall's actual angle
 * instead of sitting flush against it — a small drift on a thin
 * mullion rib is easy to miss, but on a large flat door panel it reads
 * as the door floating off the wall or clipping into it. */
function wallAttach(x: number, z: number, yaw: number, localX: number, localZ: number) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return { x: x + localX * cos - localZ * sin, z: z + localX * sin + localZ * cos };
}

// Desaturated at explicit direction — a "luxury tech" skyline keeps
// its accent lighting controlled (cool white, pale silver-blue, pale
// violet, pale warm) rather than fully saturated neon; matches the
// same restrained palette Billboards.tsx uses for its own display
// trim, so signage and facade accents read as one consistent grade.
const ACCENTS = ["#a8d4e8", "#bcdcec", "#8fa8c8", "#dce4ec", "#e8d8b8", "#c0a8d8", "#e0c8a0"];
// What every "lerp toward white" below actually lerps toward — a pale
// blue rather than pure white, so even the brightest, most-washed-out
// glows (rooftops right next to the finale star) keep a visible blue
// cast instead of clipping to plain white.
const GLOW_WHITE = "#dff3ff";
// Real building entrances aren't all one material — a glass curtain-
// wall lobby, a stained hardwood door, and a wrought-iron gate read as
// three completely different kinds of building, not the same door
// repainted. Every color here needs to stay visibly lighter than an
// already near-black facade at night, or it just vanishes the way a
// near-black option tried earlier did.
// Warm, low-shine hardwoods (mahogany, walnut, oak, cherry) — paired
// with a dim/matte specular on the material itself (see the JSX) so
// they read as wood grain catching light, not painted metal.
const DOOR_WOOD_COLORS = ["#6b3f24", "#4a2f1f", "#7a5230", "#5c2e28"];
// Cool, high-shine ironwork (wrought iron, blackened steel, gunmetal,
// oxidized bronze-green) — paired with a bright specular (see the JSX)
// so they read as worked/polished metal, not flat paint.
const DOOR_IRON_COLORS = ["#2e3138", "#454b54", "#3a3d44", "#4a5148"];
const ZERO_SCALE = new THREE.Matrix4().makeScale(0, 0, 0);
const ZERO_COLOR = new THREE.Color(0, 0, 0);
// Reused every frame for the antenna beacon blink below rather than
// allocating a new THREE.Color per building per frame.
const antennaTmpColor = new THREE.Color();
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
  // Raised back from 38/68 toward the earlier 55/95 level at explicit
  // "empty spaces" complaint — cutting density that far (on top of each
  // building's own random seeded spread, cross-street gaps, and the
  // large forced-empty bands landmarkClearance.ts carves out around
  // each landmark) left visibly bare stretches of skyline between
  // buildings rather than the intended "more room to register each
  // shape." The per-archetype variety (round/faceted/pyramid/twisted/
  // box) already does the work of keeping a denser skyline from reading
  // as repeated silhouettes, so filling back in doesn't reintroduce the
  // "wall-to-wall same shape" problem the earlier cut was solving.
  // Raised again (55/95 -> 66/115) alongside the z-range widening below
  // — at explicit "buildings behind the glow, on the road side" feedback
  // (the star's own halo grows huge near the very end and there was
  // nothing placed far enough down the road to still be visible through
  // it), so density needed to hold steady across the longer range
  // rather than getting spread thinner over it.
  const count = isMobile ? 66 : 115;
  // Six box-tower slots — [shortA, shortB, medA, medB, tallA, tallB],
  // index = heightBucket*2 + variant (see the `data` useMemo below and
  // BOX_TOWER_BUCKETS further down) — a plain array-of-refs rather than
  // six individually-named useRef calls so the matching JSX and
  // useLayoutEffect application can both just loop over the same six
  // indices instead of six hand-written near-duplicates.
  const boxTowerRefs = useRef<(THREE.InstancedMesh | null)[]>([null, null, null, null, null, null]);
  const roundTowersRef = useRef<THREE.InstancedMesh>(null);
  const facetedTowersRef = useRef<THREE.InstancedMesh>(null);
  const twistedTowersRef = useRef<THREE.InstancedMesh>(null);
  const pyramidTowersRef = useRef<THREE.InstancedMesh>(null);
  const podiumsRef = useRef<THREE.InstancedMesh>(null);
  const windowsARef = useRef<THREE.InstancedMesh>(null);
  const windowsBRef = useRef<THREE.InstancedMesh>(null);
  const spiresRef = useRef<THREE.InstancedMesh>(null);
  const roofGlowRef = useRef<THREE.InstancedMesh>(null);
  const landingPadsRef = useRef<THREE.InstancedMesh>(null);
  const gardensRef = useRef<THREE.InstancedMesh>(null);
  const roofTreeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const roofTreeCanopyRef = useRef<THREE.InstancedMesh>(null);
  const leafTexture = useMemo(() => getLeafCardTexture(), []);
  const signatureBandRef = useRef<THREE.InstancedMesh>(null);
  const antennaRef = useRef<THREE.InstancedMesh>(null);
  const antennaLightRef = useRef<THREE.InstancedMesh>(null);
  const parapetRef = useRef<THREE.InstancedMesh>(null);
  const contactShadowRef = useRef<THREE.InstancedMesh>(null);
  const roofEquipRef = useRef<THREE.InstancedMesh>(null);
  const storefrontRef = useRef<THREE.InstancedMesh>(null);
  const hangingGardenRef = useRef<THREE.InstancedMesh>(null);
  const mullionRef = useRef<THREE.InstancedMesh>(null);
  const entranceCanopyRef = useRef<THREE.InstancedMesh>(null);
  const entranceGlowRef = useRef<THREE.InstancedMesh>(null);
  const entrancePillarRef = useRef<THREE.InstancedMesh>(null);
  const entranceDoorFrameRef = useRef<THREE.InstancedMesh>(null);
  const entranceDoorGlassRef = useRef<THREE.InstancedMesh>(null);
  const entranceDoorWoodRef = useRef<THREE.InstancedMesh>(null);
  const entranceDoorIronRef = useRef<THREE.InstancedMesh>(null);
  const entranceDoorHandleRef = useRef<THREE.InstancedMesh>(null);
  const entranceDoorPanelRef = useRef<THREE.InstancedMesh>(null);
  const entranceKickPlateRef = useRef<THREE.InstancedMesh>(null);

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
    const base = getWindowGridTexture(0);
    // A second, independently-seeded base canvas for the box towers'
    // "B" variant — see pushBoxTower/BOX_TOWER_BUCKETS below for why
    // two variants exist at all. Only the box-tower buckets get a B
    // variant (round/faceted/twisted/podium are each already a small
    // minority of the skyline, so cross-building repetition there is
    // far less noticeable than it was for the box towers, which make
    // up most of the skyline).
    const baseB = getWindowGridTexture(1);
    // Vertical repeats scaled down from the original 11-row-tile
    // values by 11/60 now that the base grid itself carries 60 unique
    // rows (see getWindowGridTexture) — same on-screen window density
    // as before, but each bucket now tiles under 4x instead of up to
    // 20x, which is what was reading as an obviously-repeated printed
    // pattern rather than distinct floors.
    const towerShort = base.clone();
    towerShort.repeat.set(3, 0.92);
    towerShort.needsUpdate = true;
    const towerShortB = baseB.clone();
    towerShortB.repeat.set(3, 0.92);
    towerShortB.needsUpdate = true;
    const towerMed = base.clone();
    towerMed.repeat.set(3, 2.02);
    towerMed.needsUpdate = true;
    const towerMedB = baseB.clone();
    towerMedB.repeat.set(3, 2.02);
    towerMedB.needsUpdate = true;
    const towerTall = base.clone();
    towerTall.repeat.set(3, 3.67);
    towerTall.needsUpdate = true;
    const towerTallB = baseB.clone();
    towerTallB.repeat.set(3, 3.67);
    towerTallB.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 1.65);
    round.needsUpdate = true;
    const faceted = base.clone();
    faceted.repeat.set(4, 1.65);
    faceted.needsUpdate = true;
    const twisted = base.clone();
    twisted.repeat.set(3, 1.83);
    twisted.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 0.46);
    podium.needsUpdate = true;
    return {
      towerShort,
      towerShortB,
      towerMed,
      towerMedB,
      towerTall,
      towerTallB,
      round,
      faceted,
      twisted,
      podium,
    };
  }, []);

  // Emissive counterpart to windowMaps, same repeats so the glow mask
  // lines up pane-for-pane with the diffuse grid it's layered under.
  const windowEmissiveMaps = useMemo(() => {
    const base = getWindowEmissiveTexture(0);
    const baseB = getWindowEmissiveTexture(1);
    // Vertical repeats scaled down from the original 11-row-tile
    // values by 11/60 now that the base grid itself carries 60 unique
    // rows (see getWindowGridTexture) — same on-screen window density
    // as before, but each bucket now tiles under 4x instead of up to
    // 20x, which is what was reading as an obviously-repeated printed
    // pattern rather than distinct floors.
    const towerShort = base.clone();
    towerShort.repeat.set(3, 0.92);
    towerShort.needsUpdate = true;
    const towerShortB = baseB.clone();
    towerShortB.repeat.set(3, 0.92);
    towerShortB.needsUpdate = true;
    const towerMed = base.clone();
    towerMed.repeat.set(3, 2.02);
    towerMed.needsUpdate = true;
    const towerMedB = baseB.clone();
    towerMedB.repeat.set(3, 2.02);
    towerMedB.needsUpdate = true;
    const towerTall = base.clone();
    towerTall.repeat.set(3, 3.67);
    towerTall.needsUpdate = true;
    const towerTallB = baseB.clone();
    towerTallB.repeat.set(3, 3.67);
    towerTallB.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 1.65);
    round.needsUpdate = true;
    const faceted = base.clone();
    faceted.repeat.set(4, 1.65);
    faceted.needsUpdate = true;
    const twisted = base.clone();
    twisted.repeat.set(3, 1.83);
    twisted.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 0.46);
    podium.needsUpdate = true;
    return {
      towerShort,
      towerShortB,
      towerMed,
      towerMedB,
      towerTall,
      towerTallB,
      round,
      faceted,
      twisted,
      podium,
    };
  }, []);

  // Bump counterpart to windowMaps, same repeats so the derived surface
  // normal lines up pane-for-pane with the diffuse grid — this is what
  // actually breaks the "flat printed texture" read: each pane now has
  // a real (if subtle) raised-glass-in-a-recessed-frame bevel that the
  // rig light rakes across differently depending on viewing angle,
  // instead of every face responding to light exactly like a plain
  // untextured box regardless of what's painted on it.
  const windowNormalMaps = useMemo(() => {
    // Same texture regardless of variant (see getWindowNormalTexture —
    // the bevel pattern doesn't depend on which panes are lit), so the
    // "B" clones here are just clones of the same base rather than a
    // second independently-seeded canvas like the diffuse/emissive
    // maps get. Still exposed under matching B keys so the JSX below
    // can reference all six box-tower buckets uniformly.
    const base = getWindowNormalTexture();
    // Vertical repeats scaled down from the original 11-row-tile
    // values by 11/60 now that the base grid itself carries 60 unique
    // rows (see getWindowGridTexture) — same on-screen window density
    // as before, but each bucket now tiles under 4x instead of up to
    // 20x, which is what was reading as an obviously-repeated printed
    // pattern rather than distinct floors.
    const towerShort = base.clone();
    towerShort.repeat.set(3, 0.92);
    towerShort.needsUpdate = true;
    const towerShortB = base.clone();
    towerShortB.repeat.set(3, 0.92);
    towerShortB.needsUpdate = true;
    const towerMed = base.clone();
    towerMed.repeat.set(3, 2.02);
    towerMed.needsUpdate = true;
    const towerMedB = base.clone();
    towerMedB.repeat.set(3, 2.02);
    towerMedB.needsUpdate = true;
    const towerTall = base.clone();
    towerTall.repeat.set(3, 3.67);
    towerTall.needsUpdate = true;
    const towerTallB = base.clone();
    towerTallB.repeat.set(3, 3.67);
    towerTallB.needsUpdate = true;
    const round = base.clone();
    round.repeat.set(5, 1.65);
    round.needsUpdate = true;
    const faceted = base.clone();
    faceted.repeat.set(4, 1.65);
    faceted.needsUpdate = true;
    const twisted = base.clone();
    twisted.repeat.set(3, 1.83);
    twisted.needsUpdate = true;
    const podium = base.clone();
    podium.repeat.set(4, 0.46);
    podium.needsUpdate = true;
    return {
      towerShort,
      towerShortB,
      towerMed,
      towerMedB,
      towerTall,
      towerTallB,
      round,
      faceted,
      twisted,
      podium,
    };
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

  // A plain BoxGeometry with its top four vertices pulled inward — the
  // box tower's actual silhouette narrows toward the roof instead of
  // standing as one uniform rectangular slab top to bottom, which was
  // the single biggest thing making it read as "the clumsy one" next
  // to the round/faceted/twisted archetypes' already-tapered profiles.
  // Nudged from a shallow 86% taper to 78% at explicit request for a
  // more premium/slender profile — still short of a dramatic wedding-
  // cake silhouette: the entrance/mullion system below positions
  // itself using the tower's *base* width the whole way up, and both
  // sit low on the tower (entrances at street level, mullions weighted
  // toward the lower/mid facade), so the extra taper at the very top
  // doesn't leave them visibly floating outside the narrower upper
  // facade. Kept axis-aligned (only X/Z scaled at the top vertices, not
  // rotated the way the twisted tower's geometry is) so each side stays
  // a single flat trapezoidal face — the window texture (painted
  // directly onto these faces, not separate window instances) and
  // every wall-attached element's flat-face assumption both still hold.
  const taperedBoxGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const pos = geo.attributes.position;
    const TOP_SCALE = 0.78;
    const v = new THREE.Vector3();
    for (let idx = 0; idx < pos.count; idx++) {
      v.fromBufferAttribute(pos, idx);
      if (v.y > 0) {
        pos.setXYZ(idx, v.x * TOP_SCALE, v.y, v.z * TOP_SCALE);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    // Six buckets rather than three: each height tier (short/med/tall)
    // now has two independently-seeded window-texture variants (see
    // BOX_TOWER_BUCKETS below), so two adjacent same-height box towers
    // have a real chance of landing on different lit/unlit patterns
    // instead of every "tall" building in the skyline sharing the
    // literal same window arrangement. Index = bucket*2 + variant.
    const boxTowerMatrices: THREE.Matrix4[][] = Array.from({ length: 6 }, () => []);
    const boxTowerColors: THREE.Color[][] = Array.from({ length: 6 }, () => []);
    // Pushes into exactly one of the six box-tower buckets (or none,
    // for archetypes that aren't a plain box) and ZERO_SCALE into the
    // rest — the same pattern this file already uses everywhere else,
    // just centralized here instead of six duplicated push pairs at
    // every call site.
    const pushBoxTower = (activeIdx: number | null, matrix?: THREE.Matrix4, color?: THREE.Color) => {
      for (let k = 0; k < 6; k++) {
        if (k === activeIdx && matrix && color) {
          boxTowerMatrices[k].push(matrix);
          boxTowerColors[k].push(color);
        } else {
          boxTowerMatrices[k].push(ZERO_SCALE.clone());
          boxTowerColors[k].push(ZERO_COLOR.clone());
        }
      }
    };
    const mullionMatrices: THREE.Matrix4[] = [];
    const roundMatrices: THREE.Matrix4[] = [];
    const roundColors: THREE.Color[] = [];
    const facetedMatrices: THREE.Matrix4[] = [];
    const facetedColors: THREE.Color[] = [];
    const twistedMatrices: THREE.Matrix4[] = [];
    const twistedColors: THREE.Color[] = [];
    // A sharp, windowless obelisk/monolith — a genuinely different kind
    // of mass than every other archetype here (all variations on a
    // glass office tower): a solid four-sided pyramid spire with no
    // window grid, just a body tint and the same generic accent-strip
    // pass every archetype already gets. Reads as a landmark/civic
    // structure planted among the office towers rather than one more
    // workplace silhouette.
    const pyramidMatrices: THREE.Matrix4[] = [];
    const pyramidColors: THREE.Color[] = [];
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
    // Up to 4 rooftop trees/shrubs per building (see hasGreenRoof
    // below) — padded per-building the same way hangingGardenMatrices
    // already pads its own variable 0-3 bands.
    const roofTreeTrunkAllMatrices: THREE.Matrix4[] = [];
    const roofTreeCanopyAllMatrices: THREE.Matrix4[] = [];
    const roofTreeCanopyAllColors: THREE.Color[] = [];
    const antennaMatrices: THREE.Matrix4[] = [];
    const antennaLightMatrices: THREE.Matrix4[] = [];
    const antennaLightColors: THREE.Color[] = [];
    // Per-building phase offset for the antenna beacon's blink — see
    // the useFrame block below: without this every beacon blinked on
    // the exact same shared material opacity, so the whole skyline's
    // aviation lights flashed in perfect unison like a synchronized
    // light show, which reads as mechanical rather than a real city
    // where each building's beacon runs on its own clock.
    const antennaPhases: number[] = [];
    const parapetMatrices: THREE.Matrix4[] = [];
    const parapetColors: THREE.Color[] = [];
    const signatureBandMatrices: THREE.Matrix4[] = [];
    const contactShadowMatrices: THREE.Matrix4[] = [];
    const roofEquipMatrices: THREE.Matrix4[] = [];
    const roofEquipColors: THREE.Color[] = [];
    const storefrontMatrices: THREE.Matrix4[] = [];
    const hangingGardenMatrices: THREE.Matrix4[] = [];
    const hangingGardenColors: THREE.Color[] = [];
    const entranceCanopyMatrices: THREE.Matrix4[] = [];
    const entranceGlowMatrices: THREE.Matrix4[] = [];
    const entrancePillarMatrices: THREE.Matrix4[] = [];
    const entranceDoorFrameMatrices: THREE.Matrix4[] = [];
    const entranceDoorGlassMatrices: THREE.Matrix4[] = [];
    const entranceDoorWoodMatrices: THREE.Matrix4[] = [];
    const entranceDoorWoodColors: THREE.Color[] = [];
    const entranceDoorIronMatrices: THREE.Matrix4[] = [];
    const entranceDoorIronColors: THREE.Color[] = [];
    const entranceDoorHandleMatrices: THREE.Matrix4[] = [];
    const entranceDoorPanelMatrices: THREE.Matrix4[] = [];
    const entranceKickPlateMatrices: THREE.Matrix4[] = [];
    const doorLeafAnims: DoorLeafAnim[] = [];
    // Tracks how many leaf slots (2 per building, active or not) have
    // been pushed so far — the glass/solid/handle arrays are built by
    // one push per leaf regardless of whether that building actually
    // has an entrance, so this is also each leaf's index in those
    // count*2 instancedMeshes.
    let doorLeafSlot = 0;

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      // Only box towers get a meaningful value here (set below, inside
      // that branch) — round/faceted/twisted towers use their own full
      // free rotation instead of a small wall-aligning yaw, since a
      // curved facade doesn't have a single flush "wall" for
      // storefront/entrance elements to align to the way a box does.
      let buildingYaw = 0;
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
      // Also nudged clear of any fixed landmark set-piece on the same
      // side (the MDS sphere, NoorvaTower, Waterfall, Biodome, SkyPlaza
      // — see landmarkClearance.ts) — those are placed independently of
      // this procedural pass and otherwise had no way to keep a
      // randomly-rolled building from landing right on top of one.
      // Range widened twice now: 165 -> 180 (min z -110 -> -125) so the
      // formula could reach the star at z=-122 at all, then 180 -> 220
      // (min z -> -165) at the follow-up "buildings at the back side of
      // the glow too, on the road side" feedback — the star's halo
      // grows to fill much of the frame right at the very end (see
      // Star.tsx's growth curve), and with nothing placed past it the
      // view through/around that glow was pure empty light. Buildings
      // now continue in the same near-road lane well behind the star's
      // position, so the corridor still reads as city rather than
      // trailing off into a void right where the glow is brightest.
      const z = keepClearOfLandmarks(keepClearOfCrossStreets(55 - seeded(i, 2) * 220), side);
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
      // Pushed further (0.4 -> 0.58) at explicit request for a more
      // "premium supertall" read — the reference skyline's towers are
      // dramatically taller than they are wide, not just moderately
      // tapered office blocks.
      const heightFactor = clamp01((height - 4) / 50);
      const width = (1.5 + seeded(i, 4) * 4.6) * (1.15 - heightFactor * 0.58);
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
      // Five silhouettes now (round, faceted, pyramid, twisted, box),
      // weighted toward the organic/sculptural ones and the new
      // windowless pyramid archetype specifically to break up "every
      // building is some kind of glass office tower" — box pushed down
      // again (24% -> ~18%) at explicit request after the skyline still
      // read as "ordinary boxy towers" from most angles; the other four
      // archetypes split the rest. One probability-based roll (not
      // `i % n`) so the mix doesn't fall into a visible repeating
      // pattern as the camera passes.
      const archetypeRoll = seeded(i, 55);
      const isRound = archetypeRoll > 0.72;
      const isFaceted = !isRound && archetypeRoll > 0.53;
      // A sharp windowless pyramid/obelisk — the one archetype in this
      // mix that isn't a variation on a glass office tower, so it reads
      // as a distinct kind of structure (monument, civic building)
      // rather than another workplace silhouette at a different scale.
      const isPyramid = !isRound && !isFaceted && archetypeRoll > 0.4;
      // The twisted tower's window texture is deliberately left
      // unwrapped to the *un-twisted* geometry (see twistedGeometry
      // below) so the horizontal window rows spiral up the facade as
      // the tower turns — a real "twisted skyscraper" cue at a normal
      // viewing distance. Right at the camera's own starting point,
      // though, that same spiral gets viewed close enough and near
      // edge-on that the individual windows blur together into a solid
      // field of diagonal stripes instead of a recognizable facade —
      // reads as a rendering glitch, not architecture. Keeping this
      // archetype out of the tight near-camera band (see startBias
      // above) sidesteps the one distance/angle combination where the
      // effect breaks down, while leaving it untouched everywhere else
      // it's actually seen from a normal distance.
      const isTwisted =
        !isRound && !isFaceted && !isPyramid && archetypeRoll > 0.2 && startBias < 0.5;

      // Six distinct facade material families rather than one fixed
      // hue with barely-perceptible per-building drift (the previous
      // version varied warmth by only ~0.006-0.008 out of a 0.1-0.3
      // base — under 3% relative difference, which is why the whole
      // skyline read as "the same building repeated" regardless of how
      // much archetype/silhouette variety sat on top of it). Real
      // skylines mix genuinely different claddings: navy and near-black
      // glass, neutral charcoal, warm bronze/copper glass, bright
      // silver steel, and cool teal glass — picking a family per
      // building is what actually reads as material variety at a
      // glance, before the eye even gets to silhouette.
      const MATERIAL_FAMILIES = [
        { r: 0.07, g: 0.09, b: 0.15 }, // deep navy glass
        { r: 0.12, g: 0.12, b: 0.13 }, // neutral charcoal
        { r: 0.19, g: 0.13, b: 0.08 }, // warm bronze/copper glass
        { r: 0.21, g: 0.22, b: 0.24 }, // bright silver steel
        { r: 0.06, g: 0.15, b: 0.14 }, // cool teal glass
        { r: 0.035, g: 0.04, b: 0.05 }, // near-black obsidian
      ];
      const family = MATERIAL_FAMILIES[Math.floor(seeded(i, 64) * MATERIAL_FAMILIES.length)];
      // This is a real reflectance value now that the body is lit (see
      // the rig lights in IntroCinematic) rather than a raw output
      // color — a genuinely near-zero albedo stays black no matter how
      // much light hits it, which is what made every face read as the
      // same flat cutout regardless of which way it faced. Brighter
      // base reflectance on mobile — a scene lit for a desktop monitor
      // reads noticeably dimmer on a smaller, typically outdoor/
      // handheld screen, and mobile also lost the Phong specular sheen
      // (see the material choice below) that desktop uses to add a bit
      // of extra highlight brightness.
      const brightnessMul = (0.75 + seeded(i, 6) * 0.75) * (isMobile ? 1.4 : 1);
      const jitter = 0.02;
      const bodyColor = new THREE.Color(
        family.r * brightnessMul + (seeded(i, 65) - 0.5) * jitter,
        family.g * brightnessMul + (seeded(i, 66) - 0.5) * jitter,
        family.b * brightnessMul + (seeded(i, 67) - 0.5) * jitter
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
        pushBoxTower(null);
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
        twistedMatrices.push(ZERO_SCALE.clone());
        twistedColors.push(ZERO_COLOR.clone());
        pyramidMatrices.push(ZERO_SCALE.clone());
        pyramidColors.push(ZERO_COLOR.clone());
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
        pushBoxTower(null);
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        twistedMatrices.push(ZERO_SCALE.clone());
        twistedColors.push(ZERO_COLOR.clone());
        pyramidMatrices.push(ZERO_SCALE.clone());
        pyramidColors.push(ZERO_COLOR.clone());
        for (let r = 0; r < MAX_MULLIONS; r++) mullionMatrices.push(ZERO_SCALE.clone());
      } else if (isPyramid) {
        // A sharp four-sided pyramid — solid, windowless, tinted with
        // the same per-building body color every other archetype uses
        // (see pyramidTowersRef's material below: no map, so the base
        // color comes through untouched). Scaled slightly narrower than
        // the other archetypes' own width factors so a tall, pointed
        // monolith reads as a spire rather than a squat wedge.
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width * 0.66, height, width * 0.66);
        dummy.rotation.set(0, seeded(i, 5) * Math.PI, 0);
        dummy.updateMatrix();
        pyramidMatrices.push(dummy.matrix.clone());
        pyramidColors.push(bodyColor);
        pushBoxTower(null);
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
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
        pushBoxTower(null);
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
        pyramidMatrices.push(ZERO_SCALE.clone());
        pyramidColors.push(ZERO_COLOR.clone());
        for (let r = 0; r < MAX_MULLIONS; r++) mullionMatrices.push(ZERO_SCALE.clone());
      } else {
        // Rectangular rather than square footprint — see the `depth`
        // comment above. Biased slightly wide-of-square more often than
        // narrow (real slab towers are more commonly wider along one
        // face than perfectly square) but the range covers both.
        depth = width * (0.6 + seeded(i, 63) * 0.75);
        buildingYaw = (seeded(i, 5) - 0.5) * 0.3;
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(width, height, depth);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        // Routed into one of three height buckets (see windowMaps
        // above) so its window rows use a repeat tuned to roughly its
        // own height instead of one fixed repeat shared by every box
        // tower from 4 to 54 units tall — and within that bucket, one
        // of two independently-seeded texture variants (see
        // pushBoxTower above) so neighboring same-height towers aren't
        // guaranteed to show the identical window pattern.
        const heightBucket = height <= 16 ? 0 : height <= 32 ? 1 : 2;
        const variant = seeded(i, 211) > 0.5 ? 1 : 0;
        pushBoxTower(heightBucket * 2 + variant, dummy.matrix.clone(), bodyColor);
        roundMatrices.push(ZERO_SCALE.clone());
        roundColors.push(ZERO_COLOR.clone());
        facetedMatrices.push(ZERO_SCALE.clone());
        facetedColors.push(ZERO_COLOR.clone());
        twistedMatrices.push(ZERO_SCALE.clone());
        twistedColors.push(ZERO_COLOR.clone());
        pyramidMatrices.push(ZERO_SCALE.clone());
        pyramidColors.push(ZERO_COLOR.clone());

        // Real vertical mullion ribs on the road-facing side, evenly
        // spaced and standing slightly proud of the wall — genuine 3D
        // structure rather than another layer of texture, so the
        // facade actually shades itself as the camera passes instead
        // of reading as a flat printed pattern from every angle.
        const ribCount = Math.max(4, Math.min(MAX_MULLIONS, Math.round(depth * 1.3)));
        for (let r = 0; r < MAX_MULLIONS; r++) {
          if (r < ribCount) {
            const t = (r + 1) / (ribCount + 1) - 0.5;
            const p = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.05), t * depth * 0.94);
            dummy.position.set(p.x, height / 2, p.z);
            dummy.scale.set(0.06, height * 0.99, 0.1);
            dummy.rotation.set(0, buildingYaw, 0);
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
        const p = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.03), 0);
        dummy.position.set(p.x, 0.45, p.z);
        dummy.scale.set(0.05, 0.4, depth * 0.92);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        storefrontMatrices.push(dummy.matrix.clone());
      } else {
        storefrontMatrices.push(ZERO_SCALE.clone());
      }

      // A double-height ground-floor entrance — a real, proportioned
      // double door (two narrow glass leaves in a dark frame) rather
      // than a small barely-visible door or an undifferentiated wide
      // glass wall. Almost every tall-enough building gets one now (a
      // small door was easy to make "occasional set dressing"; a
      // building's one main entrance is not), and the glazing itself is
      // always brightly lit — a grand entrance reads as inhabited/alive
      // from a distance, which a dim/unlit variant (tried in an earlier
      // pass) never did. A wide canopy overhang, the door itself boxed
      // in its own jamb/header frame, and bollards flanking the whole
      // thing.
      const hasEntrance = height > 7 && seeded(i, 220) > 0.15;
      if (hasEntrance) {
        const lobbyWidth = Math.min(width * 0.82, depth * 0.82, 6);
        const lobbyHeight = 3.6 + seeded(i, 223) * 1.2;
        // Kept shallow rather than the 1.6-2.4 this used to reach —
        // street trees/lights/holo-ads all live in their own narrow
        // road-shoulder corridor (x ~9.2-10.5, independently placed —
        // see StreetTrees/StreetLights/HoloAds), and a building's near
        // face can land as close as x~9-11 itself depending on its own
        // width/offset roll. A deep canopy routinely reached straight
        // into that corridor and got swallowed by a tree canopy sitting
        // right in front of it — the door was being built correctly,
        // just permanently hidden behind foliage. Staying shallow keeps
        // the entrance's footprint close enough to the wall to clear
        // that corridor in the large majority of rolls.
        const projection = 0.9 + seeded(i, 221) * 0.5;
        const canopyY = lobbyHeight + 0.35;

        // Every element below is offset purely along the wall-normal
        // axis (localZ stays 0), so wallAttach only ever needs to
        // rotate that single localX offset — but it still has to go
        // through wallAttach rather than a plain `x - side*(...)`,
        // because that offset is in the *building's own* local frame:
        // for a yawed building, "outward from the wall" is no longer
        // simply "along world X".
        const canopyP = wallAttach(x, z, buildingYaw, -side * (width / 2 + projection / 2), 0);
        dummy.position.set(canopyP.x, canopyY, canopyP.z);
        dummy.scale.set(projection, 0.16, lobbyWidth * 1.08);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        entranceCanopyMatrices.push(dummy.matrix.clone());

        dummy.position.set(canopyP.x, canopyY - 0.1, canopyP.z);
        dummy.scale.set(projection * 0.92, 0.02, lobbyWidth * 1.0);
        dummy.updateMatrix();
        entranceGlowMatrices.push(dummy.matrix.clone());

        const pillarHalfSpan = lobbyWidth * 0.56;
        [-1, 1].forEach((wz) => {
          const p = wallAttach(x, z, buildingYaw, -side * (width / 2 + projection), wz * pillarHalfSpan);
          dummy.position.set(p.x, 0.65, p.z);
          dummy.scale.set(0.09, 1.3, 0.09);
          dummy.rotation.set(0, buildingYaw, 0);
          dummy.updateMatrix();
          entrancePillarMatrices.push(dummy.matrix.clone());
        });

        // The actual door — real double-door proportions (two narrow,
        // human-scale leaves, not a wall-wide glass pane) so up close
        // it reads as a door someone could walk through, while the
        // canopy/glow/bollards above still give the entrance presence
        // from a distance.
        // Widened from the geometrically-"correct" 0.06 gap/0.1 jambs —
        // at the distance this is actually seen from during the fly-
        // through, that thin a split and frame anti-aliased down to a
        // few pixels and the whole assembly read as a single flat grey
        // panel rather than a recognizable double door. Bolder here
        // reads better at speed even though it's less true to a real
        // door's proportions up close.
        const doorLeafWidth = 0.85 + seeded(i, 224) * 0.15;
        const doorGap = 0.16;
        const doorWidth = doorLeafWidth * 2 + doorGap;
        const jambWidth = 0.14;
        const headerHeight = 0.22;

        // Roughly a three-way split rather than every entrance sharing
        // one material — glass, stained hardwood, and worked iron are
        // three genuinely different KINDS of building entrance in real
        // architecture (a glass curtain-wall lobby, a townhouse's
        // wooden door, a wrought-iron gate), not one door repainted.
        // Wood and iron get their own separate material below (matte
        // low-shine vs. bright high-shine specular — a color swap
        // alone can't tell a painted metal door from real wood grain).
        const materialRoll = seeded(i, 226);
        const doorMaterial: DoorMaterial =
          materialRoll > 0.66 ? "glass" : materialRoll > 0.33 ? "wood" : "iron";

        // Every entrance's doors slide open and shut on their own
        // automatic-door cycle (see doorOpenFraction/useFrame below) —
        // a closed door, however well detailed, still reads as a solid
        // wall panel; actually seeing it part company and reveal a dark
        // opening behind it is what makes it unambiguous that this is a
        // functioning entrance and not just more facade. A per-building
        // period/phase (not one shared clock) so the skyline's doors
        // don't all snap open in visible unison.
        const doorPeriod = 4 + seeded(i, 229) * 3;
        const doorPhase = seeded(i, 230) * doorPeriod;
        const slideDirX = -Math.sin(buildingYaw);
        const slideDirZ = Math.cos(buildingYaw);

        // A real slab, not a decal — 0.05 used to give the leaf almost
        // no actual thickness, so from anywhere off dead-center it read
        // as a flat painted rectangle rather than an object standing
        // proud of the wall. Thick enough now to catch a visible edge
        // highlight from the rig light as the camera passes.
        const leafDepth = 0.16;
        // A raised center panel, proud of the leaf's own outer face —
        // the single detail that makes an opaque door read as a molded
        // 3D object (light/shadow across its own edges) instead of a
        // flat painted color swatch. Only on the wood/iron variants;
        // a glass leaf is a pane, not a paneled door, so it stays flat.
        const panelDepth = 0.07;
        const panelOffsetFromWall = 0.07 + leafDepth / 2 + panelDepth / 2;
        const panelWidth = doorLeafWidth * 0.58;
        const panelHeight = lobbyHeight * 0.94 * 0.68;

        [-1, 1].forEach((leaf) => {
          const leafOffset = leaf * (doorLeafWidth / 2 + doorGap / 2);
          const p = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.07), leafOffset);
          dummy.position.set(p.x, lobbyHeight / 2, p.z);
          dummy.scale.set(leafDepth, lobbyHeight * 0.94, doorLeafWidth);
          dummy.rotation.set(0, buildingYaw, 0);
          dummy.updateMatrix();
          if (doorMaterial === "glass") {
            entranceDoorGlassMatrices.push(dummy.matrix.clone());
            entranceDoorWoodMatrices.push(ZERO_SCALE.clone());
            entranceDoorWoodColors.push(ZERO_COLOR.clone());
            entranceDoorIronMatrices.push(ZERO_SCALE.clone());
            entranceDoorIronColors.push(ZERO_COLOR.clone());
          } else if (doorMaterial === "wood") {
            entranceDoorWoodMatrices.push(dummy.matrix.clone());
            entranceDoorWoodColors.push(
              new THREE.Color(DOOR_WOOD_COLORS[Math.floor(seeded(i, 227) * DOOR_WOOD_COLORS.length)])
            );
            entranceDoorGlassMatrices.push(ZERO_SCALE.clone());
            entranceDoorIronMatrices.push(ZERO_SCALE.clone());
            entranceDoorIronColors.push(ZERO_COLOR.clone());
          } else {
            entranceDoorIronMatrices.push(dummy.matrix.clone());
            entranceDoorIronColors.push(
              new THREE.Color(DOOR_IRON_COLORS[Math.floor(seeded(i, 227) * DOOR_IRON_COLORS.length)])
            );
            entranceDoorGlassMatrices.push(ZERO_SCALE.clone());
            entranceDoorWoodMatrices.push(ZERO_SCALE.clone());
            entranceDoorWoodColors.push(ZERO_COLOR.clone());
          }

          // A handle bar on each leaf's inner edge — the single detail
          // that reads as "operable door" rather than "fixed panel",
          // on both door finishes (a glass door still has a handle).
          const handleP = wallAttach(
            x,
            z,
            buildingYaw,
            -side * (width / 2 + 0.1),
            leafOffset - leaf * doorLeafWidth * 0.32
          );
          dummy.position.set(handleP.x, lobbyHeight * 0.42, handleP.z);
          dummy.scale.set(0.045, lobbyHeight * 0.32, 0.045);
          dummy.rotation.set(0, buildingYaw, 0);
          dummy.updateMatrix();
          entranceDoorHandleMatrices.push(dummy.matrix.clone());

          const panelP = wallAttach(x, z, buildingYaw, -side * (width / 2 + panelOffsetFromWall), leafOffset);
          if (doorMaterial !== "glass") {
            dummy.position.set(panelP.x, lobbyHeight / 2, panelP.z);
            dummy.scale.set(panelDepth, panelHeight, panelWidth);
            dummy.rotation.set(0, buildingYaw, 0);
            dummy.updateMatrix();
            entranceDoorPanelMatrices.push(dummy.matrix.clone());
          } else {
            entranceDoorPanelMatrices.push(ZERO_SCALE.clone());
          }

          doorLeafAnims.push({
            index: doorLeafSlot,
            material: doorMaterial,
            leafX: p.x,
            leafY: lobbyHeight / 2,
            leafZ: p.z,
            handleX: handleP.x,
            handleY: lobbyHeight * 0.42,
            handleZ: handleP.z,
            panelX: panelP.x,
            panelY: lobbyHeight / 2,
            panelZ: panelP.z,
            yaw: buildingYaw,
            dirX: leaf * slideDirX,
            dirZ: leaf * slideDirZ,
            leafDepth,
            leafHeight: lobbyHeight * 0.94,
            leafWidth: doorLeafWidth,
            handleSize: 0.045,
            handleHeight: lobbyHeight * 0.32,
            panelDepth,
            panelHeight,
            panelWidth,
            maxSlide: doorLeafWidth * 0.95,
            period: doorPeriod,
            phase: doorPhase,
          });
          doorLeafSlot++;
        });

        // A raised kick plate along the door's base — real doors take a
        // scuffed metal strip at foot height; without it the leaves
        // look like they run straight into the floor rather than
        // sitting in an actual doorway. Deeper than before to match the
        // leaves' own new thickness rather than reading as a decal on
        // top of them.
        const kickP = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.13), 0);
        dummy.position.set(kickP.x, 0.11, kickP.z);
        dummy.scale.set(0.16, 0.22, doorWidth * 0.98);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        entranceKickPlateMatrices.push(dummy.matrix.clone());

        // Frame: two side jambs, a header above, and the center
        // mullion between the leaves — an actual door frame outline
        // instead of mullions scattered across an undifferentiated
        // glass wall. Thickened and pushed further proud of the wall
        // than the 0.09-deep/0.05-out version this used to be — that
        // read as a thin painted stripe with almost no shadow of its
        // own; a genuinely protruding frame is what actually casts a
        // visible edge under the rig light and reads as real millwork
        // standing off the facade rather than a decal on it.
        const frameDepth = 0.2;
        const jambOffset = doorWidth / 2 + jambWidth / 2;
        [-1, 1].forEach((jamb) => {
          const p = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.09), jamb * jambOffset);
          dummy.position.set(p.x, lobbyHeight / 2, p.z);
          dummy.scale.set(frameDepth, lobbyHeight * 0.98, jambWidth);
          dummy.rotation.set(0, buildingYaw, 0);
          dummy.updateMatrix();
          entranceDoorFrameMatrices.push(dummy.matrix.clone());
        });

        const headerP = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.09), 0);
        dummy.position.set(headerP.x, lobbyHeight + headerHeight / 2, headerP.z);
        dummy.scale.set(frameDepth, headerHeight, doorWidth + jambWidth * 2);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        entranceDoorFrameMatrices.push(dummy.matrix.clone());

        const mullionP = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.09), 0);
        dummy.position.set(mullionP.x, lobbyHeight / 2, mullionP.z);
        dummy.scale.set(frameDepth, lobbyHeight * 0.98, doorGap + 0.03);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        entranceDoorFrameMatrices.push(dummy.matrix.clone());
      } else {
        entranceCanopyMatrices.push(ZERO_SCALE.clone());
        entranceGlowMatrices.push(ZERO_SCALE.clone());
        entrancePillarMatrices.push(ZERO_SCALE.clone());
        entrancePillarMatrices.push(ZERO_SCALE.clone());
        entranceDoorGlassMatrices.push(ZERO_SCALE.clone());
        entranceDoorGlassMatrices.push(ZERO_SCALE.clone());
        entranceDoorWoodMatrices.push(ZERO_SCALE.clone());
        entranceDoorWoodMatrices.push(ZERO_SCALE.clone());
        entranceDoorWoodColors.push(ZERO_COLOR.clone());
        entranceDoorWoodColors.push(ZERO_COLOR.clone());
        entranceDoorIronMatrices.push(ZERO_SCALE.clone());
        entranceDoorIronMatrices.push(ZERO_SCALE.clone());
        entranceDoorIronColors.push(ZERO_COLOR.clone());
        entranceDoorIronColors.push(ZERO_COLOR.clone());
        entranceDoorHandleMatrices.push(ZERO_SCALE.clone());
        entranceDoorHandleMatrices.push(ZERO_SCALE.clone());
        entranceDoorPanelMatrices.push(ZERO_SCALE.clone());
        entranceDoorPanelMatrices.push(ZERO_SCALE.clone());
        entranceKickPlateMatrices.push(ZERO_SCALE.clone());
        entranceDoorFrameMatrices.push(ZERO_SCALE.clone());
        entranceDoorFrameMatrices.push(ZERO_SCALE.clone());
        entranceDoorFrameMatrices.push(ZERO_SCALE.clone());
        entranceDoorFrameMatrices.push(ZERO_SCALE.clone());
        // No animation entries pushed here — these two leaf slots stay
        // permanently ZERO_SCALE (set once above), so the door-opening
        // useFrame loop (which only walks the active-leaf list) never
        // needs to touch them. doorLeafSlot still advances by 2 so the
        // *next* building's leaves land on the correct index in the
        // count*2 glass/solid/handle arrays.
        doorLeafSlot += 2;
      }

      // Hanging gardens — cascading vertical greenery bands wrapped
      // partway up a subset of tall facades, the "living building"
      // amenity real mixed-use towers increasingly build in rather
      // than every surface being glass and steel. Weighted toward
      // taller buildings (there's more facade to hang a garden on),
      // 1-3 bands per building at different heights so it reads as
      // planted terraces rather than one uniform green stripe. Raised
      // from a 28% hit rate to ~55% at explicit request for a lusher,
      // more densely-planted skyline closer to the reference art's own
      // heavily-terraced towers.
      const gardenRoll = seeded(i, 108);
      const gardenBandCount =
        height > 14 && gardenRoll > 0.45
          ? gardenRoll > 0.8
            ? 3
            : seeded(i, 109) > 0.5
              ? 2
              : 1
          : 0;
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

      // Repurposes what used to be a street-level podium skirt (see the
      // dead `hasPodium` flag this replaced) into a rooftop setback
      // crown instead — a smaller tier stacked on top of a box tower's
      // main volume, the "wedding cake" massing real premium
      // supertalls actually use (visible stepped setbacks near the
      // top) rather than every tower being one uniform extrusion
      // top to bottom. Box towers only — the other archetypes already
      // have their own distinct rooflines (tapered, twisted, pointed).
      const hasCrown = !isRound && !isFaceted && !isTwisted && !isPyramid && height > 16 && seeded(i, 23) > 0.5;
      if (hasCrown) {
        const crownHeight = 2 + seeded(i, 24) * 5;
        const crownWidth = width * (0.5 + seeded(i, 25) * 0.22);
        const crownDepth = depth * (0.5 + seeded(i, 26) * 0.22);
        dummy.position.set(x, height + crownHeight / 2, z);
        dummy.scale.set(crownWidth, crownHeight, crownDepth);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        podiumMatrices.push(dummy.matrix.clone());
        podiumColors.push(bodyColor);
      } else {
        podiumMatrices.push(ZERO_SCALE.clone());
        podiumColors.push(ZERO_COLOR.clone());
      }

      // Corner accent light — a continuous vertical light strip
      // climbing almost the tower's full height at (near) its corner,
      // the "glowing edge" cue premium supertalls in the reference art
      // carry, rather than a short random-length band lost mid-facade.
      // Raised from a rare ~28% "exception" to the majority (~65%) at
      // explicit request — a skyline where most towers carry this cue
      // is what actually reads as premium rather than ordinary.
      const hasAccentStrip = seeded(i, 96) > 0.35;
      const accentHeight = height * (0.8 + seeded(i, 8) * 0.16);

      // Facade A: faces the road, offset toward one corner along depth.
      if (hasAccentStrip) {
        const stripA = wallAttach(x, z, buildingYaw, -side * (width / 2 + 0.02), depth * 0.38);
        dummy.position.set(stripA.x, accentHeight / 2, stripA.z);
        dummy.scale.set(0.07, accentHeight, 0.16);
        dummy.rotation.set(0, buildingYaw, 0);
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

      // Facade B: the opposite corner, so towers still glow when the
      // path curves and briefly reveals their far side. Same roll as
      // facade A — a building with a lit accent shows it on both faces
      // rather than one side rolling independently of the other.
      if (hasAccentStrip) {
        const stripB = wallAttach(x, z, buildingYaw, side * (width / 2 + 0.02), -depth * 0.38);
        dummy.position.set(stripB.x, accentHeight / 2, stripB.z);
        dummy.scale.set(0.07, accentHeight, 0.16);
        dummy.rotation.set(0, buildingYaw, 0);
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

      // A tall, thin needle spire capping a good share of both box and
      // round towers — the premium-supertall reference this skyline is
      // chasing reads as almost entirely spire-topped, with the needle
      // itself often as tall as the tower body it caps rather than a
      // small accent. Faceted/twisted towers keep their own already-
      // distinct tapered rooflines (a spire on top of an already-
      // tapered crystal/twist reads as two competing silhouettes
      // stacked on each other) and crowned towers keep their own
      // stepped-setback top instead, but round towers qualify alongside
      // box ones — a tapered cylinder with a thin needle on top is one
      // of the most classic "corporate spire" tower profiles there is.
      const isSpireCandidate =
        height > 15 && seeded(i, 57) > 0.3 && !isFaceted && !isTwisted && !isPyramid && !hasCrown;
      if (isSpireCandidate) {
        const spireHeight = 10 + seeded(i, 21) * 22;
        dummy.position.set(x, height + spireHeight / 2, z);
        dummy.scale.set(width * 0.2, spireHeight, width * 0.2);
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
      if (!isRound && !isFaceted && !isTwisted && !isPyramid) {
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

      // A genuine low-rise "green roof" building — a short (roughly
      // 3-5 story) box whose entire flat roof is a planted deck rather
      // than bare mechanical roofline, the reference art's own
      // low/mid-rise buildings-with-a-garden-on-top look, distinct from
      // both the hanging-garden facade bands above (those wrap a tall
      // tower's wall) and the crown tier (that's an unplanted setback).
      // Box archetype only, short-to-mid height only, and mutually
      // exclusive with the crown tier so a roof is never asked to be
      // both a stepped setback and a flat garden deck at once.
      // Raised from 0.55 to 0.4 (~45% -> ~60% of eligible buildings) at
      // explicit "make the whole city look natural" request.
      const hasGreenRoof =
        !isRound &&
        !isFaceted &&
        !isTwisted &&
        !isPyramid &&
        !hasCrown &&
        height >= 6 &&
        height <= 16 &&
        seeded(i, 60) > 0.4;
      const roofTreeMatrices: THREE.Matrix4[] = [];
      const roofTreeCanopyMats: THREE.Matrix4[] = [];
      if (hasGreenRoof) {
        dummy.position.set(x, height + 0.03, z);
        dummy.scale.set(width * 0.86, 0.05, depth * 0.86);
        dummy.rotation.set(0, buildingYaw, 0);
        dummy.updateMatrix();
        gardenMatrices.push(dummy.matrix.clone());
        gardenColors.push(new THREE.Color("#4f9e5f"));

        // A handful of small trees/shrubs scattered across the deck —
        // the actual "covered in plants" read a flat green disc alone
        // doesn't give.
        const treeCount = 2 + Math.floor(seeded(i, 121) * 3);
        for (let rt = 0; rt < treeCount; rt++) {
          const localX = (seeded(i * 5 + rt, 122) - 0.5) * width * 0.7;
          const localZ = (seeded(i * 5 + rt, 123) - 0.5) * depth * 0.7;
          const cos = Math.cos(buildingYaw);
          const sin = Math.sin(buildingYaw);
          const wx = x + localX * cos - localZ * sin;
          const wz = z + localX * sin + localZ * cos;
          const trunkH = 0.4 + seeded(i * 5 + rt, 124) * 0.3;
          const canopyR = 0.28 + seeded(i * 5 + rt, 125) * 0.22;

          dummy.position.set(wx, height + trunkH / 2, wz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(0.07, trunkH, 0.07);
          dummy.updateMatrix();
          roofTreeMatrices.push(dummy.matrix.clone());

          dummy.position.set(wx, height + trunkH + canopyR * 0.75, wz);
          dummy.rotation.set(
            seeded(i * 5 + rt, 126) * Math.PI,
            seeded(i * 5 + rt, 127) * Math.PI,
            0
          );
          dummy.scale.set(canopyR * 1.9, canopyR * 1.9, 1);
          dummy.updateMatrix();
          roofTreeCanopyMats.push(dummy.matrix.clone());
        }
      } else {
        gardenMatrices.push(ZERO_SCALE.clone());
        gardenColors.push(ZERO_COLOR.clone());
      }
      while (roofTreeMatrices.length < 4) roofTreeMatrices.push(ZERO_SCALE.clone());
      while (roofTreeCanopyMats.length < 4) roofTreeCanopyMats.push(ZERO_SCALE.clone());
      roofTreeMatrices.forEach((m) => roofTreeTrunkAllMatrices.push(m));
      roofTreeCanopyMats.forEach((m, idx) => {
        roofTreeCanopyAllMatrices.push(m);
        roofTreeCanopyAllColors.push(
          new THREE.Color(
            ["#3a7d44", "#4f9e5f", "#2f6b3a", "#5aa668"][(i * 4 + idx) % 4]
          )
        );
      });

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
        antennaPhases.push(seeded(i, 59) * Math.PI * 2);
      } else {
        antennaMatrices.push(ZERO_SCALE.clone());
        antennaLightMatrices.push(ZERO_SCALE.clone());
        antennaLightColors.push(ZERO_COLOR.clone());
        antennaPhases.push(0);
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

    // Same padding trick for hangingGardenMatrices — 0, 1, 2, or 3
    // bands per building (see gardenBandCount above).
    while (hangingGardenMatrices.length < count * 3) {
      hangingGardenMatrices.push(ZERO_SCALE.clone());
      hangingGardenColors.push(ZERO_COLOR.clone());
    }

    return {
      boxTowerMatrices,
      boxTowerColors,
      roundMatrices,
      roundColors,
      facetedMatrices,
      facetedColors,
      twistedMatrices,
      twistedColors,
      pyramidMatrices,
      pyramidColors,
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
      roofTreeTrunkAllMatrices,
      roofTreeCanopyAllMatrices,
      roofTreeCanopyAllColors,
      antennaMatrices,
      antennaLightMatrices,
      antennaLightColors,
      antennaPhases,
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
      entranceCanopyMatrices,
      entranceGlowMatrices,
      entrancePillarMatrices,
      entranceDoorFrameMatrices,
      entranceDoorGlassMatrices,
      entranceDoorWoodMatrices,
      entranceDoorWoodColors,
      entranceDoorIronMatrices,
      entranceDoorIronColors,
      entranceDoorHandleMatrices,
      entranceDoorPanelMatrices,
      entranceKickPlateMatrices,
      doorLeafAnims,
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

  useLayoutEffect(() => {
    for (let k = 0; k < 6; k++) {
      applyInstances(boxTowerRefs.current[k], data.boxTowerMatrices[k], data.boxTowerColors[k]);
    }
  }, [data]);
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
    () => applyInstances(pyramidTowersRef.current, data.pyramidMatrices, data.pyramidColors),
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
    () => applyInstances(roofTreeTrunkRef.current, data.roofTreeTrunkAllMatrices),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(
        roofTreeCanopyRef.current,
        data.roofTreeCanopyAllMatrices,
        data.roofTreeCanopyAllColors
      ),
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
  useLayoutEffect(
    () => applyInstances(entranceCanopyRef.current, data.entranceCanopyMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entranceGlowRef.current, data.entranceGlowMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entrancePillarRef.current, data.entrancePillarMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entranceDoorFrameRef.current, data.entranceDoorFrameMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entranceDoorGlassRef.current, data.entranceDoorGlassMatrices),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(
        entranceDoorWoodRef.current,
        data.entranceDoorWoodMatrices,
        data.entranceDoorWoodColors
      ),
    [data]
  );
  useLayoutEffect(
    () =>
      applyInstances(
        entranceDoorIronRef.current,
        data.entranceDoorIronMatrices,
        data.entranceDoorIronColors
      ),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entranceDoorHandleRef.current, data.entranceDoorHandleMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entranceDoorPanelRef.current, data.entranceDoorPanelMatrices),
    [data]
  );
  useLayoutEffect(
    () => applyInstances(entranceKickPlateRef.current, data.entranceKickPlateMatrices),
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
    // rapid strobe — each building's own phase (baked in at placement
    // time, see antennaPhases above) offsets its cycle, so the beacons
    // across the skyline blink independently rather than all flashing
    // on the same shared material opacity in perfect lockstep. Driven
    // through instanceColor (already used to tell a lit beacon apart
    // from a zeroed-out one on buildings with no antenna) rather than
    // the material's own opacity, since that's the only per-instance
    // channel available on an InstancedMesh.
    const antennaMesh = antennaLightRef.current;
    if (antennaMesh && antennaMesh.instanceColor) {
      const baseBrightness = Math.min(1, 0.8 + mobileBoost * 0.3);
      data.antennaLightColors.forEach((baseColor, i) => {
        if (baseColor.r === 0 && baseColor.g === 0 && baseColor.b === 0) return;
        const blink =
          Math.sin(t * 1.4 + data.antennaPhases[i]) > 0.85 ? 1 : 0.08;
        antennaTmpColor
          .copy(baseColor)
          .multiplyScalar(blink * baseBrightness);
        antennaMesh.setColorAt(i, antennaTmpColor);
      });
      antennaMesh.instanceColor.needsUpdate = true;
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

  // Automatic doors: each active leaf/handle pair slides along its own
  // building-local tangent direction per doorOpenFraction's cycle. Runs
  // over data.doorLeafAnims (only the leaves that actually exist) and
  // writes straight into the glass/wood/iron/handle instancedMeshes —
  // the frame/canopy/kick-plate stay fixed, since it's the leaves
  // opening past a stationary doorway that has to read, not the
  // doorway itself moving.
  const doorDummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const anims = data.doorLeafAnims;
    if (anims.length === 0) return;
    const glassMesh = entranceDoorGlassRef.current;
    const woodMesh = entranceDoorWoodRef.current;
    const ironMesh = entranceDoorIronRef.current;
    const handleMesh = entranceDoorHandleRef.current;
    const panelMesh = entranceDoorPanelRef.current;
    if (!glassMesh && !woodMesh && !ironMesh && !handleMesh && !panelMesh) return;

    const t = state.clock.getElapsedTime();
    for (let a = 0; a < anims.length; a++) {
      const anim = anims[a];
      const cycleT = ((t + anim.phase) % anim.period) / anim.period;
      const slide = doorOpenFraction(cycleT) * anim.maxSlide;
      const dx = anim.dirX * slide;
      const dz = anim.dirZ * slide;

      const leafMesh =
        anim.material === "glass" ? glassMesh : anim.material === "wood" ? woodMesh : ironMesh;
      if (leafMesh) {
        doorDummy.position.set(anim.leafX + dx, anim.leafY, anim.leafZ + dz);
        doorDummy.rotation.set(0, anim.yaw, 0);
        doorDummy.scale.set(anim.leafDepth, anim.leafHeight, anim.leafWidth);
        doorDummy.updateMatrix();
        leafMesh.setMatrixAt(anim.index, doorDummy.matrix);
      }

      if (handleMesh) {
        doorDummy.position.set(anim.handleX + dx, anim.handleY, anim.handleZ + dz);
        doorDummy.rotation.set(0, anim.yaw, 0);
        doorDummy.scale.set(anim.handleSize, anim.handleHeight, anim.handleSize);
        doorDummy.updateMatrix();
        handleMesh.setMatrixAt(anim.index, doorDummy.matrix);
      }

      // Only the wood/iron variants have a raised panel — the glass
      // leaves' panel slots stay at the ZERO_SCALE they were pushed
      // with initially and are simply skipped here.
      if (panelMesh && anim.material !== "glass") {
        doorDummy.position.set(anim.panelX + dx, anim.panelY, anim.panelZ + dz);
        doorDummy.rotation.set(0, anim.yaw, 0);
        doorDummy.scale.set(anim.panelDepth, anim.panelHeight, anim.panelWidth);
        doorDummy.updateMatrix();
        panelMesh.setMatrixAt(anim.index, doorDummy.matrix);
      }
    }
    if (glassMesh) glassMesh.instanceMatrix.needsUpdate = true;
    if (woodMesh) woodMesh.instanceMatrix.needsUpdate = true;
    if (ironMesh) ironMesh.instanceMatrix.needsUpdate = true;
    if (handleMesh) handleMesh.instanceMatrix.needsUpdate = true;
    if (panelMesh) panelMesh.instanceMatrix.needsUpdate = true;
  });

  // Six box-tower bucket configs — [shortA, shortB, medA, medB, tallA,
  // tallB], matching boxTowerRefs'/pushBoxTower's index order — driving
  // the six near-identical instancedMesh blocks below from one array
  // instead of six hand-written copies (which is exactly the kind of
  // duplication that made it easy for the "B" variants to silently
  // drift out of sync with the "A" ones during earlier edits).
  const boxTowerConfigs = [
    { map: windowMaps.towerShort, normalMap: windowNormalMaps.towerShort, emissiveMap: windowEmissiveMaps.towerShort },
    { map: windowMaps.towerShortB, normalMap: windowNormalMaps.towerShortB, emissiveMap: windowEmissiveMaps.towerShortB },
    { map: windowMaps.towerMed, normalMap: windowNormalMaps.towerMed, emissiveMap: windowEmissiveMaps.towerMed },
    { map: windowMaps.towerMedB, normalMap: windowNormalMaps.towerMedB, emissiveMap: windowEmissiveMaps.towerMedB },
    { map: windowMaps.towerTall, normalMap: windowNormalMaps.towerTall, emissiveMap: windowEmissiveMaps.towerTall },
    { map: windowMaps.towerTallB, normalMap: windowNormalMaps.towerTallB, emissiveMap: windowEmissiveMaps.towerTallB },
  ];

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
      {boxTowerConfigs.map((cfg, k) => (
        <instancedMesh
          key={k}
          ref={(el) => {
            boxTowerRefs.current[k] = el;
          }}
          args={[undefined, undefined, count]}
        >
          <primitive object={taperedBoxGeometry} attach="geometry" />
          {isMobile ? (
            <meshLambertMaterial
              map={cfg.map}
              normalMap={cfg.normalMap}
              normalScale={new THREE.Vector2(0.7, 0.7)}
              emissiveMap={cfg.emissiveMap}
              emissive="#bfe4ff"
              emissiveIntensity={1.05}
              toneMapped={false}
              fog
            />
          ) : (
            <meshPhongMaterial
              map={cfg.map}
              normalMap={cfg.normalMap}
              normalScale={new THREE.Vector2(0.85, 0.85)}
              emissiveMap={cfg.emissiveMap}
              emissive="#bfe4ff"
              emissiveIntensity={0.9}
              toneMapped={false}
              specular="#3a4a66"
              shininess={22}
              fog
            />
          )}
        </instancedMesh>
      ))}

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

      {/* Sharp four-sided pyramid/obelisk — no window map (this isn't
          an office tower), just a solid Phong body so the per-instance
          bodyColor tint reads clean, plus a soft emissive lift so it
          doesn't go flat black against the rig light from every angle. */}
      <instancedMesh ref={pyramidTowersRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.72, 1, 4, 1]} />
        <meshPhongMaterial specular="#4a5a78" shininess={30} emissive="#0c1220" emissiveIntensity={0.4} fog />
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

      {/* Rooftop garden deck — lit (Lambert) rather than an additive
          glow disc, matching the hanging-garden facade bands' own
          material so both read as real planted greenery rather than a
          neon accent. */}
      <instancedMesh ref={gardensRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.72, 0.72, 1, 6]} />
        <meshLambertMaterial fog />
      </instancedMesh>

      {/* Rooftop trees/shrubs scattered across the green-roof deck
          above (see hasGreenRoof) — up to 4 per building, padded with
          zero-scale slots the same way hangingGardenMatrices is. */}
      <instancedMesh ref={roofTreeTrunkRef} args={[undefined, undefined, count * 4]}>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshLambertMaterial color="#3a2a1e" fog />
      </instancedMesh>
      {/* Textured alpha-cutout leaf card rather than a solid
          icosahedron — see leafTexture.ts: a painted, irregular
          silhouette reads as foliage where a polygon shape reads as
          geometric no matter how round. */}
      <instancedMesh ref={roofTreeCanopyRef} args={[undefined, undefined, count * 4]}>
        <planeGeometry args={[1, 1]} />
        <meshLambertMaterial map={leafTexture} alphaTest={0.45} side={THREE.DoubleSide} fog />
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

      {/* Ground-floor entrance canopy — a solid, lit slab projecting
          out from the wall at door height (Lambert so it actually
          shades under the rig light rather than reading as a flat
          cutout), a warm glow strip tucked underneath it, and two
          glowing bollards flanking the entrance. */}
      <instancedMesh ref={entranceCanopyRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#12141a" specular="#3a4a66" shininess={30} fog />
      </instancedMesh>

      <instancedMesh ref={entranceGlowRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ffdca8"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={entrancePillarRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ffdca8"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* The actual entrance door — two glass leaves proportioned like a
          real double door (not a wall-wide pane), boxed by a dark frame:
          two side jambs, a header, and the center mullion splitting the
          leaves. The split down the middle is what reads as "a door"
          rather than "a window".
          A cool, near-clear tint rather than a warm solid color (real
          architectural glass is faintly blue/green, not a flat paint
          swatch) with a sharp, bright specular highlight — a crisp
          mirror-like highlight rather than a soft scattered one is
          what actually reads as glass rather than frosted plastic or
          painted metal. The warm emissive is deliberately kept
          (real light glowing through from a lit interior at night),
          layered on top of the clear/reflective base instead of being
          the material's dominant color. */}
      {/* The frame is what actually has to read as "a doorway" at
          flythrough distance — the leaves behind it (glass, wood, or
          iron) shrink to a handful of pixels and lose all their internal
          detail (the split, the handle, the kick plate) well before
          the frame does, so a plain near-black frame against an
          already near-black building base meant the whole assembly
          vanished into the wall. A cyan glow (tried first) turned out
          to be the wrong fix even though it was technically visible —
          this skyline's windows, holo-ads, and facade washes already
          run almost entirely in that same cool blue family (see
          ACCENTS above), so a cyan-lit frame just blended into "more
          city glow" instead of reading as a distinct doorway. Warm
          amber is this palette's one deliberate exception color (the
          entrance canopy strip and door glass emissive already use
          it) — using it here too means every entrance shares one
          unmistakable, un-city-like signature the eye can pick out
          from anywhere, rather than competing with a hundred other
          blue-lit surfaces for attention. */}
      <instancedMesh ref={entranceDoorFrameRef} args={[undefined, undefined, count * 4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#0a0b10"
          specular="#2a3038"
          shininess={20}
          emissive="#ffb35c"
          emissiveIntensity={0.65}
          toneMapped={false}
          fog
        />
      </instancedMesh>

      <instancedMesh ref={entranceDoorGlassRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#cfe8f5"
          transparent
          opacity={0.62}
          specular="#ffffff"
          shininess={110}
          emissive="#ffdca8"
          emissiveIntensity={0.55}
          toneMapped={false}
          fog={false}
        />
      </instancedMesh>

      {/* Stained hardwood doors — one of DOOR_WOOD_COLORS per instance.
          Real wood doesn't throw a sharp specular highlight the way
          polished metal or glass does; a dim, low-shininess sheen is
          what separates "wood catching ambient light" from the bright
          mirror-like highlight the iron/glass variants below use. The
          small warm emissive is only there for the same reason every
          door variant needs one — staying visible against an
          already-dark facade at night — not because wood glows. */}
      <instancedMesh ref={entranceDoorWoodRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          specular="#4a3626"
          shininess={10}
          emissive="#3a2818"
          emissiveIntensity={0.5}
          fog
        />
      </instancedMesh>

      {/* Wrought-iron/blackened-steel doors — one of DOOR_IRON_COLORS
          per instance. The opposite tuning from wood: a bright, tight,
          cool-toned specular highlight is what makes worked metal read
          as metal (a real iron gate catches a sharp glint of light,
          not a soft glow), so this is the highest shininess of any
          door material here. */}
      <instancedMesh ref={entranceDoorIronRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          specular="#c8d0da"
          shininess={95}
          emissive="#20242c"
          emissiveIntensity={0.45}
          fog
        />
      </instancedMesh>

      {/* Door handles — a small metallic bar on each leaf, the one
          detail that reads as "something you'd actually grab and pull"
          rather than a fixed wall panel, on any of the three door
          finishes (real wood and iron doors get metal hardware too). */}
      <instancedMesh ref={entranceDoorHandleRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#d8dce2" specular="#ffffff" shininess={140} fog />
      </instancedMesh>

      {/* Raised center panel on solid-metal doors only — standing
          proud of the leaf's own face, this is what actually gives a
          solid door a molded, 3D look (a visible light/shadow edge
          around the panel) rather than reading as a flat rectangle of
          color. Slightly darker than the leaf body it sits on so the
          panel's own edge shadow reads even before the rig light
          catches it. */}
      <instancedMesh ref={entranceDoorPanelRef} args={[undefined, undefined, count * 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#20222a" specular="#7a828c" shininess={55} fog />
      </instancedMesh>

      {/* Kick plate at the door's base — grounds the leaves in an
          actual doorway instead of them appearing to run straight into
          the floor. */}
      <instancedMesh ref={entranceKickPlateRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#3a3d44" specular="#9aa0aa" shininess={60} fog />
      </instancedMesh>

      {/* Hanging garden bands — lit rather than fully unlit flat green,
          so the foliage picks up the same rig lighting the structural
          buildings do instead of reading as a flat green decal. */}
      <instancedMesh ref={hangingGardenRef} args={[undefined, undefined, count * 3]}>
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
