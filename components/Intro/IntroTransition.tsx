"use client";

import { useEffect, useState } from "react";

/** The hand-off from the star scene to the page. A soft light appears at the
 * dead centre of the screen as the camera reaches the middle of the star
 * cloud, spreads outward until it fills the frame, then clears to show the
 * hero. The dark backdrop under it is the canvas wrapper (see
 * IntroCinematic), which stays opaque while the light spreads and then fades
 * away with it — so the light genuinely comes from the middle rather than the
 * whole screen brightening at once.
 *
 * Quick by design: the spread takes the first ~42% of the duration, the
 * clearing the rest. */
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
          /* Brightest at the centre, easing out to nothing before the edge of
             the element; the element itself is scaled up to fill the screen. */
          /* Starts as a small bright point at the middle of the screen, which is
             where the camera is looking: the target star (see SpaceStar). */
          /* Pure white throughout, and the last stop is white at 0 alpha rather
             than the keyword "transparent": Safari fades toward transparent
             BLACK, which shows up as a dark/coloured ring around the glow. */
          /* closest-side: the gradient ends exactly at the element's edge, so no
             hard box edge shows while the element is scaled down. */
          background: radial-gradient(
            circle closest-side at 50% 50%,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(255, 255, 255, 0.8) 30%,
            rgba(255, 255, 255, 0.34) 62%,
            rgba(255, 255, 255, 0) 100%
          );
          opacity: 0;
          transform: scale(0.06);
          will-change: transform, opacity;
        }
        .intro-glow-veil--playing {
          animation-name: introGlowSpread;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes introGlowSpread {
          0% {
            opacity: 1;
            transform: scale(0.06);
          }
          42% {
            opacity: 1;
            transform: scale(2.7);
          }
          100% {
            opacity: 0;
            transform: scale(3);
          }
        }
      `}</style>
    </div>
  );
}
