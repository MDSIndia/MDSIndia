"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { useMobile } from "@/hooks/useMobile";
import { AmbientParticles } from "./scenes/AmbientParticles";
import { NoorvaOrb } from "./scenes/NoorvaOrb";
import { EarthGlobe } from "./scenes/EarthGlobe";

type Scene = "hero" | "noorva" | "earth";

export function SceneCanvas() {
  const isMobile = useMobile();
  const [activeScene, setActiveScene] = useState<Scene>("hero");
  const [noorvaProgress, setNoorvaProgress] = useState(0);
  const visibleRef = useRef<Set<Scene>>(new Set(["hero"]));

  useEffect(() => {
    if (isMobile) return;

    const sections: { id: string; scene: Scene }[] = [
      { id: "hero", scene: "hero" },
      { id: "noorva", scene: "noorva" },
      { id: "finale", scene: "earth" },
    ];

    const resolve = () => {
      const v = visibleRef.current;
      if (v.has("earth")) setActiveScene("earth");
      else if (v.has("noorva")) setActiveScene("noorva");
      else setActiveScene("hero");
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
      { threshold: 0.15 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    const onScroll = () => {
      const el = document.getElementById("noorva");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1,
        -rect.top / Math.max(1, rect.height - window.innerHeight)
      ));
      setNoorvaProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: false,
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {activeScene === "hero"   && <AmbientParticles />}
          {activeScene === "noorva" && <NoorvaOrb scrollProgress={noorvaProgress} />}
          {activeScene === "earth"  && <EarthGlobe />}
        </Suspense>
      </Canvas>
    </div>
  );
}
