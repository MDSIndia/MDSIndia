"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const NM = "var(--font-display)";
const SG = "var(--font-space-grotesk), 'Inter', sans-serif";

interface PrincipleProps {
  number: string;
  headline: string;
  subheading: string;
  body: string[];
  imageSrc: string;
  imageAlt: string;
  imageLeft: boolean;
  priority?: boolean;
  accentColor: string;
  headlineGradient: string;
  numberColor: string;
  dropGlow: string;
  floatDuration: number;
  floatDelay: number;
}

function PrincipleBlock({
  number,
  headline,
  subheading,
  body,
  imageSrc,
  imageAlt,
  imageLeft,
  priority = false,
  accentColor,
  headlineGradient,
  numberColor,
  dropGlow,
  floatDuration,
  floatDelay,
}: PrincipleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  /* ── Floating transparent PNG — no card, no frame, no background ── */
  const imageBlock = (
    <motion.div
      initial={{ opacity: 0, x: imageLeft ? -60 : 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.1, ease: EASE }}
      /* scroll parallax sits on this wrapper */
      style={{ y: imageY }}
      className="relative w-full lg:w-[58%] shrink-0 h-72 sm:h-96 lg:h-[620px]"
    >
      {/* continuous float — no background, no border, just the PNG */}
      <motion.div
        className="relative w-full h-full"
        style={{ minHeight: "inherit" }}
        animate={{ y: [0, -20, 0] }}
        transition={{
          repeat: Infinity,
          duration: floatDuration,
          delay: floatDelay,
          ease: "easeInOut",
        }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority={priority}
          style={{
            filter: `brightness(1.12) contrast(1.25) saturate(1.5) ${dropGlow}`,
          }}
        />
      </motion.div>
    </motion.div>
  );

  /* ── Text column ─────────────────────────────────────────────────── */
  const textBlock = (
    <motion.div
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.95, ease: EASE }}
      className="flex flex-col justify-center w-full lg:w-[42%] px-2 lg:px-0 min-w-0 text-left items-start"
    >
      {/* Core Principle label */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex items-center gap-3 mb-6"
      >
        <span
          style={{
            fontFamily: NM,
            fontSize: "0.60rem",
            letterSpacing: "0.50em",
            color: numberColor,
            textTransform: "uppercase" as const,
          }}
        >
          Core Principle&thinsp;{number}
        </span>
        <span
          className="h-px"
          style={{
            width: "72px",
            background: `linear-gradient(to right, ${accentColor}, transparent)`,
            opacity: 0.5,
          }}
        />
      </motion.div>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.0, delay: 0.08, ease: EASE }}
        style={{
          fontFamily: NM,
          fontSize: "clamp(3rem, 6.5vw, 7rem)",
          lineHeight: 0.88,
          letterSpacing: "0.02em",
          background: headlineGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "1.5rem",
        }}
      >
        {headline}
      </motion.h2>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
        style={{
          fontFamily: SG,
          fontSize: "clamp(1.15rem, 2.2vw, 1.5rem)",
          color: "rgba(255,255,255,0.75)",
          fontWeight: 600,
          lineHeight: 1.4,
          marginBottom: "1.5rem",
        }}
      >
        {subheading}
      </motion.p>

      {/* Accent line */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.0, delay: 0.26, ease: EASE }}
        className="mb-6 h-px origin-left"
        style={{
          width: "80px",
          background: `linear-gradient(to right, ${accentColor}, transparent)`,
        }}
      />

      {/* Body text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.85, delay: 0.30, ease: EASE }}
        className="space-y-3"
      >
        {body.map((line, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--font-space-grotesk), 'Inter', sans-serif",
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {line}
          </p>
        ))}
      </motion.div>
    </motion.div>
  );

  return (
    <div ref={ref} className="w-full">
      <div
        className={`flex flex-col lg:flex-row items-center gap-0 xl:gap-4${
          imageLeft ? "" : " lg:flex-row-reverse"
        }`}
      >
        {imageBlock}
        {textBlock}
      </div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */

export function StorySection() {
  return (
    <section id="story" className="relative overflow-hidden" style={{ background: "transparent" }}>
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, #020208, transparent)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 md:px-12 xl:px-16 py-10 md:py-16">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-center mb-8 md:mb-12"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase block mb-5"
            style={{ color: "rgba(0,212,255,0.72)", fontFamily: SG }}
          >
            Our Foundation
          </span>
          <h2
            style={{
              fontFamily: NM,
              fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
              lineHeight: 1,
              letterSpacing: "0.03em",
              background: "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 35%, #7AA4FF 70%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            3 Core Principles
          </h2>
          <p
            className="mt-5 max-w-xl mx-auto"
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.58)",
            }}
          >
            The values that guide every product, every decision, every line of code.
          </p>
        </motion.div>

        {/* Blocks */}
        <div className="space-y-8 md:space-y-14">

          {/* 01 — VISION */}
          <PrincipleBlock
            number="01"
            headline="Vision"
            subheading="See Beyond What Exists Today"
            body={[
              "At MDS, vision is the starting point of every innovation.",
              "We believe the future is not something to wait for — it is something to create.",
              "Our vision drives us to imagine possibilities beyond current limitations and build technology that transforms how people learn, create, communicate, and grow.",
              "Every revolutionary product begins with the courage to see what others cannot.",
            ]}
            imageSrc="/MDSVision.png"
            imageAlt="Vision — MDS Foundation"
            imageLeft={true}
            priority
            accentColor="rgba(0,212,255,0.72)"
            headlineGradient="linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 22%, #7AA4FF 52%, #00D4FF 100%)"
            numberColor="rgba(0,212,255,0.55)"
            dropGlow="drop-shadow(0 0 50px rgba(0,212,255,0.75)) drop-shadow(0 0 100px rgba(0,150,255,0.40))"
            floatDuration={7}
            floatDelay={0}
          />

          {/* 02 — AMBITION */}
          <PrincipleBlock
            number="02"
            headline="Ambition"
            subheading="Dream Bigger. Build Further."
            body={[
              "Ambition is the force that pushes us beyond ordinary goals.",
              "We challenge ourselves to think bigger, move faster, and pursue ideas that have the power to create global impact.",
              "At MDS, ambition means refusing to settle for incremental change and striving instead to build technologies that redefine industries and improve lives.",
              "The future belongs to those bold enough to create it.",
            ]}
            imageSrc="/MDSAmbition.png"
            imageAlt="Ambition — MDS Foundation"
            imageLeft={false}
            accentColor="rgba(0,100,255,0.72)"
            headlineGradient="linear-gradient(135deg, #FFFFFF 0%, #C8D8FF 20%, #5588FF 50%, #7B2FBE 100%)"
            numberColor="rgba(80,140,255,0.55)"
            dropGlow="drop-shadow(0 0 50px rgba(0,85,255,0.80)) drop-shadow(0 0 100px rgba(123,47,190,0.50))"
            floatDuration={8.5}
            floatDelay={1.2}
          />

          {/* 03 — INNOVATION */}
          <PrincipleBlock
            number="03"
            headline="Innovation"
            subheading="Turning Possibilities Into Reality"
            body={[
              "Innovation is the heartbeat of MDS.",
              "We constantly explore new technologies, challenge conventional thinking, and transform ideas into meaningful solutions.",
              "It is through innovation that we build products like Noorva and pursue our mission of creating technology that empowers humanity.",
              "Innovation is not a department — it is our mindset.",
            ]}
            imageSrc="/MDSInnovation.png"
            imageAlt="Innovation — MDS Foundation"
            imageLeft={true}
            accentColor="rgba(160,80,255,0.72)"
            headlineGradient="linear-gradient(135deg, #FFFFFF 0%, #D8C8FF 18%, #9B5FDE 50%, #7B2FBE 100%)"
            numberColor="rgba(160,80,255,0.55)"
            dropGlow="drop-shadow(0 0 38px rgba(160,80,255,0.55)) drop-shadow(0 0 80px rgba(0,212,255,0.25))"
            floatDuration={9}
            floatDelay={0.6}
          />

        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{ background: "linear-gradient(to top, #020208, transparent)" }}
      />
    </section>
  );
}
