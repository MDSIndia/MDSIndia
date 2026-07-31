"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePortalTransition } from "@/components/PortalTransition/PortalTransitionProvider";

const EASE = [0.22, 1, 0.36, 1] as const;
const SG = "var(--font-space-grotesk), 'Inter', sans-serif";
const NM = "'Clash Display', 'Inter', sans-serif";

const pillars = [
  {
    number: "01",
    title1: "Product",
    title2: "Without Soul",
    body: "The world's most advanced product still fails to understand a single human soul. It processes. It responds. But it does not truly know you.",
    image: "/technlogy.png",
    accentGradient: "linear-gradient(135deg, #C084FC 0%, #9333EA 100%)",
    accentDot: "#A855F7",
    glow: "168,85,247",
  },
  {
    number: "02",
    title1: "A World",
    title2: "Left Alone",
    body: "Billions of people navigate life's most important moments — career crossroads, personal struggles, late nights of doubt — without anyone truly there to help them think, grow, and thrive.",
    image: "/worldleftalone.png",
    accentGradient: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)",
    accentDot: "#818CF8",
    glow: "129,140,248",
  },
  {
    number: "03",
    title1: "The Gap",
    title2: "We Fill",
    body: "We exist to bridge the distance between human potential and human reality. Through AI that doesn't just respond — but remembers, understands, and grows alongside you.",
    image: "/gapwefill.png",
    accentGradient: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
    accentDot: "#00D4FF",
    glow: "0,212,255",
  },
];

