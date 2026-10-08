"use client";

import { useEffect, useState } from "react";

/** The white glow, rendered in CSS, IS the transition: it holds at
 * full brightness for a beat, then dissolves through explicit opacity
 * layers (mimicking light fog slowly clearing) rather than a single
 * quick fade — so the homepage feels like it's emerging from inside the
 * light rather than appearing after a cut. Uses a keyframe animation
 * (not a plain transition) so each stage of the dissolve can be timed
 * and shaped independently. */
export function IntroTransition({ durationMs }: { durationMs: number }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      aria-hidden
      className={`intro-glow-veil${playing ? " intro-glow-veil--playing" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        animationDuration: `${durationMs}ms`,
      }}
    >
      <style jsx>{`
        .intro-glow-veil {
          /* Solid white, no coloured or dark falloff: the only glow on the
             way out is white. */
          background: #ffffff;
          opacity: 1;
          filter: blur(0px);
          transform: scale(1);
        }
        .intro-glow-veil--playing {
          animation-name: introGlowDissolve;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        /* Roughly: hold at full brightness for the first ~24% of the
           duration (~0.4s of 1.7s), then dissolve through explicit
           opacity/blur layers — eyes slowly adapting, not a wipe. */
        @keyframes introGlowDissolve {
          0% {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1);
          }
          24% {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1.015);
          }
          36% {
            opacity: 0.9;
            filter: blur(0px);
            transform: scale(1.04);
          }
          48% {
            opacity: 0.75;
            filter: blur(0px);
            transform: scale(1.07);
          }
          58% {
            opacity: 0.6;
            filter: blur(0px);
            transform: scale(1.09);
          }
          68% {
            opacity: 0.45;
            filter: blur(0px);
            transform: scale(1.11);
          }
          78% {
            opacity: 0.3;
            filter: blur(0px);
            transform: scale(1.14);
          }
          88% {
            opacity: 0.15;
            filter: blur(0px);
            transform: scale(1.17);
          }
          96% {
            opacity: 0.05;
            filter: blur(0px);
            transform: scale(1.19);
          }
          100% {
            opacity: 0;
            filter: blur(0px);
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
