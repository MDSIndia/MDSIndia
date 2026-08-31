"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMobile } from "@/hooks/useMobile";
import { CameraRig } from "./scene/CameraRig";
import { Ground } from "./scene/Ground";
import { HighwayRoad } from "./scene/HighwayRoad";
import { RoadDetails } from "./scene/RoadDetails";
import { CrossStreets } from "./scene/CrossStreets";
import { CityScape } from "./scene/CityScape";
import { SkylineFiller } from "./scene/SkylineFiller";
import { DistantSkyline } from "./scene/DistantSkyline";
import { ParticleField } from "./scene/ParticleField";
import { Billboards } from "./scene/Billboards";
import { BuildingBanners } from "./scene/BuildingBanners";
import { HoloAds } from "./scene/HoloAds";
import { SkyBridges } from "./scene/SkyBridges";
import { LightShafts } from "./scene/LightShafts";
import { ElevatedTrain } from "./scene/ElevatedTrain";
import { StreetLights } from "./scene/StreetLights";
import { FlyingCars } from "./scene/FlyingCars";
import { StreetCars } from "./scene/StreetCars";
import { ParkingLot } from "./scene/ParkingLot";
import { StreetTrees } from "./scene/StreetTrees";
import { FloatingLogo } from "./scene/FloatingLogo";
import { Landmark } from "./scene/Landmark";
import { NoorvaTower } from "./scene/NoorvaTower";
import { Waterfall } from "./scene/Waterfall";
import { Biodome } from "./scene/Biodome";
import { SkyPlaza } from "./scene/SkyPlaza";
import { Pedestrians } from "./scene/Pedestrians";
import { BusStop } from "./scene/BusStop";
import { HolographicMonument } from "./scene/HolographicMonument";
import { FuturisticPark } from "./scene/FuturisticPark";
import { TreeOfLife } from "./scene/TreeOfLife";
import { Star } from "./scene/Star";
import { CosmicBlast } from "./scene/CosmicBlast";
import { INTRO_DURATION } from "./scene/timeline";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Resets the shared R3F clock to zero the instant `active` first
 * becomes true. Lives inside the Canvas so it can reach the clock via
 * useThree(). Without this, warming the canvas up early (see below)
 * would mean the story's `getElapsedTime()`-driven timeline had
 * already been running since mount — off by however long the user
 * spent on the gate screen — instead of starting fresh at the actual
 * click. */
function ClockGate({ active }: { active: boolean }) {
  const { clock } = useThree();
  const wasActive = useRef(false);
  useEffect(() => {
    if (active && !wasActive.current) {
      clock.start();
    }
    wasActive.current = active;
  }, [active, clock]);
  return null;
}

/** The scene's only real lights (see the comment at the call site) —
 * pulled into their own component so they can carry a gentle "breathing"
 * animation rather than sitting at one perfectly fixed intensity for the
 * whole flight. A single static value is exactly right for a still
 * render, but across a ~10s continuous shot it reads as an obviously
 * synthetic, unchanging light rig once you're looking at it that long;
 * real ambient city light (haze, distant signage, atmosphere) drifts
 * gently instead. Kept to a slow, low-amplitude sine rather than
 * anything fast/irregular enough to read as flicker — each light has
 * its own frequency/phase so they drift independently instead of
 * breathing in lockstep. */
function SceneLighting({ isMobile }: { isMobile: boolean }) {
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);

  const baseHemi = isMobile ? 2.6 : 1.8;
  const baseKey = isMobile ? 3.5 : 2.4;
  const baseFill = isMobile ? 0.8 : 0.5;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (hemiRef.current) hemiRef.current.intensity = baseHemi * (1 + Math.sin(t * 0.11 + 4.4) * 0.03);
    if (keyRef.current) keyRef.current.intensity = baseKey * (1 + Math.sin(t * 0.17) * 0.035);
    if (fillRef.current) fillRef.current.intensity = baseFill * (1 + Math.sin(t * 0.13 + 2.1) * 0.06);
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#33455f", "#141824", baseHemi]} />
      <directionalLight ref={keyRef} position={[40, 70, 24]} intensity={baseKey} color="#8fa8c8" />
      <directionalLight ref={fillRef} position={[-30, 40, -20]} intensity={baseFill} color="#6a72a0" />
    </>
  );
}

