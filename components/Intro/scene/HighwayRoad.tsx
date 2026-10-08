"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { at, windowProgress } from "./timeline";
import {
  ASPHALT_COLOR,
  ROAD_EDGE_LINE_COLOR,
  ROAD_DASH_LINE_COLOR,
  paintAsphaltGrain,
  applyRoadTextureDefaults,
} from "./roadSurface";

function seededRoad(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A wet-mirror reflection layer — a brighter vertical gradient
 * (brightest toward the far/horizon end, the shallow grazing angle a
 * receding wet surface actually reflects most at) plus a scatter of
 * soft vertical color streaks standing in for individual reflected
 * light sources (building windows, signage, taillights) hitting the
 * puddled surface, mixing warm amber and magenta in with the cool
 * blue rather than one flat cyan tint — real wet asphalt at night
 * mirrors whatever colored light is actually around it, not a single
 * hue. Drawn as its own unlit, additive-blended overlay entirely
 * separate from the base road material — the base has already tried
 * (twice, per its own comments above) reacting to scene lighting for a
 * "wet" look and both attempts tinted the white lane markings blue;
 * this sidesteps that class of bug completely by never touching the
 * lit response at all. */
function buildWetSheenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Pulled back hard from an earlier pass — a repeat.y of 6 meant each
  // tile spanned ~37 world units, so even a "short" streak (as a
  // fraction of the canvas) stretched into a multi-unit diagonal smear
  // once mapped onto the actual road and seen at a shallow angle,
  // reading as broad color bands rather than reflections. Base opacity
  // capped much lower too — this should read as dark wet asphalt with
  // restrained hints of color, not a wash.
  //
  // Symmetric (0 -> peak -> 0) rather than a one-directional ramp: a
  // monotonic gradient looks fine as a single image, but this texture
  // tiles ~30 times down the road (RepeatWrapping) — a ramp that ends
  // at its brightest value snaps straight back to fully transparent at
  // every wrap boundary, which is a hard seam repeating every ~7 world
  // units. At a road's shallow, near-edge-on viewing angle that seam
  // projects as a visible rectangular panel line, which is what was
  // reading as a "blocky, tiled" road surface instead of continuous
  // wet asphalt. Both edges now match (transparent), so the tile wraps
  // with no discontinuity.
  // Scattered reflected-light streaks — short, thin vertical smears in
  // a mix of cool and warm hues, the "mirrored signage/headlight" cue
  // real wet asphalt shows that a single flat gradient can't. Kept
  // deliberately small: these are meant to read as individual glints,
  // not lane-wide bands.
  const streakColors = [
    "rgba(150,210,255,0.22)",
    "rgba(255,190,140,0.18)",
    "rgba(210,150,255,0.18)",
    "rgba(255,120,120,0.16)",
  ];
  for (let i = 0; i < 26; i++) {
    const x = seededRoad(i, 951) * canvas.width;
    const w = 0.7 + seededRoad(i, 952) * 1.3;
    const yStart = seededRoad(i, 953) * canvas.height;
    const len = canvas.height * (0.09 + seededRoad(i, 954) * 0.2);
    const streakGrad = ctx.createLinearGradient(0, yStart, 0, yStart - len);
    const color = streakColors[i % streakColors.length];
    streakGrad.addColorStop(0, color);
    streakGrad.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
    ctx.fillStyle = streakGrad;
    ctx.fillRect(x - w / 2, yStart - len, w, len);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // 30 rather than 6 — each tile now spans ~7.3 world units instead of
  // ~37, which is what actually keeps the streaks short in world space
  // rather than stretched.
  texture.repeat.set(1, 30);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Thin glowing cyan pinstripes tracing the same edge/center-line
 * positions the base road texture paints in white — a separate
 * additive-only overlay (same reasoning as the wet sheen above: never
 * touch the base material's lit response) standing in for "intelligent
 * lane markings," a smart road that's actually lit rather than plain
 * painted stripes. Scrolls independently/faster than the paint
 * markings so it reads as energy flowing down the lane, not a glowing
 * copy of the same paint. */
function buildEnergyLineTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const drawGlowLine = (x: number) => {
    const grad = ctx.createLinearGradient(x - 10, 0, x + 10, 0);
    grad.addColorStop(0, "rgba(90,210,255,0)");
    grad.addColorStop(0.5, "rgba(140,225,255,0.9)");
    grad.addColorStop(1, "rgba(90,210,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - 10, 0, 20, canvas.height);
  };

  drawGlowLine(14);
  drawGlowLine(canvas.width - 14);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 48);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildRoadTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  // One tile = 4.58 world units of road (220 / 48 repeats). Real
  // highway dashes are ~3 m long with ~9 m gaps; at this scene's scale
  // (a car is ~2.5 units for ~4.5 m) that is roughly one 1.7-unit dash
  // per 4.6-unit tile. The old pattern was a 0.3-unit dash every 0.55
  // units — a zipper/runway look. 480px height with a 178+302 dash
  // pattern keeps the rhythm continuous across tile wraps.
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;

  // Asphalt base + the shared grain every paved surface uses.
  ctx.fillStyle = ASPHALT_COLOR;
  ctx.fillRect(0, 0, W, H);
  paintAsphaltGrain(ctx, W, H);

  // Tyre wear: real roads are polished slightly lighter and smoother
  // where wheels run, in two tracks per lane. Soft, low contrast.
  // Lanes sit at x = +-1.5 and +-3.4 units (the traffic lanes) which on
  // this 256px / 16-unit texture is 128 +- 24 and 128 +- 54.
  const laneCenters = [128 - 54, 128 - 24, 128 + 24, 128 + 54];
  for (const cx of laneCenters) {
    for (const off of [-9, 9]) {
      const g = ctx.createLinearGradient(cx + off - 7, 0, cx + off + 7, 0);
      g.addColorStop(0, "rgba(120,140,170,0)");
      g.addColorStop(0.5, "rgba(120,140,170,0.05)");
      g.addColorStop(1, "rgba(120,140,170,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx + off - 7, 0, 14, H);
    }
  }

  // Repair patches and darker oil/rubber stains — uneven, never perfectly
  // uniform. Seeded so every tile is the same (it repeats down the road).
  for (let i = 0; i < 9; i++) {
    const x = seededRoad(i, 701) * (W - 40) + 10;
    const y = seededRoad(i, 702) * H;
    const w = 14 + seededRoad(i, 703) * 46;
    const h = 20 + seededRoad(i, 704) * 70;
    const lighter = seededRoad(i, 705) > 0.5;
    ctx.fillStyle = lighter ? "rgba(70,80,100,0.07)" : "rgba(0,0,0,0.22)";
    ctx.fillRect(x, y, w, h);
  }
  // Hairline cracks.
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 7; i++) {
    let x = seededRoad(i, 711) * W;
    let y = seededRoad(i, 712) * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (seededRoad(i * 9 + k, 713) - 0.5) * 12;
      y += 8 + seededRoad(i * 9 + k, 714) * 16;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Solid white shoulder lines along both edges.
  ctx.strokeStyle = ROAD_EDGE_LINE_COLOR;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(14, H);
  ctx.moveTo(W - 14, 0);
  ctx.lineTo(W - 14, H);
  ctx.stroke();

  // Centre: a double solid line separating the two directions, as on a
  // real undivided two-way road (warm yellow-white, not the same white
  // as the lane dashes).
  ctx.strokeStyle = "rgba(235,205,120,0.82)";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 3.2, 0);
  ctx.lineTo(W / 2 - 3.2, H);
  ctx.moveTo(W / 2 + 3.2, 0);
  ctx.lineTo(W / 2 + 3.2, H);
  ctx.stroke();

  // White dashed lane dividers between the two lanes on each side.
  ctx.strokeStyle = ROAD_DASH_LINE_COLOR;
  ctx.lineWidth = 3.2;
  ctx.setLineDash([178, 302]);
  for (const x of [128 - 39, 128 + 39]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 48);
  applyRoadTextureDefaults(texture);
  return texture;
}

/** A single, non-repeating wet-horizon gradient over the whole road:
 * dark at the camera end, brightening toward the vanishing point the way
 * a wet road mirrors the glowing sky and city low on the horizon. It
 * deliberately does not tile — the earlier per-tile sheen gradient
 * repeated every ~7 units, which showed as regular horizontal light/dark
 * bands across the road. */
function buildHorizonSheenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  // v=0 (canvas bottom after flipY) is the near end of the plane that
  // maps to z=+80; the far end is the top. The plane is rotated -90deg
  // about X so texture-top maps to -z (far). Gradient runs far -> near.
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "rgba(120,150,210,0.30)"); // far / horizon
  g.addColorStop(0.35, "rgba(100,130,190,0.14)");
  g.addColorStop(0.7, "rgba(80,110,170,0.04)");
  g.addColorStop(1, "rgba(60,90,150,0)"); // near the camera
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function HighwayRoad() {
  const texture = useMemo(() => buildRoadTexture(), []);
  // fog: false — with it on, the road fades toward the (dark early,
  // then brightening) fog color as it recedes into the distance, which
  // combined with ACES tone mapping's non-linear response made the
  // same asphalt color read as very different shades depending on how
  // far down the road a given patch was from the camera. Turning fog
  // off here means the road always shows its true, consistent color —
  // the one surface in the scene where matching color mattered more
  // than atmospheric distance-fade.
  // Basic, not Phong: a lit material here doesn't just add a specular
  // highlight the way it would on an upright wall — a flat road plane
  // sits at a shallow, near-edge-on angle to the camera for almost its
  // entire visible length, which spreads that "highlight" across
  // nearly the whole surface rather than one tight streak, and Phong's
  // ambient/diffuse response on top of that picks up the scene's own
  // blue-dominant lighting (the hemisphere sky color and directional
  // light are both blue) and tints the road — including the white lane
  // markings — a uniform blue rather than the intended white/grey.
  // Staying unlit is what keeps the road's own painted color the one
  // true, undistorted thing in frame; tried a "wet" specular look here
  // twice and both attempts introduced a worse visual bug than the dry
  // matte look this reverts to.
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, fog: false }),
    [texture]
  );

  const wetSheenTexture = useMemo(() => buildWetSheenTexture(), []);
  const wetSheenMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: wetSheenTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [wetSheenTexture]
  );

  const horizonSheenTexture = useMemo(() => buildHorizonSheenTexture(), []);
  const horizonSheenMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: horizonSheenTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [horizonSheenTexture]
  );

  const energyLineTexture = useMemo(() => buildEnergyLineTexture(), []);
  const energyLineMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: energyLineTexture,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [energyLineTexture]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Peak scroll speed is deliberately higher than the raw camera
    // velocity would justify — road light streaks moving fast is one
    // of the strongest "we are going fast" cues cinema uses, and it's
    // free to tune independently of how fast the camera actually
    // translates through the world.
    const speed = 0.6 + windowProgress(t, at(2.6), at(8.0)) * 7.2;
    texture.offset.y -= speed * delta;
    // A slower, independent drift on the sheen — reads as reflections
    // sliding past rather than perfectly locked to the paint markings
    // scrolling underneath it, the way a real wet surface's highlight
    // doesn't track the lane paint 1:1.
    wetSheenTexture.offset.y -= speed * 0.35 * delta;
    // The energy lines scroll noticeably faster than the paint markings
    // themselves — reads as current flowing down the lane rather than
    // a glowing copy of the same stripes moving in lockstep, plus a
    // slow overall pulse so the road itself feels gently alive rather
    // than a static lit decal.
    energyLineTexture.offset.y -= speed * 1.6 * delta;
    energyLineMaterial.opacity = 0.4 + Math.sin(t * 0.8) * 0.12;
  });

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        // y=0.025 — slightly above CrossStreets' own y=0.02 (itself above
        // CityScape's per-building contact-shadow discs at y=0.01, or a
        // building near the road would darken the asphalt right through
        // it). Two coplanar road meshes overlapping at an intersection
        // z-fight: with equal depth, which one wins is decided by
        // Three's internal opaque render-order sort, not JSX order, so
        // it isn't safe to just leave both at the same height and hope —
        // that non-deterministic fight (not a real texture/color
        // difference) was what made the cross streets read as a
        // different shade of asphalt in the overlap. A small, deliberate
        // epsilon makes the through-road win every time, the same way a
        // real intersection's main route reads as continuous.
        position={[0, 0.025, -30]}
        material={material}
      >
        <planeGeometry args={[16, 220]} />
      </mesh>

      {/* Wet-asphalt sheen — a separate, unlit, additive-only overlay
          (see buildWetSheenTexture above for why this stays fully
          decoupled from the base road's own lit response). Sits a hair
          above the base road so it never z-fights it. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.027, -30]}
        material={wetSheenMaterial}
      >
        <planeGeometry args={[16, 220]} />
      </mesh>

      {/* One non-tiling wet-horizon gradient over the whole road. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.0275, -30]}
        material={horizonSheenMaterial}
      >
        <planeGeometry args={[16, 220]} />
      </mesh>

      {/* Glowing "intelligent lane marking" pinstripes — see
          buildEnergyLineTexture above. Sits highest of the three road
          layers so its glow reads on top of both the paint and the wet
          sheen. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.029, -30]}
        material={energyLineMaterial}
      >
        <planeGeometry args={[16, 220]} />
      </mesh>
    </group>
  );
}
