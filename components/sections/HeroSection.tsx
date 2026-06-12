"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

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

  const bgY            = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentY       = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#020510" }}
    >
      {/* ── FULL-VIEWPORT IMAGE ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          style={{ y: bgY, scale: 1.15, willChange: "transform" }}
          className="absolute inset-0"
        >
          <Image
            src="/MDSsilhouette.png"
            alt=""
            fill
            priority
            style={{
              objectFit: "cover",
              objectPosition: "58% 5%",
              filter: "brightness(1.05) contrast(1.12) saturate(1.5)",
              maskImage: "radial-gradient(ellipse 100% 135% at 56% 44%, black 55%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.18) 82%, transparent 93%)",
              WebkitMaskImage: "radial-gradient(ellipse 100% 135% at 56% 44%, black 55%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.18) 82%, transparent 93%)",
            }}
          />
        </motion.div>
      </div>

      {/* ── OVERLAY STACK ── */}

      {/* Barely-there base tint — only suppresses residual white fringe */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: "rgba(2, 5, 16, 0.07)" }} />

      {/* Very soft edge vignette — keeps hard corners dark */}
      <div className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 92% 105% at 56% 44%, transparent 0%, rgba(2,5,16,0.08) 62%, rgba(2,5,16,0.60) 100%)",
        }} />

      {/* Top fade — navbar */}
      <div className="absolute top-0 left-0 right-0 z-[4] pointer-events-none"
        style={{
          height: "200px",
          background: "linear-gradient(to bottom, rgba(2,5,16,0.96) 0%, rgba(2,5,16,0.30) 70%, transparent 100%)",
        }} />

      {/* Bottom fade — site connection */}
      <div className="absolute bottom-0 left-0 right-0 z-[4] pointer-events-none"
        style={{
          height: "300px",
          background: "linear-gradient(to top, rgba(2,5,16,1) 0%, rgba(2,5,16,0.85) 35%, rgba(2,5,16,0.40) 70%, transparent 100%)",
        }} />

      {/* ── ATMOSPHERIC GLOWS ── */}

      {/* Orange nebula — left side */}
      <motion.div className="absolute z-[5] pointer-events-none"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "500px", height: "500px",
          top: "22%", left: "30%", transform: "translate(-50%, 0)",
          background: "radial-gradient(ellipse, rgba(255,100,20,0.22) 0%, rgba(220,55,10,0.08) 50%, transparent 72%)",
          filter: "blur(22px)",
        }} />

      {/* Blue nebula — right side */}
      <motion.div className="absolute z-[5] pointer-events-none"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.10, 1] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          width: "500px", height: "500px",
          top: "18%", left: "72%", transform: "translate(-50%, 0)",
          background: "radial-gradient(ellipse, rgba(0,150,255,0.24) 0%, rgba(0,80,230,0.10) 50%, transparent 72%)",
          filter: "blur(22px)",
        }} />

      {/* Crown glow — head */}
      <motion.div className="absolute z-[5] pointer-events-none"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "360px", height: "360px",
          top: "2%", left: "60%", transform: "translate(-50%, 0)",
          background: "radial-gradient(ellipse, rgba(0,215,255,0.30) 0%, rgba(60,140,255,0.14) 50%, transparent 72%)",
          filter: "blur(24px)",
        }} />

      {/* ── PARTICLES ── */}
      {particles.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none z-[6]"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, willChange: "transform",
            animation: `particleFloat ${p.dur} ease-in-out infinite ${p.delay}`,
          }} />
      ))}

      {/* ── CONTENT — overlaid on the image ── */}
      <motion.div
        style={{
          y: contentY,
          opacity: contentOpacity,
          willChange: "transform, opacity",
        }}
        className="relative z-20 flex flex-col items-center justify-end min-h-screen text-center px-6 pb-20"
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
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.84, ease: EASE }}
          className="text-sm md:text-base font-light mb-11 max-w-2xl mx-auto leading-relaxed"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          At Mahadeva Digital Solutions, we are building the future through intelligence,
          innovation, and Noorva — our next-generation AI companion.
        </motion.p>

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
