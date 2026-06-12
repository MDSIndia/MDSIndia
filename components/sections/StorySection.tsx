"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const NM   = "'Neue Machina', 'Inter', sans-serif";
const SG   = "var(--font-space-grotesk), 'Inter', sans-serif";

/* ─── Particle configs ────────────────────────────────────────────────────── */

const visionParticles = [
  { top: "11%", left: "68%", size: 2.5, delay: "0s",   dur: "9s",  color: "rgba(0,212,255,0.65)" },
  { top: "30%", left: "82%", size: 1.8, delay: "2.5s", dur: "12s", color: "rgba(0,85,255,0.50)" },
  { top: "50%", left: "74%", size: 2,   delay: "1s",   dur: "8s",  color: "rgba(0,255,178,0.45)" },
  { top: "17%", left: "57%", size: 1.5, delay: "3.5s", dur: "11s", color: "rgba(0,212,255,0.38)" },
  { top: "64%", left: "80%", size: 1.5, delay: "0.5s", dur: "10s", color: "rgba(0,150,255,0.48)" },
];

const ambitionParticles = [
  { top: "14%", left: "63%", size: 2.5, delay: "0s",   dur: "10s", color: "rgba(0,85,255,0.65)" },
  { top: "34%", left: "79%", size: 2,   delay: "1.5s", dur: "8s",  color: "rgba(123,47,190,0.55)" },
  { top: "53%", left: "68%", size: 1.8, delay: "3s",   dur: "11s", color: "rgba(0,255,178,0.38)" },
  { top: "21%", left: "88%", size: 1.5, delay: "2s",   dur: "9s",  color: "rgba(0,85,255,0.42)" },
  { top: "68%", left: "75%", size: 2,   delay: "0.8s", dur: "12s", color: "rgba(100,80,200,0.48)" },
];

const innovationParticles = [
  { top: "10%", left: "70%", size: 2.5, delay: "0s",   dur: "9s",  color: "rgba(123,47,190,0.70)" },
  { top: "29%", left: "59%", size: 2,   delay: "2s",   dur: "11s", color: "rgba(0,212,255,0.50)" },
  { top: "54%", left: "81%", size: 1.8, delay: "1s",   dur: "8s",  color: "rgba(160,80,255,0.55)" },
  { top: "19%", left: "86%", size: 1.5, delay: "3s",   dur: "10s", color: "rgba(0,85,255,0.42)" },
  { top: "71%", left: "66%", size: 2,   delay: "1.5s", dur: "12s", color: "rgba(123,47,190,0.45)" },
];

/* ─── Shared card component ──────────────────────────────────────────────── */

interface CardProps {
  number: string;
  headline: string;
  supporting: string;
  description: string[];
  imageSrc: string;
  imageAlt: string;
  priority?: boolean;
  labelColor: string;
  headlineGradient: string;
  accentLine: string;
  glowBg: string;
  particles: typeof visionParticles;
  textSide?: "left" | "right";
}

