"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useMobile } from "@/hooks/useMobile";
import { CameraRig } from "./scene/CameraRig";
import { HighwayRoad } from "./scene/HighwayRoad";
import { CityScape } from "./scene/CityScape";
import { ParticleField } from "./scene/ParticleField";
import { RiderTrail } from "./scene/RiderTrail";
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

/** Fullscreen real-time cinematic: a procedural cyberpunk highway
 * flythrough rendered with react-three-fiber, standing in for a
 * pre-rendered video. Runs for a fixed duration, then — rather than
 * unmounting outright — fades its own opaque backdrop to transparent
 * over `dissolveMs` (holding briefly first, same shape as the CSS
 * veil above it) so the real homepage mounted behind it is gradually
 * revealed through the glow instead of popping in behind a hard cut. */
export function IntroCinematic({
  onComplete,
  dissolveMs,
}: {
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

  useEffect(() => {
    if (!webglOk) {
      fire();
      return;
    }
    const id = window.setTimeout(fire, INTRO_DURATION * 1000);
    return () => window.clearTimeout(id);
  }, [webglOk, fire]);

  // Same "hold ~24%, then dissolve" shape as IntroTransition's keyframes.
  const holdMs = dissolveMs * 0.24;
  const fadeMs = Math.max(1, dissolveMs - holdMs);

  if (!webglOk) {
    return (
      <div
        style={{ position: "absolute", inset: 0, background: "#020208" }}
      />
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#020208",
        opacity: dissolving ? 0 : 1,
        // Linear, matching IntroTransition's own evenly-staged keyframes,
        // so the two layers thin out together across the full window
        // instead of the canvas racing ahead and finishing early.
        transition: `opacity ${fadeMs}ms linear ${holdMs}ms`,
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
          <CameraRig isMobile={isMobile} />
          <HighwayRoad />
          <CityScape isMobile={isMobile} />
          <SkyBridges isMobile={isMobile} />
          <StreetLights isMobile={isMobile} />
          <HoverTraffic isMobile={isMobile} />
          <ParticleField isMobile={isMobile} />
          <RiderTrail />
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
  );
}