/* ── Orbit particle: rotates a container around center, particle sits at radius ── */
function OrbitParticle({
  radius,
  duration,
  delay = 0,
  color,
  size = 6,
}: {
  radius: number;
  duration: number;
  delay?: number;
  color: string;
  size?: number;
}) {
  return (
    <motion.div
      style={{ position: "absolute", inset: 0, transformOrigin: "center center" }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
      <div
        style={{
          position: "absolute",
          top: `calc(50% - ${radius}px - ${size / 2}px)`,
          left: `calc(50% - ${size / 2}px)`,
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${size * 3}px ${color}`,
        }}
      />
    </motion.div>
  );
}

/* ── Noorva orbit visual ── */
function NoorvaOrbit() {
  const orbits = [
    { radius: 46, duration: 3.2, delay: 0,    color: "#00D4FF", size: 9 },
    { radius: 46, duration: 3.2, delay: 1.6,  color: "rgba(0,212,255,0.65)", size: 5 },
    { radius: 80, duration: 5.5, delay: 0,    color: "#a855f7", size: 8 },
    { radius: 80, duration: 5.5, delay: 2.75, color: "rgba(168,85,247,0.65)", size: 5 },
    { radius: 118, duration: 9,  delay: 0,    color: "#7AA4FF", size: 7 },
    { radius: 118, duration: 9,  delay: 4.5,  color: "rgba(122,164,255,0.55)", size: 4 },
  ];

  return (
    <div className="relative mx-auto" style={{ width: 260, height: 260 }}>
      {/* Orbit rings */}
      {[46, 80, 118].map((r) => (
        <div
          key={r}
          style={{
            position: "absolute",
            width: r * 2,
            height: r * 2,
            top: `calc(50% - ${r}px)`,
            left: `calc(50% - ${r}px)`,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
      ))}

      {/* Outer ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,85,255,0.14) 0%, rgba(123,47,190,0.09) 55%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "radial-gradient(circle, #00D4FF 0%, #7B2FBE 65%, transparent 100%)",
          boxShadow: "0 0 36px rgba(0,212,255,0.85), 0 0 72px rgba(123,47,190,0.45)",
        }}
      />

      {/* Particles */}
      {orbits.map((o, i) => (
        <OrbitParticle key={i} {...o} />
      ))}
    </div>
  );
}

/* ── Intention → Action SVG path ── */
function IntentionToActionPath() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative w-full py-2">
      <svg viewBox="0 0 520 100" className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0055FF" />
            <stop offset="50%" stopColor="#7AA4FF" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Ghost dotted track */}
        <path
          d="M 30,50 C 90,15 150,85 210,50 C 270,15 330,85 390,50 C 430,28 460,46 490,50"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5 7"
        />

        {/* Animated main path */}
        <motion.path
          d="M 30,50 C 90,15 150,85 210,50 C 270,15 330,85 390,50 C 430,28 460,46 490,50"
          stroke="url(#pathGrad)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.2 }}
        />

        {/* Start dot */}
        <motion.circle
          cx="30"
          cy="50"
          r="5"
          fill="#0055FF"
          style={{ filter: "drop-shadow(0 0 6px #0055FF)" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
        />

        {/* End dot */}
        <motion.circle
          cx="490"
          cy="50"
          r="5"
          fill="#a855f7"
          style={{ filter: "drop-shadow(0 0 8px #a855f7)" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: [0, 1.5, 1] } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: 2.2 }}
        />

        {/* Labels */}
        <text
          x="30"
          y="78"
          textAnchor="middle"
          fill="rgba(255,255,255,0.38)"
          fontSize="10"
          fontFamily="var(--font-space-grotesk),sans-serif"
        >
          Intention
        </text>
        <text
          x="490"
          y="78"
          textAnchor="middle"
          fill="rgba(168,85,247,0.75)"
          fontSize="10"
          fontFamily="var(--font-space-grotesk),sans-serif"
        >
          Action
        </text>
      </svg>
    </div>
  );
}

/* ── Decorative sphere for the teaser card ── */
function AboutMDSSphere() {
  return (
    <div className="relative mx-auto" style={{ width: 300, aspectRatio: "1201 / 1309" }}>
      {/* Pulsing ambient glow behind the artwork */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: "8%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,120,255,0.30) 0%, rgba(123,47,190,0.16) 55%, transparent 75%)",
          filter: "blur(34px)",
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative w-full h-full"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskComposite: "source-in",
        } as CSSProperties}
      >
        {/* Static base — the podium, connecting beam, and a fallback
            copy of the sphere itself. Never rotates: the podium is a
            platform the sphere sits on, not part of the spinning body,
            so it has to hold still while the sphere overlay above it
            turns. Its copy of the sphere only shows through at the
            rotating layer's feathered edge, where that layer fades to
            transparent — since both layers share the same source image
            at rotation 0, that seam is invisible rather than a visible
            "second sphere" underneath. */}
        <Image
          src="/about.jpeg"
          alt="MDS — a living planet of ideas"
          fill
          quality={100}
          sizes="300px"
          className="object-contain"
        />
        {/* Rotating overlay — a soft circular cutout of just the ball
            itself, pre-masked in about-sphere.png tight to its own rim
            so it excludes the ring entirely (the ring is far wider
            than the ball and would otherwise have to be included or
            cut off mid-band as it rotated out of alignment with its
            own static remainder on the base layer below — visibly
            "detaching" from the rest of the composition). Leaving the
            ring on the static base means it stays put, Saturn-style,
            while just the ball spins inside it. Pivots on the ball's
            own center (not the full artwork's center, which sits
            lower toward the podium) so it spins in place instead of
            swinging in an arc. */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "51.2% 39.7%" }}
        >
          <Image
            src="/about-sphere.png"
            alt=""
            aria-hidden
            fill
            quality={100}
            sizes="300px"
            className="object-contain"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Full expanded "About MDS" content ──────────────────────────────── */

export function AboutMDSFullContent() {
  return (
    <div className="relative max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center mb-8 md:mb-12"
        >
          <h2
            className="neue-machina"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 6rem)",
              lineHeight: 0.92,
              letterSpacing: "0.02em",
              background: "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 28%, #7AA4FF 58%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            About MDS
          </h2>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            PREMIUM BODY — replaces original 4-paragraph block
        ══════════════════════════════════════════════════════════════ */}

        {/* 1 ── Hero quote */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="mb-14 md:mb-18 text-center relative"
        >
          {/* Floating orb */}
          <motion.div
            className="absolute left-1/2 pointer-events-none"
            animate={{ y: [0, -22, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 320,
              height: 320,
              background:
                "radial-gradient(circle, rgba(0,85,255,0.13) 0%, rgba(123,47,190,0.08) 50%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(50px)",
              top: "-100px",
              transform: "translateX(-50%)",
            }}
          />

          <motion.h3
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1, ease: EASE }}
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.7rem, 3.8vw, 3.2rem)",
              lineHeight: 1.12,
              letterSpacing: "0.01em",
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 40%, #7AA4FF 80%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              position: "relative",
            }}
          >
            &ldquo;We build for what people haven&apos;t done yet.&rdquo;
          </motion.h3>

        </motion.div>

        {/* 2 ── Why We Exist */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18"
          style={{
            borderLeft: "2px solid rgba(0,212,255,0.22)",
            paddingLeft: "1.5rem",
          }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            style={{
              fontFamily: SG,
              fontSize: "0.62rem",
              letterSpacing: "0.48em",
              color: "rgba(0,212,255,0.55)",
              textTransform: "uppercase" as const,
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            Why We Exist
          </motion.span>

          <motion.h3
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.35rem, 2.6vw, 2.3rem)",
              lineHeight: 1.18,
              letterSpacing: "0.01em",
              marginBottom: "1rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.93)" }}>
              Architects of the future,{" "}
            </span>
            <br className="hidden sm:block" />
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7AA4FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              not another tech company.
            </span>
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
              lineHeight: 1.8,
              color: "#FFFFFF",
              maxWidth: 580,
            }}
          >
            We&apos;re driven by one pursuit: transformative, world-class products that solve real
            problems, unlock human potential, and leave a lasting mark — not incremental software.
          </motion.p>
        </motion.div>

        <div className="my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        {/* 3 ── The Flagship — Noorva */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center"
        >
          {/* Orbit visual */}
          <div className="flex items-center justify-center order-2 md:order-1">
            <NoorvaOrbit />
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              style={{
                fontFamily: SG,
                fontSize: "0.62rem",
                letterSpacing: "0.48em",
                color: "rgba(168,85,247,0.65)",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              The Flagship
            </motion.span>

            <motion.h3
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
              style={{
                fontFamily: NM,
                fontSize: "clamp(1.35rem, 2.6vw, 2.3rem)",
                lineHeight: 1.18,
                letterSpacing: "0.01em",
                marginBottom: "1rem",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.93)" }}>Noorva —&nbsp;</span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #a855f7 0%, #7B2FBE 50%, #00D4FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                a companion,
                <br />
                not an assistant.
              </span>
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.8,
                color: "#FFFFFF",
              }}
            >
              Noorva is built to redefine how humans interact with AI: a trusted partner for
              growth, productivity, learning, creativity, and decision-making — present in the
              moments that matter, not just the tasks you assign it.
            </motion.p>
          </div>

        </motion.div>

        <div className="my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        {/* 4 ── How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center"
        >
          {/* Left — text */}
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              style={{
                fontFamily: SG,
                fontSize: "0.62rem",
                letterSpacing: "0.48em",
                color: "rgba(122,164,255,0.60)",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              How It Works
            </motion.span>

            <motion.h3
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
              style={{
                fontFamily: NM,
                fontSize: "clamp(1.3rem, 2.4vw, 2.1rem)",
                lineHeight: 1.2,
                letterSpacing: "0.01em",
                marginBottom: "1.25rem",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.92)" }}>
                It grows the way you do —{" "}
              </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #7AA4FF 0%, #00D4FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                unevenly, but forward.
              </span>
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.8,
                color: "#FFFFFF",
              }}
            >
              Built with deep intelligence and human-centric design, Noorva understands people at a
              profound level and adapts to their evolving needs — helping you move from intention to
              action, closing the gap between what you aspire to and what you actually do.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.82rem, 1vw, 0.92rem)",
                lineHeight: 1.6,
                color: "rgba(122,164,255,0.48)",
                fontStyle: "italic",
                marginTop: "0.75rem",
              }}
            >
              Not a straight line. A real path, still moving up.
            </motion.p>
          </div>

          {/* Right — animated path */}
          <div className="flex items-center justify-center">
            <IntentionToActionPath />
          </div>
        </motion.div>

        {/* 5 ── Vision */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-10 md:mb-14 relative overflow-hidden rounded-2xl px-7 py-9 md:px-10 md:py-11"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(22px) saturate(150%)",
            WebkitBackdropFilter: "blur(22px) saturate(150%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Floating gradient sphere */}
          <motion.div
            className="absolute pointer-events-none"
            animate={{ y: [0, -14, 0], x: [0, 7, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 280,
              height: 280,
              background:
                "radial-gradient(circle, rgba(123,47,190,0.20) 0%, rgba(0,85,255,0.10) 50%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(48px)",
              top: "-80px",
              right: "-60px",
            }}
          />

          {/* Wave line */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: 50, opacity: 0.18 }}
          >
            <svg
              viewBox="0 0 1000 50"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="visionWave" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="35%" stopColor="#7B2FBE" />
                  <stop offset="65%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 0,25 C 125,8 250,42 375,25 C 500,8 625,42 750,25 C 875,8 1000,42 1000,25"
                stroke="url(#visionWave)"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <span
              style={{
                fontFamily: SG,
                fontSize: "0.62rem",
                letterSpacing: "0.48em",
                color: "rgba(168,85,247,0.65)",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              Vision
            </span>

            <h3
              style={{
                fontFamily: NM,
                fontSize: "clamp(1.35rem, 2.6vw, 2.3rem)",
                lineHeight: 1.18,
                letterSpacing: "0.01em",
                marginBottom: "1rem",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.93)" }}>Not for the present </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #7B2FBE 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                alone.
              </span>
            </h3>

            <p
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.8,
                color: "#FFFFFF",
                maxWidth: 560,
              }}
            >
              At MDS, we&apos;re laying the foundations of a smarter, more empowered tomorrow —
              where technology amplifies human capability and redefines what&apos;s possible.
            </p>
          </div>
        </motion.div>

        {/* 6 ── Closing quote — glassmorphism card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="mb-10 md:mb-14 text-center"
        >
          <p
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.4rem, 2.8vw, 2.4rem)",
              lineHeight: 1.5,
              letterSpacing: "0.01em",
              color: "rgba(255,255,255,0.88)",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            &ldquo;We are creating the foundations of a smarter,
            <br />
            more{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #a855f7 0%, #7AA4FF 50%, #00D4FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              empowered tomorrow.
            </span>
            &rdquo;
          </p>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            PILLARS
        ══════════════════════════════════════════════════════════════ */}

        {/* Pillars heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mt-10 mb-2 md:mt-14 text-center"
        >
          <span
            style={{
              fontFamily: SG,
              fontSize: "0.62rem",
              letterSpacing: "0.48em",
              color: "rgba(0,212,255,0.55)",
              textTransform: "uppercase" as const,
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            Problems We Solve
          </span>
          <h2
            style={{
              fontFamily: NM,
              fontSize: "clamp(2.4rem, 5.5vw, 5rem)",
              lineHeight: 1.0,
              letterSpacing: "0.02em",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.95)" }}>Real problems, solved by </span>
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7AA4FF 50%, #00D4FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MDS.
            </span>
          </h2>
        </motion.div>

        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.number}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-center py-5 md:py-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Left — text */}
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <span
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-mono font-semibold tracking-[0.18em] mb-3 block w-fit"
                style={{
                  background: `rgba(${pillar.glow},0.13)`,
                  border: `1px solid rgba(${pillar.glow},0.28)`,
                  backdropFilter: "blur(10px) saturate(160%)",
                  WebkitBackdropFilter: "blur(10px) saturate(160%)",
                  color: pillar.accentDot,
                }}
              >
                {pillar.number}
              </span>

              <h3
                className="neue-machina mb-0"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.8rem)",
                  lineHeight: 1.05,
                  letterSpacing: "0.01em",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.96)" }}>{pillar.title1}</span>
                <br />
                <span
                  style={{
                    background: pillar.accentGradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {pillar.title2}
                </span>
              </h3>

              <div
                className="w-2 h-2 rounded-full mt-4 mb-5"
                style={{
                  background: pillar.accentDot,
                  boxShadow: `0 0 8px ${pillar.accentDot}`,
                }}
              />

              <p
                style={{
                  fontFamily: SG,
                  fontSize: "clamp(0.88rem, 1.1vw, 1rem)",
                  lineHeight: 1.8,
                  color: "#FFFFFF",
                }}
              >
                {pillar.body}
              </p>
            </div>

            {/* Right — image */}
            <div className={`relative ${i % 2 === 1 ? "md:order-1" : ""}`}>
              <div
                className="relative w-full"
                style={{
                  aspectRatio: "4/3",
                  maskImage:
                    "radial-gradient(ellipse 55% 60% at 50% 50%, black 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.55) 44%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.03) 76%, transparent 88%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 55% 60% at 50% 50%, black 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.55) 44%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.03) 76%, transparent 88%)",
                }}
              >
                <Image
                  src={pillar.image}
                  alt=""
                  fill
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    mixBlendMode: "screen",
                    filter: "contrast(1.2) brightness(1.0) saturate(1.5)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Closing manifesto */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.2, ease: EASE }}
          className="mt-4 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.75rem" }}
        >
          <p
            className="neue-machina"
            style={{
              fontSize: "clamp(1.3rem, 3vw, 2.6rem)",
              lineHeight: 1.28,
              letterSpacing: "0.01em",
              color: "#FFFFFF",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            &ldquo;The greatest Product is the one that{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #00D4FF 0%, #7AA4FF 50%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              makes you feel more human.
            </span>
            &rdquo;
          </p>
          <p
            className="mt-5"
            style={{
              fontFamily: SG,
              fontSize: "0.72rem",
              letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
            }}
          >
            — Mahadeva Digital Solutions
          </p>
        </motion.div>

      </div>
  );
}

/* ─── Section (teaser + expandable full content) ────────────────────── */

export function WhyWeExistSection() {
  const { trigger } = usePortalTransition();

  return (
    <section id="about-mds" className="section-padding relative overflow-hidden">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative flex flex-col md:flex-row md:items-center md:justify-center md:gap-16"
        >
          {/* Left: text */}
          <div className="order-2 md:order-1 text-center md:text-left">
            <h2
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
              About MDS
            </h2>

            <p
              style={{
                fontFamily: NM,
                fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.92)",
                marginBottom: "0.9rem",
              }}
            >
              &ldquo;We build for what people haven&apos;t done yet.&rdquo;
            </p>

            <p
              className="font-semibold mb-8"
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.80)",
                letterSpacing: "0.02em",
                maxWidth: 460,
              }}
            >
              We&apos;re architects of the future, not another tech company.
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href="/about-mds"
                onClick={(e) => {
                  // Let modified clicks (new tab, ctrl/cmd/middle-click)
                  // through untouched — only intercept a plain nav click.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  trigger("/about-mds");
                }}
                className="btn-primary text-sm"
              >
                <ArrowRight className="size-4" strokeWidth={2.25} />
                Explore MDS
              </Link>
            </div>
          </div>

          {/* Right: sphere */}
          <div className="order-1 md:order-2 flex-shrink-0 pt-16 md:pt-0">
            <AboutMDSSphere />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
