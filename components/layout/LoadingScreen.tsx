"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
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

    gsap.to({ value: 0 }, {
      value: 100,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: function () {
        setProgress(Math.round(this.targets()[0].value));
      },
    });

    tl.fromTo(logoRef.current,
      { opacity: 0, scale: 0.85, filter: "blur(8px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out" }
    )
    .fromTo(".loading-line",
      { scaleX: 0 },
      { scaleX: 1, duration: 2, ease: "power3.inOut" },
      "-=0.5"
    )
    .to(logoRef.current, {
      y: -8, duration: 0.5, ease: "power2.out",
    }, "+=0.3");

    return () => { tl.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{ background: "#020208" }}
    >
      {/* Atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute"
          style={{
            width: "600px", height: "600px",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(ellipse, rgba(0,85,255,0.18) 0%, transparent 70%)",
            animation: "heroBreath 6s ease-in-out infinite",
          }}
        />
      </div>

      <div ref={logoRef} className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 0 40px rgba(0,85,255,0.25), 0 0 80px rgba(0,85,255,0.10)",
            }}
          >
            <Image
              src="/fevicon.png"
              alt="Mahadeva Digital Solutions"
              width={72}
              height={72}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
          <div
            className="absolute -inset-3 rounded-3xl animate-pulse"
            style={{ border: "1px solid rgba(0,212,255,0.2)" }}
          />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold tracking-[0.35em] text-white/80 uppercase">
            Mahadeva Digital Solutions
          </h1>
          <p className="text-xs text-white/30 tracking-[0.6em] uppercase mt-2">
            Initializing the future...
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="w-64 h-px relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="loading-line absolute inset-0 origin-left"
            style={{ background: "linear-gradient(90deg, #0055FF, #00D4FF)" }}
          />
        </div>

        <span className="font-mono text-sm tabular-nums" style={{ color: "#00D4FF" }}>
          {progress.toString().padStart(3, "0")}%
        </span>
      </div>

      <div className="absolute bottom-12 text-center">
        <p className="text-white/20 text-xs tracking-[0.8em] uppercase">Think Beyond</p>
      </div>
    </div>
  );
}
