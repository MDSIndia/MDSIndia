"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const particles = [
  { left: "5%",  top: "12%", size: 1.5, delay: "0s",   dur: "7s",  color: "rgba(0,212,255,0.55)" },
  { left: "93%", top: "10%", size: 2,   delay: "2s",   dur: "9s",  color: "rgba(0,85,255,0.65)" },
  { left: "11%", top: "72%", size: 1.5, delay: "1s",   dur: "11s", color: "rgba(123,47,190,0.55)" },
  { left: "85%", top: "65%", size: 1.5, delay: "3s",   dur: "8s",  color: "rgba(0,212,255,0.45)" },
  { left: "54%", top: "88%", size: 1,   delay: "4.5s", dur: "10s", color: "rgba(0,85,255,0.45)" },
  { left: "20%", top: "32%", size: 1,   delay: "1.2s", dur: "8s",  color: "rgba(255,120,40,0.40)" },
  { left: "76%", top: "22%", size: 1.5, delay: "0.5s", dur: "9s",  color: "rgba(0,180,255,0.40)" },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY       = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen overflow-hidden"
    >
      {/* Ambient center glow — focal point */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 48%, rgba(0,85,255,0.10) 0%, rgba(0,50,180,0.05) 50%, transparent 80%)",
        }}
      />

      {/* Bottom fade — connects to next section */}
      <div className="absolute bottom-0 left-0 right-0 z-[4] pointer-events-none"
        style={{
          height: "280px",
          background: "linear-gradient(to top, #020208 0%, rgba(2,2,8,0.80) 40%, transparent 100%)",
        }} />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none z-[6]"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, willChange: "transform",
            animation: `particleFloat ${p.dur} ease-in-out infinite ${p.delay}`,
          }} />
      ))}

      {/* ── CONTENT ── */}
      <motion.div
        style={{
          y: contentY,
          opacity: contentOpacity,
          willChange: "transform, opacity",
        }}
        className="relative z-20 flex flex-col items-center justify-center min-h-screen text-center px-6"
      >

        {/* THINK BEYOND */}
        <h1
          className="neue-machina leading-[0.88] mb-7"
          style={{
            fontSize: "clamp(4.2rem, 11vw, 11rem)",
            letterSpacing: "0.03em",
            filter: "drop-shadow(0 0 50px rgba(0,150,255,0.40)) drop-shadow(0 0 100px rgba(0,80,220,0.20))",
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.22, ease: EASE }}
            className="block"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #EAF6FF 32%, #7ECFFF 68%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            THINK
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.40, ease: EASE }}
            className="block"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #EAF6FF 32%, #7ECFFF 68%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            BEYOND
          </motion.span>
        </h1>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.0, delay: 0.60, ease: EASE }}
          className="w-24 h-px mx-auto mb-6"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,212,255,0.80), rgba(0,100,255,0.55), transparent)" }}
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.72, ease: EASE }}
          className="text-base md:text-xl font-semibold mb-5 max-w-xl mx-auto leading-relaxed tracking-[0.03em]"
          style={{ color: "rgba(255,255,255,0.90)" }}
        >
          Empowering The Future Through Technology
        </motion.p>

        {/* Body */}
        

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.96, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#vision"
            className="px-7 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #0055FF, #00D4FF)",
              boxShadow: "0 0 28px rgba(0,85,255,0.44), 0 0 70px rgba(0,180,255,0.15)",
            }}
          >
            Explore Our Vision
          </a>
          <a
            href="#noorva"
            className="px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.78)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.42)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.78)"; }}
          >
            Discover Noorva
          </a>
          <a
            href="#careers"
            className="px-6 py-3.5 rounded-full font-medium text-sm transition-colors duration-300"
            style={{ color: "rgba(255,255,255,0.30)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="w-px h-10"
          style={{ background: "linear-gradient(to bottom, rgba(0,212,255,0.30), transparent)" }} />
      </motion.div>
    </section>
  );
}
