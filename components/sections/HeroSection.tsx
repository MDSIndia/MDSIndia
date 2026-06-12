"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* Reduced to 5 — each gets its own GPU layer via will-change */
const particles = [
  { left: "8%",  top: "18%", size: 2,   delay: "0s",   dur: "7s",  color: "rgba(0,212,255,0.6)" },
  { left: "91%", top: "12%", size: 2.5, delay: "2s",   dur: "9s",  color: "rgba(0,85,255,0.7)" },
  { left: "14%", top: "75%", size: 2,   delay: "1s",   dur: "11s", color: "rgba(123,47,190,0.6)" },
  { left: "82%", top: "68%", size: 2,   delay: "3s",   dur: "8s",  color: "rgba(0,212,255,0.5)" },
  { left: "56%", top: "88%", size: 1.5, delay: "4.5s", dur: "10s", color: "rgba(0,85,255,0.5)" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY       = useTransform(scrollYProgress, [0, 1],    ["0%", "-14%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Single static atmospheric glow — no animation, no repaint */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "1100px", height: "750px",
          top: "50%", left: "50%",
          transform: "translate(-50%, -55%) translateZ(0)",
          background: "radial-gradient(ellipse, rgba(0,55,210,0.20) 0%, rgba(0,85,255,0.06) 50%, transparent 70%)",
        }}
      />

      {/* Secondary static glow — purple right */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px", height: "600px",
          top: "20%", right: "-5%",
          transform: "translateZ(0)",
          background: "radial-gradient(ellipse, rgba(100,30,170,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Dense dot grid (hero-local) — static, no animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
        }}
      />

      {/* Floating particles — will-change promotes to own GPU layer */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color,
            willChange: "transform",
            animation: `particleFloat ${p.dur} ease-in-out infinite ${p.delay}`,
          }}
        />
      ))}

      {/* Scroll-driven content — will-change on GPU */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, willChange: "transform, opacity" }}
        className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-20"
      >
        {/* Eyebrow */}
       

        {/* Headline — no filter/blur, GPU-safe entrance via opacity + transform only */}
        <h1
          className="neue-machina leading-[0.87] mb-8"
          style={{
            fontSize: "clamp(4.54rem,14.3vw,11.6rem)",
            letterSpacing: "0.03em",
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
            className="text-gradient-hero block"

          >
            THINK
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.36, ease: EASE }}
            className="block text-white"

          >
            BEYOND
          </motion.span>
        </h1>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.58, ease: EASE }}
          className="w-20 h-px mx-auto mb-8"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,212,255,0.6), transparent)" }}
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.68, ease: EASE }}
          className="text-base md:text-lg font-light mb-12 max-w-lg mx-auto leading-relaxed tracking-[0.04em]"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          Empowering the Future Through Technology
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.80, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#vision"
            className="px-7 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #0055FF, #00D4FF)",
              boxShadow: "0 0 24px rgba(0,85,255,0.35)",
            }}
          >
            Explore Our Vision
          </a>
          <a
            href="#noorva"
            className="px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.70)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.30)";
              e.currentTarget.style.color = "rgba(255,255,255,0.95)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.color = "rgba(255,255,255,0.70)";
            }}
          >
            Discover Noorva
          </a>
          <a
            href="#careers"
            className="px-6 py-3.5 rounded-full font-medium text-sm transition-colors duration-300"
            style={{ color: "rgba(255,255,255,0.30)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
          >
            Join The Mission →
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 1.4 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
      >
       
        <div
          className="w-px h-10"
          style={{ background: "linear-gradient(to bottom, rgba(0,212,255,0.25), transparent)" }}
        />
      </motion.div>
    </section>
  );
}
