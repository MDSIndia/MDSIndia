"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const seeded = (index: number, salt: number) => {
  const v = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const HERO_STARS = Array.from({ length: 80 }, (_, i) => ({
  x: seeded(i, 11) * 100,
  y: seeded(i, 12) * 100,
  size: 1.4 + seeded(i, 13) * 2.2,
  opacity: 0.28 + seeded(i, 14) * 0.42,
  color: ["255,255,255", "220,235,255", "200,220,255", "255,255,255"][Math.floor(seeded(i, 15) * 4)],
  duration: 12 + seeded(i, 16) * 18,
  delay: -seeded(i, 17) * 28,
  dx: (seeded(i, 18) - 0.5) * 72,
  dy: -18 - seeded(i, 19) * 38,
}));

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY         = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen overflow-hidden"
    >
      {/* ── IMAGE — moved up, screen-blended ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "8%",
          left: 0,
          right: 0,
          bottom: 0,
          mixBlendMode: "screen",
          y: imageY,
          pointerEvents: "none",
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/herosection.jpeg"
            alt=""
            fill
            priority
            style={{
              objectFit: "contain",
              objectPosition: "center top",
              filter: "brightness(0.80) saturate(0.80)",
            }}
          />

          {/* Edge blur — blurs sides/corners, transparent in center so sphere stays sharp */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(7px)",
              WebkitBackdropFilter: "blur(7px)",
              maskImage:
                "radial-gradient(ellipse 48% 52% at 50% 42%, transparent 0%, transparent 28%, rgba(0,0,0,0.6) 55%, black 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 48% 52% at 50% 42%, transparent 0%, transparent 28%, rgba(0,0,0,0.6) 55%, black 75%)",
            }}
          />

          {/* Edge dark vignette — additional dimming of sides */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 50% 55% at 50% 42%, transparent 0%, transparent 30%, rgba(2,2,8,0.45) 58%, rgba(2,2,8,0.80) 80%, rgba(2,2,8,0.92) 100%)",
            }}
          />

          {/* Left & right linear darkening */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(2,2,8,0.75) 0%, transparent 22%, transparent 78%, rgba(2,2,8,0.75) 100%)",
            }}
          />
        </div>
      </motion.div>

      {/* Dark gradient — solid at top (text zone), fades to transparent toward image */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "68%",
          background:
            "linear-gradient(to bottom, #020208 0%, #020208 18%, rgba(2,2,8,0.88) 42%, rgba(2,2,8,0.38) 62%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* ── HERO STARS — same palette as GlobalStars, visible above gradient ── */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, zIndex: 15, pointerEvents: "none", overflow: "hidden" }}
      >
        {HERO_STARS.map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: "50%",
              opacity: s.opacity,
              background: `rgba(${s.color}, 1)`,
              boxShadow: `0 0 ${Math.max(5, s.size * 5)}px rgba(${s.color}, ${s.opacity})`,
              animation: `starDrift ${s.duration}s linear infinite, starTwinkle ${5 + (i % 6)}s ease-in-out infinite`,
              animationDelay: `${s.delay}s, ${-(i % 7)}s`,
              "--star-dx": `${s.dx}px`,
              "--star-dy": `${s.dy}px`,
            } as CSSProperties}
          />
        ))}
      </div>

      {/* Bottom fade — smooth section transition */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "18%",
          background: "linear-gradient(to top, #020208 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* ── CONTENT — upper half, clear of the image ── */}
      <motion.div
        style={{ opacity: contentOpacity, position: "relative", zIndex: 20 }}
        className="flex flex-col items-center text-center min-h-screen justify-start"
      >
        <div
          className="w-full max-w-4xl px-6"
          style={{ paddingTop: "clamp(6rem, 13vh, 9rem)" }}
        >

          {/* Label */}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="block text-xs font-medium tracking-[0.5em] uppercase mb-5"
            style={{ color: "rgba(0,200,255,0.72)", fontFamily: "var(--font-space-grotesk)" }}
          >
            Mahadeva Digital Solutions
          </motion.span>

          {/* Main heading */}
          <h1
            className="neue-machina mb-5"
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 6rem)",
              lineHeight: 1.0,
              letterSpacing: "0.01em",
            }}
          >
            <motion.span
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.18, ease: EASE }}
              className="block"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #D8EEFF 40%, #7AB8FF 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Building Tomorrow&apos;s Technology
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.32, ease: EASE }}
              className="block"
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7AA4FF 45%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(0,180,255,0.45))",
              }}
            >
              for Today&apos;s World
            </motion.span>
          </h1>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.48, ease: EASE }}
            className="mx-auto h-px mb-5 origin-center"
            style={{
              width: "72px",
              background: "linear-gradient(to right, transparent, rgba(0,168,255,0.8), transparent)",
            }}
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.58, ease: EASE }}
            className="font-semibold mb-2 text-sm md:text-base"
            style={{ color: "rgba(255,255,255,0.88)", fontFamily: "var(--font-space-grotesk)" }}
          >
            Empowering The Future Through Technology
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.68, ease: EASE }}
            className="text-sm font-light mb-8 mx-auto"
            style={{
              color: "rgba(255,255,255,0.42)",
              fontFamily: "var(--font-space-grotesk)",
              lineHeight: 1.75,
              maxWidth: "440px",
            }}
          >
            Building the future through intelligence, innovation, and Noorva —
            our next-generation AI companion.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.78, ease: EASE }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <a
              href="#vision"
              className="px-7 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-105 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #0055FF, #00D4FF)",
                boxShadow: "0 0 28px rgba(0,85,255,0.44), 0 0 60px rgba(0,180,255,0.12)",
              }}
            >
              Explore Our Vision
            </a>
            <a
              href="#noorva"
              className="px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.75)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,212,255,0.45)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
                e.currentTarget.style.color = "rgba(255,255,255,0.75)";
              }}
            >
              Discover Noorva
            </a>
          </motion.div>

        </div>
      </motion.div>

    </section>
  );
}
