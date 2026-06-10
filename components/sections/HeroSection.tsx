"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll-driven parallax — measures from section-top-at-viewport-top to section-bottom-at-viewport-top
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Camera pull-back: content drifts slightly upward and fades out as user scrolls
  const contentY       = useTransform(scrollYProgress, [0, 1],   ["0%", "-14%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1,    0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Depth Layer 1: Bottom-to-top dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-transparent to-[#050505] pointer-events-none z-10" />

      {/* ── Depth Layer 2: Primary cinematic glow — blue-violet, slow breath */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% 42%, rgba(0,82,230,0.15) 0%, rgba(110,30,180,0.07) 48%, transparent 78%)",
          animation: "heroBreath 9s ease-in-out infinite",
        }}
      />

      {/* ── Depth Layer 3: Subtle cyan bloom at bottom edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45%] pointer-events-none z-[4]"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(0,229,255,0.05) 0%, transparent 65%)",
        }}
      />

      {/* ── Depth Layer 4: Faint dot grid — gives sense of neural space */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,229,255,0.055) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 40%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 40%, black 0%, transparent 100%)",
        }}
      />

      {/* ── All content — scroll-driven camera pull-back */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-14 md:mt-20"
      >
        {/* Headline — each word has individual blur-up reveal */}
        <h1 className="text-[clamp(3rem,13vw,11rem)] font-black leading-[0.87] tracking-[-0.04em] mb-7">
          <motion.span
            initial={{ opacity: 0, y: 56, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 3.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-gradient block"
          >
            THINK
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 56, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 3.95, ease: [0.22, 1, 0.36, 1] }}
            className="text-white block"
          >
            BEYOND
          </motion.span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 4.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-base md:text-lg text-white/35 font-light mb-10 max-w-lg mx-auto leading-relaxed tracking-[0.04em]"
        >
          Empowering the Future Through Technology
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 4.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#vision"
            className="px-5 py-3 md:px-7 md:py-3.5 rounded-full text-white font-semibold text-sm transition-opacity duration-300 hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #0066FF, #00E5FF)" }}
          >
            Explore Our Vision
          </a>
          <a
            href="#noorva"
            className="px-5 py-3 md:px-7 md:py-3.5 rounded-full font-semibold text-sm text-white/70 hover:text-white hover:border-white/20 transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Discover Noorva
          </a>
          <a
            href="#careers"
            className="px-5 py-3 md:px-7 md:py-3.5 rounded-full font-semibold text-sm text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            Join The Mission →
          </a>
        </motion.div>

      </motion.div>

    </section>
  );
}