/** Fullscreen real-time cinematic: a procedural cyberpunk highway
 * flythrough rendered with react-three-fiber, standing in for a
 * pre-rendered video.
 *
 * Mounted (via IntroOverlay) as soon as the gate screen appears, well
 * before the user clicks — `active` is false for that whole warm-up
 * stretch, keeping the canvas invisible and inert while its WebGL
 * shaders compile in the background against the same GPU context
 * that will actually play the story. That one-time compile cost used
 * to land as a visible stutter right as the cinematic started; now it
 * happens for free during time the user is already spending reading
 * the quote. ClockGate resets the timeline to zero and the story timer
 * only starts once `active` flips true, so none of this shifts the
 * actual sequence.
 *
 * At the other end, once the light-dissolve hand-off begins, rather
 * than unmounting outright the canvas fades its own opaque backdrop to
 * transparent over `dissolveMs` (holding briefly first, same shape as
 * the CSS veil above it) so the real homepage mounted behind it is
 * gradually revealed through the glow — then unmounts for real once
 * dissolving, freeing its GPU context right as the homepage's own
 * separate Three.js scene needs it. */
export function IntroCinematic({
  active,
  onComplete,
  dissolveMs,
}: {
  active: boolean;
  onComplete: () => void;
  dissolveMs: number;
}) {
  const isMobile = useMobile();
  const firedRef = useRef(false);
  const [webglOk, setWebglOk] = useState(true);
  const [dissolving, setDissolving] = useState(false);

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setDissolving(true);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  // The story's own duration timer only starts once the user has
  // actually clicked — warming up the canvas during the gate screen
  // must never affect when the cinematic is considered "done".
  useEffect(() => {
    if (!active) return;
    if (!webglOk) {
      fire();
      return;
    }
    const id = window.setTimeout(fire, INTRO_DURATION * 1000);
    return () => window.clearTimeout(id);
  }, [active, webglOk, fire]);

  // Same "hold ~24%, then dissolve" shape as IntroTransition's keyframes.
  const holdMs = dissolveMs * 0.24;
  const fadeMs = Math.max(1, dissolveMs - holdMs);

  if (!webglOk) {
    // No WebGL fallback: render nothing during the (invisible) warm-up
    // stage, and once active the duration-timer effect above fires
    // onComplete immediately, skipping straight to the hand-off.
    return active ? (
      <div
        style={{ position: "absolute", inset: 0, background: "#020208", pointerEvents: "none" }}
      />
    ) : null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#020208",
        pointerEvents: "none",
        opacity: !active ? 0 : dissolving ? 0 : 1,
        transition: dissolving
          ? // Linear, matching IntroTransition's own evenly-staged
            // keyframes, so the two layers thin out together across the
            // full window instead of the canvas racing ahead and
            // finishing early.
            `opacity ${fadeMs}ms linear ${holdMs}ms`
          : "opacity 480ms ease",
      }}
    >
      {/* The moment the veil starts its dissolve, the cinematic canvas
          is fully hidden behind it (the veil holds fully opaque before
          this) — and this is also the exact moment PageChrome mounts
          *its own* separate Three.js scene underneath. Keeping this
          WebGL context alive (even just frozen) while a second one
          spins up was the source of visible stutter during the
          hand-off, so it's unmounted outright rather than merely
          faded — freeing its GPU context immediately, with no visible
          difference since nothing shows through the opaque veil at
          this instant anyway. */}
      {!dissolving && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            // A cheap, GPU-composited CSS grade on top of the raw
            // WebGL output — real footage is always color-graded, and
            // a flat unlit scene otherwise reads as a video-game
            // viewport rather than a shot. Pulled saturation back down
            // (was 1.22) and dropped the hue-rotate at explicit
            // direction — a "luxury tech" grade stays controlled rather
            // than punchy/neon; contrast alone still keeps blacks rich
            // enough for the additive accents to read as lit.
            filter: "contrast(1.1) saturate(1.02) brightness(1.0)",
          }}
        >
          <Canvas
            camera={{
              position: [0, 2.4, 46],
              fov: isMobile ? 64 : 46,
              near: 0.1,
              far: 400,
            }}
            dpr={isMobile ? 1 : [1, 1.5]}
            gl={{
              antialias: !isMobile,
              alpha: false,
              powerPreference: "high-performance",
              stencil: false,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor("#020208", 1);
              // Filmic response plus a fractionally lower exposure than
              // the R3F default (1) — a flat linear/1.0 exposure left
              // the whole scene sitting at one mid brightness with
              // nothing to actually pop, which is a large part of why
              // it read as a game viewport rather than a graded shot;
              // richer blacks make the neon accents (rendered with
              // `toneMapped={false}` throughout, so this doesn't touch
              // them directly) read as brighter by contrast alone.
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 0.92;
            }}
          >
            <Suspense fallback={null}>
              <ClockGate active={active} />
              {/* The only lights in the scene — everything else here is
                  deliberately unlit/additive neon, but the structural
                  building volumes (see CityScape) need an actual light
                  to shade, or every face renders as one flat color and
                  the skyline reads as cardboard cutouts instead of
                  solid 3D masses. A cheap sky/ground ambient plus one
                  angled "moon" light is enough to differentiate each
                  building's faces — no shadows, this is stylized rather
                  than physically lit and shadow maps would be wasted
                  cost on hundreds of fast-moving instances. */}
              {/* A bit brighter on mobile specifically — smaller screens
                  at typical outdoor/handheld brightness read a scene
                  tuned for a desktop monitor as noticeably dimmer, so
                  mobile gets its own boosted intensity rather than
                  sharing the desktop tuning as-is. The cool, restrained
                  rim/fill light is desaturated toward graphite-blue
                  rather than a saturated violet, per explicit
                  "restrained violet accents, avoid excessive neon"
                  direction — low intensity, pure fill, doesn't compete
                  with the directional key for which side reads as "lit".
                  See SceneLighting above for the gentle per-light
                  breathing animation. */}
              <SceneLighting isMobile={isMobile} />
              <CameraRig isMobile={isMobile} />
              <Ground />
              <HighwayRoad />
              <RoadDetails isMobile={isMobile} />
              <CrossStreets isMobile={isMobile} />
              <CityScape isMobile={isMobile} />
              <SkylineFiller isMobile={isMobile} />
              <DistantSkyline isMobile={isMobile} />
              <SkyBridges isMobile={isMobile} />
              <LightShafts isMobile={isMobile} />
              <ElevatedTrain isMobile={isMobile} />
              <StreetLights isMobile={isMobile} />
              <StreetTrees isMobile={isMobile} />
              <Pedestrians isMobile={isMobile} />
              <BusStop isMobile={isMobile} />
              <ParticleField isMobile={isMobile} />
              <Star isMobile={isMobile} />
              <CosmicBlast isMobile={isMobile} />
              {/* Textured elements get their own boundary so a slow image
                  load never blanks the rest of the (already-running) scene —
                  this now includes the vehicles, since their cabins load the
                  SVG glass texture. */}
              <Suspense fallback={null}>
                <ParkingLot isMobile={isMobile} />
                <StreetCars isMobile={isMobile} />
                <FlyingCars isMobile={isMobile} />
                <Billboards isMobile={isMobile} />
                <BuildingBanners isMobile={isMobile} />
                <HoloAds isMobile={isMobile} />
                <FloatingLogo />
                <Landmark />
                <NoorvaTower />
                <Waterfall isMobile={isMobile} />
                <Biodome />
                <SkyPlaza />
                <HolographicMonument />
                <FuturisticPark />
                <TreeOfLife />
              </Suspense>
            </Suspense>

            {/* Real bloom rather than relying on additive-blended
                planes alone to look "lit" — every neon accent, window
                glow, and holographic panel in this scene renders with
                toneMapped={false} specifically so it can blow past 1.0
                and actually trip this threshold, which is what gives
                bright elements genuine soft light bleed into their
                surroundings instead of a flat, crisply-edged colored
                shape. This was the single biggest thing separating the
                raw WebGL output from a graded cinematic shot. Skipped
                entirely on mobile — a second full-resolution blur pass
                on top of an already-heavy instanced scene is real GPU
                cost weaker/thermally-limited mobile GPUs can't
                absorb, and mobile already gets its own brighter base
                lighting/material tuning throughout this scene as a
                cheaper substitute. */}
            {!isMobile && (
              <EffectComposer multisampling={0}>
                <Bloom
                  intensity={0.35}
                  // 0.22 was catching almost the entire midtone scene —
                  // dim building facades, the sky gradient — and
                  // blooming all of it into a solid white wash rather
                  // than picking out just the genuinely bright neon/
                  // glow elements. Pushed close to 1.0 so only pixels
                  // actually near full brightness (the toneMapped=false
                  // accents/signage this was built for) trigger it.
                  luminanceThreshold={0.92}
                  luminanceSmoothing={0.15}
                  mipmapBlur
                  kernelSize={KernelSize.SMALL}
                />
              </EffectComposer>
            )}
          </Canvas>
        </div>
      )}

      {/* Soft vignette — darkens the frame edges so the eye settles on
          the road ahead instead of the flat corners of the viewport. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 48%, transparent 42%, rgba(0,2,10,0.18) 74%, rgba(0,2,10,0.58) 100%)",
        }}
      />
    </div>
  );
}
