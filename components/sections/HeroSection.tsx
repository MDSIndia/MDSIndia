"use client";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Compass, ArrowUpRight, ChevronDown } from "lucide-react";
import { HeroRiverFlow } from "./HeroRiverFlow";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

export function HeroSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center overflow-hidden"
    >
      {/* Static background image — swapped by breakpoint via Tailwind's
          responsive `hidden`/`block` rather than a single `<picture>`,
          so both variants stay simple `next/image fill` covers. */}
      <Image
        src="/herodesktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden md:block object-cover"
      />
      <Image
        src="/heromobile.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="block md:hidden object-cover"
      />
      <HeroRiverFlow variant="desktop" reducedMotion={!!reducedMotion} />
      <HeroRiverFlow variant="mobile" reducedMotion={!!reducedMotion} />

      {/* Dark gradient over the hero image so the overlaid text stays
          legible regardless of what's underneath — heavier at the
          bottom/left where the text sits, lighter toward the top-right
          so the image still reads through. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(115deg, rgba(2,2,8,0.8) 0%, rgba(2,2,8,0.5) 32%, rgba(2,2,8,0.18) 55%, rgba(2,2,8,0.08) 100%), linear-gradient(to top, rgba(2,2,8,0.72) 0%, rgba(2,2,8,0.12) 40%, rgba(2,2,8,0.25) 100%)",
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

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3.5 justify-center md:justify-start">
            <a href="#about-mds" className="btn-primary hero-cta hero-cta-primary text-sm">
              <Compass className="hero-cta-icon size-4" strokeWidth={2.25} />
              Explore MDS
            </a>
            <a
              href="https://noorva.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary hero-cta hero-cta-secondary text-sm"
            >
              <ArrowUpRight className="hero-cta-icon size-4" strokeWidth={2.25} />
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
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
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
