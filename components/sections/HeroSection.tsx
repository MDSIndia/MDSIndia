"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Compass, ArrowUpRight, ChevronDown } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const isMobile = useMobile();

  // Respect reduced-motion for the video itself too, not just the CSS
  // animations below — pause on the first frame rather than looping a
  // moving background for users who've asked for less motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) video.pause();
    else if (videoReady) video.play().catch(() => {});
  }, [reducedMotion, videoReady]);

  // Safety net: `onLoadedData` can be slow or silently miss firing right
  // after the intro's heavy WebGL/GPU teardown (observed directly — the
  // video is decoded and playing but the event never lands in time),
  // which left the fade-in permanently stuck at opacity 0. A video
  // that's already playing should never stay invisible, so force the
  // reveal once it's unmistakably ready even if the event never comes.
  useEffect(() => {
    if (videoReady) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= 2) {
      setVideoReady(true);
      return;
    }
    const id = window.setTimeout(() => setVideoReady(true), 1200);
    return () => window.clearTimeout(id);
  }, [videoReady]);

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center overflow-hidden bg-[#020208]"
    >
      {/* Hidden SVG sharpen filter — the source footage is inherently
          soft even at native resolution (verified pixel-for-pixel, not
          a CSS/scaling artifact), so a light unsharp-mask convolution
          is layered on top to add back some perceived edge contrast.
          Skipped on mobile: feConvolveMatrix is software-rendered and
          re-runs every frame of a playing video, which is too costly
          for weaker GPUs/CPUs there. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="heroSharpen">
          <feConvolveMatrix
            order="3"
            kernelMatrix="0 -0.6 0 -0.6 3.4 -0.6 0 -0.6 0"
            preserveAlpha="true"
          />
        </filter>
      </svg>

      {/* Fullscreen video background — fades in once it actually has a
          frame to show (avoids a flash of black before it buffers),
          and holds a very slow Ken Burns drift for the rest of its
          loop so a fullscreen video doesn't sit dead-static. */}
      <motion.video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: isMobile ? undefined : "url(#heroSharpen)" }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: videoReady ? 1 : 0,
          scale: reducedMotion ? 1 : [1, 1.07, 1],
        }}
        transition={{
          opacity: { duration: 1.1, ease: EASE },
          scale: { duration: 26, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </motion.video>

      {/* Dark gradient over the video so the overlaid text stays
          legible regardless of what's playing underneath — heavier at
          the bottom/left where the text sits, lighter toward the
          top-right so the footage still reads through. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(115deg, rgba(2,2,8,0.88) 0%, rgba(2,2,8,0.62) 32%, rgba(2,2,8,0.28) 55%, rgba(2,2,8,0.15) 100%), linear-gradient(to top, rgba(2,2,8,0.85) 0%, rgba(2,2,8,0.2) 40%, rgba(2,2,8,0.35) 100%)",
        }}
      />

      {/* Soft vignette — pulls focus toward center/text instead of the
          flat corners, same technique used on the intro cinematic. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(2,2,8,0.22) 72%, rgba(2,2,8,0.5) 100%)",
        }}
      />

      {/* Text overlay */}
      <motion.div
        className="relative z-10 w-full px-6 sm:px-10 md:px-20"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } } }}
      >
        <div className="text-center md:text-left mx-auto md:mx-0" style={{ maxWidth: "620px" }}>
          <motion.h1
            variants={fadeUp}
            className="neue-machina mb-5"
            style={{
              fontSize: "clamp(1.9rem, 3.8vw, 4.5rem)",
              lineHeight: 1.1,
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, #0055FF 70%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Building Products<br />that Makes an Impact
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-semibold mb-8"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
              color: "rgba(255,255,255,0.80)",
              letterSpacing: "0.02em",
            }}
          >
            Empowering The Future Through Products
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center md:justify-start">
            <a
              href="#about-mds"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm uppercase transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'Neue Machina', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.03em",
                color: "#FFFFFF",
                background:
                  "linear-gradient(rgba(4,6,16,0.72), rgba(4,6,16,0.72)) padding-box, linear-gradient(135deg, #0055FF, #7B2FBE) border-box",
                border: "1.5px solid transparent",
                backdropFilter: "blur(18px) saturate(180%)",
                WebkitBackdropFilter: "blur(18px) saturate(180%)",
                boxShadow: "0 0 22px rgba(0,85,255,0.32), 0 0 48px rgba(123,47,190,0.16)",
              }}
            >
              <Compass className="size-4" strokeWidth={2.25} />
              Explore MDS
            </a>
            <a
              href="https://noorva.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm uppercase transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'Neue Machina', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.03em",
                color: "rgba(0,212,255,0.92)",
                background:
                  "linear-gradient(rgba(4,6,16,0.72), rgba(4,6,16,0.72)) padding-box, linear-gradient(135deg, #00D4FF, #0055FF) border-box",
                border: "1.5px solid transparent",
                backdropFilter: "blur(18px) saturate(180%)",
                WebkitBackdropFilter: "blur(18px) saturate(180%)",
                boxShadow: "0 0 22px rgba(0,212,255,0.28), 0 0 48px rgba(0,85,255,0.16)",
              }}
            >
              <ArrowUpRight className="size-4" strokeWidth={2.25} />
              Discover Noorva
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue — a small, quiet nudge that there's more below,
          not shown for reduced-motion (it's a bounce animation and
          nothing but decoration). */}
      {!reducedMotion && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1, delay: 1.1, ease: EASE }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="size-4" style={{ color: "rgba(255,255,255,0.55)" }} />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
