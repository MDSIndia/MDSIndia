"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    // Animate progress
    gsap.to({ value: 0 }, {
      value: 100,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: function () {
        setProgress(Math.round(this.targets()[0].value));
      },
    });

    // Logo animation
    tl.fromTo(logoRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo(".loading-line",
      { scaleX: 0 },
      { scaleX: 1, duration: 2, ease: "power3.inOut" },
      "-=0.5"
    )
    .to(logoRef.current, {
      y: -10,
      duration: 0.5,
      ease: "power2.out",
    }, "+=0.3");

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center"
    >
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="ambient-glow ambient-glow-blue w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div ref={logoRef} className="relative flex flex-col items-center gap-8">
        {/* MDS Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center border border-cyan-400/20">
            <span className="text-3xl font-black text-gradient">M</span>
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-cyan-400/20 animate-pulse" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[0.3em] text-white/80 uppercase">
            Mahadeva Digital Solutions
          </h1>
          <p className="text-sm text-white/40 tracking-[0.5em] uppercase mt-2">
            Initializing the future...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-px bg-white/10 relative overflow-hidden">
          <div
            className="loading-line absolute inset-0 origin-left"
            style={{
              background: "linear-gradient(90deg, #0066FF, #00E5FF)",
            }}
          />
        </div>

        {/* Progress number */}
        <span ref={textRef} className="text-cyan-400 font-mono text-sm tabular-nums">
          {progress.toString().padStart(3, "0")}%
        </span>
      </div>

      {/* Think Beyond text */}
      <div className="absolute bottom-12 text-center">
        <p className="text-white/20 text-xs tracking-[0.8em] uppercase">
          Think Beyond
        </p>
      </div>
    </div>
  );
}