function PrincipleCard({
  number, headline, supporting, description,
  imageSrc, imageAlt, priority = false,
  labelColor, headlineGradient, accentLine, glowBg, particles,
  textSide = "left",
}: CardProps) {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.12]);
  const imageY     = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const textY      = useTransform(scrollYProgress, [0.15, 0.75], ["0px", "-18px"]);

  const isRight = textSide === "right";

  /* Mirror particles to the opposite side when text is on the right */
  const displayParticles = isRight
    ? particles.map(p => ({ ...p, left: `${100 - parseFloat(p.left)}%` }))
    : particles;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ minHeight: "90vh", background: "#050505" }}
    >
      {/* ── Parallax image ─────────────────────────────────────────── */}
      <motion.div
        className="absolute"
        style={{
          top: "-8%",
          left: "-8%",
          right: "-8%",
          bottom: "-8%",
          scale: imageScale,
          y: imageY,
          willChange: "transform",
        }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="100vw"
          priority={priority}
        />
      </motion.div>

      {/* ── Dark overlays ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.93) 0%, rgba(5,5,5,0.60) 32%, rgba(5,5,5,0.16) 60%, rgba(5,5,5,0.03) 100%)",
        }}
      />
      {/* Side vignette — flips direction based on textSide */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isRight
            ? "linear-gradient(to left, rgba(5,5,5,0.72) 0%, rgba(5,5,5,0.30) 42%, transparent 72%)"
            : "linear-gradient(to right, rgba(5,5,5,0.72) 0%, rgba(5,5,5,0.30) 42%, transparent 72%)",
        }}
      />

      {/* ── Accent glow ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: "420px", background: glowBg }}
      />

      {/* ── Floating particles ─────────────────────────────────────── */}
      {displayParticles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animation: `innovationParticle ${p.dur} ease-in-out infinite ${p.delay}`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* ── Section counter — upper right ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE }}
        className="absolute top-8 right-10 z-20"
      >
        <span
          style={{
            fontFamily: NM,
            fontSize: "0.62rem",
            letterSpacing: "0.38em",
            color: "rgba(255,255,255,0.18)",
          }}
        >
          {number}&thinsp;/&thinsp;03
        </span>
      </motion.div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-end z-20">
        <motion.div
          style={{ y: textY, willChange: "transform" }}
          className={`w-full max-w-5xl px-5 sm:px-8 md:px-14 lg:px-20 pb-14 md:pb-20${isRight ? " ml-auto text-right" : ""}`}
        >
          {/* Label */}
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="block text-xs font-medium uppercase mb-5"
            style={{ fontFamily: SG, letterSpacing: "0.55em", color: labelColor }}
          >
            Our Foundation
          </motion.span>

          {/* Huge headline */}
          <motion.h2
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.08, ease: EASE }}
            style={{
              fontFamily: NM,
              fontSize: "clamp(2rem, 11vw, 11.5rem)",
              lineHeight: 0.86,
              letterSpacing: "0.04em",
              background: headlineGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1.4rem",
            }}
          >
            {headline}
          </motion.h2>

          {/* Supporting headline */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.20, ease: EASE }}
            className="text-lg md:text-2xl font-semibold mb-5 leading-snug"
            style={{
              fontFamily: SG,
              color: "rgba(255,255,255,0.60)",
              maxWidth: "520px",
              ...(isRight && { marginLeft: "auto" }),
            }}
          >
            {supporting}
          </motion.p>

          {/* Body */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.30, ease: EASE }}
            className="space-y-2"
            style={{ maxWidth: "500px", ...(isRight && { marginLeft: "auto" }) }}
          >
            {description.map((line, i) => (
              <p
                key={i}
                className="text-sm md:text-base leading-relaxed"
                style={{
                  color: i === 0
                    ? "rgba(255,255,255,0.60)"
                    : "rgba(255,255,255,0.34)",
                }}
              >
                {line}
              </p>
            ))}
          </motion.div>

          {/* Accent line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.3, delay: 0.44, ease: EASE }}
            className={`mt-8 h-px${isRight ? " origin-right ml-auto" : " origin-left"}`}
            style={{ width: "110px", background: accentLine }}
          />
        </motion.div>
      </div>

      {/* ── Top edge fade ───────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #020208, transparent)" }}
      />
    </section>
  );
}

/* ─── Section export ─────────────────────────────────────────────────────── */

export function StorySection() {
  return (
    <div id="story">
      {/* 01 — VISION  (text right) */}
      <PrincipleCard
        number="01"
        headline="VISION"
        supporting="See Beyond What Exists Today"
        description={[
          "At MDS, vision is the starting point of every innovation.",
          "We believe the future is not something to wait for — it is something to create.",
          "Every revolutionary product begins with the courage to see what others cannot.",
        ]}
        imageSrc="/visionmds.png"
        imageAlt="Vision — MDS Foundation"
        priority
        textSide="right"
        labelColor="rgba(0,212,255,0.72)"
        headlineGradient="linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 22%, #7AA4FF 52%, #00D4FF 100%)"
        accentLine="linear-gradient(to left, rgba(0,212,255,0.90), rgba(0,255,178,0.55), transparent)"
        glowBg="radial-gradient(ellipse 65% 100% at 82% 100%, rgba(0,212,255,0.14) 0%, rgba(0,85,255,0.07) 50%, transparent 70%)"
        particles={visionParticles}
      />

      {/* 02 — AMBITION  (text left) */}
      <PrincipleCard
        number="02"
        headline="AMBITION"
        supporting="Dream Bigger. Build Further."
        description={[
          "Ambition is the force that pushes us beyond ordinary goals.",
          "We challenge ourselves to think bigger, move faster, and pursue ideas that have the power to create global impact.",
          "The future belongs to those bold enough to create it.",
        ]}
        imageSrc="/ambitionmds.png"
        imageAlt="Ambition — MDS Foundation"
        labelColor="rgba(0,150,255,0.72)"
        headlineGradient="linear-gradient(135deg, #FFFFFF 0%, #C8D8FF 20%, #5588FF 50%, #7B2FBE 100%)"
        accentLine="linear-gradient(to right, rgba(0,100,255,0.90), rgba(123,47,190,0.60), transparent)"
        glowBg="radial-gradient(ellipse 65% 100% at 18% 100%, rgba(0,85,255,0.15) 0%, rgba(123,47,190,0.08) 50%, transparent 70%)"
        particles={ambitionParticles}
      />

      {/* 03 — INNOVATION  (text right) */}
      <PrincipleCard
        number="03"
        headline="INNOVATION"
        supporting="Turning Possibilities Into Reality"
        description={[
          "Innovation is the heartbeat of MDS.",
          "We constantly explore new technologies, challenge conventional thinking, and transform ideas into meaningful solutions.",
          "Innovation is not a department — it is our mindset.",
        ]}
        imageSrc="/innovation.png"
        imageAlt="Innovation — MDS Foundation"
        textSide="right"
        labelColor="rgba(160,80,255,0.72)"
        headlineGradient="linear-gradient(135deg, #FFFFFF 0%, #D8C8FF 18%, #9B5FDE 50%, #7B2FBE 100%)"
        accentLine="linear-gradient(to left, rgba(160,80,255,0.90), rgba(0,212,255,0.48), transparent)"
        glowBg="radial-gradient(ellipse 65% 100% at 82% 100%, rgba(123,47,190,0.16) 0%, rgba(0,85,255,0.08) 50%, transparent 70%)"
        particles={innovationParticles}
      />
    </div>
  );
}
