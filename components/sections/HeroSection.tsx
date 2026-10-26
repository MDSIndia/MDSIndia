"use client";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Compass, ArrowUpRight, ChevronDown } from "lucide-react";
import { Doors } from "@/components/layout/Doors";
import { HeroCityLife } from "./HeroCityLife";
import { HeroRiverFlow } from "./HeroRiverFlow";

// object-position of the phone hero image, as fractions — the city-life canvas uses the same crop.
const MOBILE_POS: [number, number] = [0.6, 0.6];

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
      data-slide
      data-label="Home"
      data-zoom
      className="hero-slide relative w-full min-h-[100svh] flex items-center overflow-hidden"
    >
      <Doors label="Home" className="hero-door">
      {/* Static background image — swapped by breakpoint via Tailwind's
          responsive `hidden`/`block` rather than a single `<picture>`, so both
          variants stay simple `next/image fill` covers. object-position keeps the
          skyline, river and the figure on the balcony in frame when the viewport
          crops the image to cover. */}
      {/* The artwork drifts very slowly (a gentle push-in) with the living-city
          canvas riding on it, so lights and traffic stay locked to the picture. */}
      <div className="hero-city-zoom absolute inset-0">
      <div className="hero-city-drift absolute inset-0">
      <Image
        src="/herodesktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden md:block object-cover"
        style={{ objectPosition: "50% 78%" }}
      />
      <Image
        src="/images/hero/hero_mobile_hd.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="block md:hidden object-cover"
        style={{ objectPosition: "60% 60%" }}
      />
      {/* Desktop: the night city on the glowing river — light streaks flow along the water. */}
      <HeroRiverFlow variant="desktop" reducedMotion={!!reducedMotion} />
      <HeroCityLife variant="mobile" position={MOBILE_POS} reducedMotion={!!reducedMotion} className="block md:hidden" />
      </div>
      </div>

      {/* Dark gradient over the hero image so the overlaid text stays
          legible regardless of what's underneath — heavier at the
          bottom/left where the text sits, lighter toward the top-right
          so the image still reads through. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(115deg, rgba(2,2,8,0.62) 0%, rgba(2,2,8,0.34) 32%, rgba(2,2,8,0.08) 55%, rgba(2,2,8,0) 100%), linear-gradient(to top, rgba(2,2,8,0.5) 0%, rgba(2,2,8,0.04) 40%, rgba(2,2,8,0.12) 100%)",
        }}
      />

      {/* Soft vignette — pulls focus toward center/text instead of the
          flat corners, same technique used on the intro cinematic. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(2,2,8,0.12) 75%, rgba(2,2,8,0.32) 100%)",
        }}
      />

      {/* Phones only: the copy is centred over the busiest part of the picture, so
          darken that band (and a little above and below it) to keep it legible. */}
      <div
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(2,2,8,0.22) 0%, rgba(2,2,8,0.5) 28%, rgba(2,2,8,0.62) 50%, rgba(2,2,8,0.42) 76%, rgba(2,2,8,0.2) 100%)",
        }}
      />


      {/* Text overlay. The wrapper is what the journey fades and lifts as the camera
          flies into the city (see JourneyController, data-zoom). */}
      <div className="hero-fade relative z-10 w-full">
      <motion.div
        className="relative w-full px-6 sm:px-10 md:px-20"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } } }}
      >
        <div className="text-center md:text-left mx-auto md:mx-0" style={{ maxWidth: "880px" }}>
          <motion.h1
            variants={fadeUp}
            className="neue-machina mb-5"
            style={{
              fontSize: "clamp(1.9rem, 3.1vw, 3.75rem)",
              lineHeight: 1.1,
              fontWeight: 700,
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, #FFFFFF 70%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              // (a drop-shadow, not text-shadow: the text is a clipped background)
              filter: "drop-shadow(0 2px 14px rgba(0,0,0,0.65))",
            }}
          >
            {/* Four deliberate lines on desktop (block spans) so the
                headline reads as balanced phrases instead of wrapping
                arbitrarily; on mobile the spans stay inline and wrap
                naturally to the narrow viewport. */}
            <span className="md:block">Building Future</span>{" "}
            <span className="md:block">through Advanced Technologies</span>{" "}
            
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-semibold mb-8"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1rem, 1.2vw, 1.05rem)",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 12px rgba(0,0,0,0.75)",
              letterSpacing: "0.02em",
            }}
          >
            Human-Centered Products for a Better Future
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3.5 justify-center md:justify-start">
            <a href="#about-mds" className="btn-primary hero-cta hero-cta-primary text-sm">
              <Compass className="hero-cta-icon size-5" strokeWidth={2.25} />
              Explore MDS
            </a>
            <a
              href="https://noorva.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary hero-cta hero-cta-secondary text-sm"
            >
              <ArrowUpRight className="hero-cta-icon size-5" strokeWidth={2.25} />
              Discover Noorva
            </a>
          </motion.div>
        </div>
      </motion.div>
      </div>

      {/* Scroll cue — a small, quiet nudge that there's more below,
          not shown for reduced-motion (it's a bounce animation and
          nothing but decoration). */}
      {!reducedMotion && (
        <div className="hero-fade absolute inset-0 z-10 pointer-events-none">
        <motion.div
          className="hero-cue absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 pointer-events-none"
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
        </div>
      )}
      </Doors>
    </section>
  );
}
