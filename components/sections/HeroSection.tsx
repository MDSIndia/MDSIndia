"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const particles = [
  { left: "8%",  top: "18%", size: 2,   delay: "0s",    dur: "7s",  color: "rgba(0,212,255,0.7)" },
  { left: "91%", top: "12%", size: 3,   delay: "2s",    dur: "9s",  color: "rgba(0,85,255,0.8)" },
  { left: "14%", top: "75%", size: 2,   delay: "1s",    dur: "11s", color: "rgba(123,47,190,0.7)" },
  { left: "82%", top: "68%", size: 2,   delay: "3s",    dur: "8s",  color: "rgba(0,212,255,0.6)" },
  { left: "50%", top: "8%",  size: 1.5, delay: "1.5s",  dur: "13s", color: "rgba(0,85,255,0.6)" },
  { left: "64%", top: "88%", size: 2,   delay: "4s",    dur: "10s", color: "rgba(0,212,255,0.5)" },
  { left: "26%", top: "45%", size: 1.5, delay: "2.5s",  dur: "14s", color: "rgba(0,212,255,0.5)" },
  { left: "75%", top: "30%", size: 2,   delay: "0.5s",  dur: "9s",  color: "rgba(0,85,255,0.7)" },
  { left: "36%", top: "87%", size: 1.5, delay: "3.5s",  dur: "11s", color: "rgba(0,212,255,0.6)" },
  { left: "88%", top: "55%", size: 2,   delay: "1s",    dur: "8s",  color: "rgba(0,212,255,0.4)" },
  { left: "4%",  top: "60%", size: 1.5, delay: "2s",    dur: "12s", color: "rgba(0,212,255,0.5)" },
  { left: "56%", top: "93%", size: 2,   delay: "4.5s",  dur: "9s",  color: "rgba(123,47,190,0.5)" },
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
      {/* Primary glow — deep blue, center */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "1000px", height: "700px",
          top: "50%", left: "50%",
          transform: "translate(-50%, -55%)",
          background: "radial-gradient(ellipse, rgba(0,55,210,0.22) 0%, transparent 68%)",
          animation: "heroBreath 10s ease-in-out infinite",
        }}
      />

      {/* Accent glow — cyan, upper right */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "700px", height: "500px",
          top: "10%", right: "5%",
          background: "radial-gradient(ellipse, rgba(0,85,255,0.10) 0%, transparent 70%)",
          animation: "heroBreath 14s ease-in-out infinite 3s",
        }}
      />

      {/* Secondary glow — purple, right */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px", height: "600px",
          top: "30%", right: "-5%",
          background: "radial-gradient(ellipse, rgba(100,30,170,0.14) 0%, transparent 70%)",
          animation: "heroBreath 14s ease-in-out infinite 4s",
        }}
      />

      {/* Tertiary glow — cyan, bottom */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "700px", height: "400px",
          bottom: "0", left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse, rgba(0,180,255,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Dense dot grid (hero-local, brighter than global) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)",
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, rgba(0,212,255,0.12) 25%, rgba(0,212,255,0.08) 75%, transparent)",
          animation: "scanLine 11s linear infinite",
          top: "0",
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 5}px ${p.color}`,
            animation: `particleFloat ${p.dur} ease-in-out infinite ${p.delay}`,
          }}
        />
      ))}

      {/* Scroll-driven content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-20"
      >
       

        {/* Headline — THINK BEYOND in Neue Machina ExtraBold */}
        <h1
          className="neue-machina leading-[0.87] mb-8"
          style={{
            fontSize: "clamp(4.54rem,14.3vw,11.6rem)",
            letterSpacing: "0.03em",
            filter: [
              "drop-shadow(0 0 40px rgba(0,85,255,0.40))",
              "drop-shadow(0 0 80px rgba(0,212,255,0.20))",
              "drop-shadow(0 0 140px rgba(0,85,255,0.10))",
            ].join(" "),
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 80, scale: 0.92, filter: "blur(22px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, delay: 0.25, ease: EASE }}
            className="text-gradient-hero block"
          >
            THINK
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 80, scale: 0.92, filter: "blur(22px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, delay: 0.42, ease: EASE }}
            className="text-gradient-beyond block"
          >
            BEYOND
          </motion.span>
        </h1>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.0, delay: 0.65, ease: EASE }}
          className="w-20 h-px mx-auto mb-8"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,212,255,0.6), transparent)" }}
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.75, ease: EASE }}
          className="text-base md:text-lg font-light mb-12 max-w-lg mx-auto leading-relaxed tracking-[0.04em]"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          Empowering the Future Through Technology
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.88, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#vision"
            className="px-7 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #0055FF, #00D4FF)",
              boxShadow: "0 0 28px rgba(0,85,255,0.40), 0 0 60px rgba(0,85,255,0.12)",
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
        transition={{ duration: 1.2, delay: 1.6 }}
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
