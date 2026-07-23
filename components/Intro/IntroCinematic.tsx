"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useMobile } from "@/hooks/useMobile";
import { CameraRig } from "./scene/CameraRig";
import { HighwayRoad } from "./scene/HighwayRoad";
import { RoadDetails } from "./scene/RoadDetails";
import { CityScape } from "./scene/CityScape";
import { DistantSkyline } from "./scene/DistantSkyline";
import { ParticleField } from "./scene/ParticleField";
import { Billboards } from "./scene/Billboards";
import { SkyBridges } from "./scene/SkyBridges";
import { StreetLights } from "./scene/StreetLights";
import { HoverTraffic } from "./scene/HoverTraffic";
import { FloatingLogo } from "./scene/FloatingLogo";
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
            // viewport rather than a shot.
            filter: "contrast(1.06) saturate(1.16) brightness(1.02)",
          }}
        >
          <Canvas
            camera={{
              position: [0, 16, 46],
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
            onCreated={({ gl }) => gl.setClearColor("#020208", 1)}
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
              <hemisphereLight args={["#3f5a8c", "#02030a", 1.8]} />
              <directionalLight position={[40, 70, 24]} intensity={3} color="#a8ccff" />
              <CameraRig isMobile={isMobile} />
              <HighwayRoad />
              <RoadDetails isMobile={isMobile} />
              <CityScape isMobile={isMobile} />
              <DistantSkyline isMobile={isMobile} />
              <SkyBridges isMobile={isMobile} />
              <StreetLights isMobile={isMobile} />
              <HoverTraffic isMobile={isMobile} />
              <ParticleField isMobile={isMobile} />
              <Star />
              <CosmicBlast isMobile={isMobile} />
              {/* Textured elements get their own boundary so a slow image
                  load never blanks the rest of the (already-running) scene. */}
              <Suspense fallback={null}>
                <Billboards isMobile={isMobile} />
                <FloatingLogo />
              </Suspense>
            </Suspense>
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
