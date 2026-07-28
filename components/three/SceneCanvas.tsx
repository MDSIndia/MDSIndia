"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMobile } from "@/hooks/useMobile";
import { EarthGlobe } from "./scenes/EarthGlobe";
import { AmbientParticles } from "./scenes/AmbientParticles";

type Scene = "hero" | "noorva" | "earth" | "cosmos";

export function SceneCanvas() {
  const isMobile = useMobile();
  const [activeScene, setActiveScene] = useState<Scene>("hero");
  const visibleRef = useRef<Set<Scene>>(new Set(["hero"]));

  useEffect(() => {
    const sections: { id: string; scene: Scene }[] = [
      { id: "hero", scene: "hero" },
      { id: "noorva", scene: "noorva" },
      { id: "finale", scene: "earth" },
    ];

    // Hero now has its own static image background (see HeroSection),
    // so it renders nothing here — it's tracked only so the fallback
    // "cosmos" particle drift doesn't bleed in behind it. Every other
    // untracked section (e.g. Vision, in between hero and noorva) falls
    // through to that "cosmos" default.
    const resolve = () => {
      const v = visibleRef.current;
      if (v.has("earth")) setActiveScene("earth");
      else if (v.has("noorva")) setActiveScene("noorva");
      else if (v.has("hero")) setActiveScene("hero");
      else setActiveScene("cosmos");
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = sections.find((s) => s.id === entry.target.id);
          if (!match) return;
          if (entry.isIntersecting) visibleRef.current.add(match.scene);
          else visibleRef.current.delete(match.scene);
        });
        resolve();
      },
      // `threshold: 0.15` alone counted hero as still "intersecting"
      // until 85% of it had scrolled away — for one full section-height
      // of scrolling, the *next*
      // section's own content was already on screen while its
      // background was still the previous section's. The negative
      // bottom `rootMargin` shrinks the effective viewport used for the
      // intersection calculation up to its top 45%, so a section only
      // counts as "in view" once it's actually the dominant thing on
      // screen, not merely still partially visible below the fold.
      { threshold: 0, rootMargin: "0px 0px -55% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => {
      obs.disconnect();
    };
  }, [isMobile]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: isMobile ? 68 : 60 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {activeScene === "cosmos" && <AmbientParticles />}
          {activeScene === "earth"  && <EarthGlobe />}
        </Suspense>
      </Canvas>
    </div>
  );
}
