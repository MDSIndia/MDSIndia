"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { StorySection } from "./StorySection";

// Three.js only loads in the browser, and only once this section renders.
const AboutGlobe = dynamic(() => import("@/components/three/AboutGlobe"), { ssr: false });

const EASE = [0.22, 1, 0.36, 1] as const;
const SG = "var(--font-space-grotesk), 'Inter', sans-serif";
const NM = "var(--font-display)";

// Bright accent colours for the "Powered by" / "Understands" chips — one each,
// drawn from the site's blue / cyan / violet / pink family plus teal and amber
// so eight chips stay distinguishable.
const CHIP_COLORS = ["#00D4FF", "#7AA4FF", "#A855F7", "#2DD4BF", "#FBBF24", "#F472B6", "#4ADE80", "#FB923C"];

/* Body paragraph used by the About page's long-form copy — same look as
   the existing inline paragraphs, just not repeated for each one. */
function BodyP({
  children,
  delay = 0.18,
  style,
  className = "text-left md:text-justify",
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      style={{
        fontFamily: SG,
        fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
        lineHeight: 1.8,
        color: "#FFFFFF",
        ...style,
      }}
    >
      {children}
    </motion.p>
  );
}

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

/* ── Decorative rotating sphere for the About MDS header — stays fixed in
   place; the only motion is the globe's own rotation. ── */

// Ring geometry in the artwork's own 1201×1309 space, centred on the
// ball (the artwork's baked-in ring is centred well below the ball, so
// it's masked out and replaced by this symmetric one).
const RING_CX = 615;
const RING_CY = 520;
const RING_TILT = -7;
const RING_STRANDS = [
  { rx: 520, ry: 122, w: 5,   o: 1 },
  { rx: 545, ry: 128, w: 2.5, o: 0.7 },
  { rx: 498, ry: 116, w: 2,   o: 0.55 },
];

function RingHalf({ front }: { front: boolean }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1201 1309"
      preserveAspectRatio="none"
      aria-hidden
      style={{ mixBlendMode: "screen" }}
    >
      {front && (
        <defs>
          <linearGradient id="aboutRingGrad" gradientUnits="userSpaceOnUse" x1="-560" y1="0" x2="560" y2="0">
            <stop offset="0%" stopColor="#6FB0FF" />
            <stop offset="50%" stopColor="#8F9BFF" />
            <stop offset="100%" stopColor="#B58CFF" />
          </linearGradient>
          <filter id="aboutRingGlow" x="-10%" y="-60%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
      )}
      <g
        transform={`translate(${RING_CX} ${RING_CY}) rotate(${RING_TILT})`}
        fill="none"
        strokeLinecap="round"
        opacity={front ? 1 : 0.6}
      >
        {/* sweep-flag 0 = lower (front) half, 1 = upper (back) half */}
        {[
          ...RING_STRANDS.map((s) => ({ ...s, glow: false })),
          { ...RING_STRANDS[0], w: 14, o: 0.7, glow: true },
        ].map((s, i) => (
          <path
            key={i}
            d={`M ${-s.rx} 0 A ${s.rx} ${s.ry} 0 0 ${front ? 0 : 1} ${s.rx} 0`}
            stroke="url(#aboutRingGrad)"
            strokeWidth={s.w}
            opacity={s.o}
            filter={s.glow ? "url(#aboutRingGlow)" : undefined}
          />
        ))}
      </g>
    </svg>
  );
}

// Podium size relative to the artwork (1 = original).
const PODIUM_SCALE = 0.75;

function AboutMDSSphere() {
  // Vertical: starts below the ring, fades out at the bottom. Horizontal:
  // fades at both sides — the scaled artwork's edges now sit inside the
  // frame, so without this its near-black backdrop shows as a faint box.
  const podiumMask =
    "linear-gradient(to bottom, transparent 0%, transparent 64%, black 69%, black 88%, transparent 96%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)";

  return (
    <div className="relative mx-auto" style={{ width: "min(100%, 400px)", aspectRatio: "1201 / 1309" }}>
      {/* Ambient glow behind the artwork */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "8%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,120,255,0.30) 0%, rgba(123,47,190,0.16) 55%, transparent 75%)",
          filter: "blur(34px)",
          opacity: 0.8,
        }}
      />

      <div
        className="relative w-full h-full"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskComposite: "source-in",
        } as CSSProperties}
      >
        {/* Static base — only the podium and beam survive from the
            artwork now (the ball itself is the 3D planet below, and the
            artwork's own off-centre ring is masked out; the replacement
            ring is centred on the ball). Never rotates. */}
        {/* Podium + beam — shrunk toward the beam's glow point (the spot
            directly under the ball) so it stays centred beneath the
            globe. The mask lives on the inner div so it scales with the
            artwork. */}
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${PODIUM_SCALE})`, transformOrigin: "50.8% 73%" }}
        >
          <div
            className="absolute inset-0"
            style={{
              maskImage: podiumMask,
              maskComposite: "intersect",
              WebkitMaskImage: podiumMask,
              WebkitMaskComposite: "source-in",
            } as CSSProperties}
          >
            <Image
              src="/about.jpeg"
              alt=""
              aria-hidden
              fill
              quality={100}
              sizes="400px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Back half of the ring — behind the ball */}
        <RingHalf front={false} />

        {/* The ball — a real 3D Earth-like planet (see AboutGlobe) spinning
            left to right about its vertical axis. The canvas is a square
            exactly covering the ball's disc in the artwork (centre
            613,525 / radius 335 in the 1201×1309 space). Opaque, so it
            hides the back half of the ring. */}
        <div
          className="absolute"
          style={{
            left: "23.15%",
            top: "14.51%",
            width: "55.8%",
            aspectRatio: "1",
            borderRadius: "50%",
            // Atmosphere halo outside the planet's edge.
            boxShadow:
              "0 0 28px 4px rgba(70,150,255,0.35), 0 0 70px 14px rgba(60,110,255,0.18)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "50%" }}>
            <AboutGlobe />
          </div>
        </div>

        {/* Front half of the ring — in front of the ball, so the ring
            wraps around the globe. Static; the ball turns beneath it. */}
        <RingHalf front />
      </div>
    </div>
  );
}


/* ── The Vision artwork, with restrained motion ──────────────────────────
   The picture is split into four stacked layers cut from the one image: the
   hand and everything else (base), and three soft-edged clusters. The
   clusters drift only a few pixels, vertically, on slow, out-of-phase
   cycles — enough to read as a living hologram hovering over a steady hand,
   without anything tilting, swinging or travelling. The palm light breathes
   softly, and a few small glints twinkle. Only transform/opacity animate, so
   it stays cheap, and it is switched off for reduced-motion users. */
const VISION_LAYER = (name: string) => `/images/why-we-exist/vision-v2-${name}.webp`;

// Small bodies cut out of the artwork so they can orbit and spin on their own.
// left/top/w/h are in the artwork's 1536x1024 space; rx/ry are the orbit's
// radii in the same space; dur is seconds per revolution; spin is seconds per
// turn of the body itself (0 = none); dir flips the orbit direction.
const VISION_PARTS: {
  name: string; left: number; top: number; w: number; h: number;
  rx: number; ry: number; dur: number; spin: number; dir: 1 | -1; phase: number;
}[] = [
  { name: "orbA", left: 401, top: 38, w: 108, h: 108, rx: 30, ry: 12, dur: 16, spin: 0, dir: 1, phase: 0 },
  { name: "orbB", left: 634, top: 307, w: 96, h: 96, rx: 22, ry: 14, dur: 19, spin: 46, dir: -1, phase: 0.3 },
  { name: "orbC", left: 1381, top: 306, w: 78, h: 78, rx: 22, ry: 10, dur: 14, spin: 0, dir: 1, phase: 0.6 },
  { name: "orbD", left: 1331, top: 365, w: 114, h: 114, rx: 26, ry: 12, dur: 18, spin: 55, dir: -1, phase: 0.1 },
  { name: "orbE", left: 1150, top: 497, w: 150, h: 150, rx: 34, ry: 14, dur: 21, spin: 0, dir: 1, phase: 0.8 },
  { name: "moon", left: 1008, top: 145, w: 174, h: 174, rx: 0, ry: 0, dur: 1, spin: 38, dir: 1, phase: 0 },
];

function VisionPart({ p, reduce }: { p: (typeof VISION_PARTS)[number]; reduce: boolean | null }) {
  const steps = 16;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const t = ((i / steps) + p.phase) * Math.PI * 2 * p.dir;
    const t0 = p.phase * Math.PI * 2 * p.dir;
    // Offsets relative to the start so the body begins exactly where the
    // artwork has it, then travels an ellipse and returns.
    return {
      x: ((Math.cos(t) - Math.cos(t0)) * p.rx / p.w) * 100,
      y: ((Math.sin(t) - Math.sin(t0)) * p.ry / p.h) * 100,
    };
  });
  const orbit = !reduce && p.rx > 0;
  const spin = !reduce && p.spin > 0;
  return (
    <motion.div
      className="absolute"
      style={{ left: `${(p.left / 1536) * 100}%`, top: `${(p.top / 1024) * 100}%`, width: `${(p.w / 1536) * 100}%`, height: `${(p.h / 1024) * 100}%` }}
      animate={orbit ? { x: pts.map((q) => `${q.x}%`), y: pts.map((q) => `${q.y}%`) } : undefined}
      transition={orbit ? { duration: p.dur, repeat: Infinity, ease: "linear" } : undefined}
    >
      <motion.div
        className="absolute inset-0"
        animate={spin ? { rotate: 360 * p.dir } : undefined}
        transition={spin ? { duration: p.spin, repeat: Infinity, ease: "linear" } : undefined}
      >
        <Image
          src={VISION_LAYER(p.name)}
          alt=""
          aria-hidden
          fill
          quality={100}
          sizes="200px"
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

function VisionWorld() {
  const reduce = useReducedMotion();
  const layer = (name: string, priority = false) => (
    <Image
      src={VISION_LAYER(name)}
      alt=""
      aria-hidden
      fill
      quality={100}
      priority={priority}
      sizes="(max-width: 768px) 180vw, 1280px"
      className="object-contain"
    />
  );
  const float = (dy: number, dur: number, delay: number) =>
    reduce
      ? undefined
      : {
          animate: { y: [0, -dy, 0] },
          transition: { duration: dur, delay, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div className="absolute inset-0" role="img" aria-label="A glowing world held in an open hand, surrounded by futuristic scenes of people, technology and nature">
      <div className="absolute inset-0">{layer("base")}</div>

      {/* Palm light: breathes in and out where the world meets the hand. */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "40%",
            top: "46%",
            width: "20%",
            height: "13%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(190,225,255,0.55) 0%, rgba(90,150,255,0.25) 40%, transparent 70%)",
            filter: "blur(10px)",
            mixBlendMode: "screen",
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.div className="absolute inset-0" {...float(4, 8, 0)}>
        {layer("globe")}
      </motion.div>
      <motion.div className="absolute inset-0" {...float(6, 10, 1.2)}>
        {layer("left")}
      </motion.div>
      <motion.div className="absolute inset-0" {...float(5, 9, 2.4)}>
        {layer("right")}
      </motion.div>

      {VISION_PARTS.map((p) => (
        <VisionPart key={p.name} p={p} reduce={reduce} />
      ))}

      {/* Small glints that twinkle on the panels and globe. */}
      {!reduce && (
        <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1536 1024" style={{ mixBlendMode: "screen" }}>
          <defs>
            <radialGradient id="visionSpark">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#9fd0ff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#4a7bff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {VISION_TWINKLES.map(([x, y, d], i) => (
            <circle key={`t${i}`} cx={x} cy={y} r="4" fill="url(#visionSpark)">
              <animate attributeName="opacity" values="0;0.8;0" dur={`${3.6 + (i % 3) * 0.9}s`} begin={`${d}s`} repeatCount="indefinite" />
              <animate attributeName="r" values="2;7;2" dur={`${3.6 + (i % 3) * 0.9}s`} begin={`${d}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
}

// Glints, in the artwork's own 1536x1024 space: [x, y, start delay].
const VISION_TWINKLES: [number, number, number][] = [
  [455, 215, 0.4], [1090, 215, 1.8], [1330, 470, 1.1], [700, 330, 2.6], [850, 270, 0.9], [770, 470, 3.2],
];

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
          className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10 text-center md:text-left mb-8 md:mb-12"
        >
          <h2
            className="neue-machina md:shrink-0"
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
          <p
            className="md:pl-10 md:border-l md:border-white/15"
            style={{
              fontFamily: SG,
              fontSize: "clamp(calc(0.9rem + 2px), calc(1.2vw + 2px), calc(1.05rem + 2px))",
              lineHeight: 1.7,
              color: "#FFFFFF",
              maxWidth: 460,
            }}
          >
            Mahadeva Digital Solutions (MDS) Private Limited is a technology company based in
            Hyderabad, India. Established on May 8, 2025, and recognized under the Startup India
            initiative.
          </p>
        </motion.div>

        {/* Rotating globe */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-10 md:mb-14"
        >
          <AboutMDSSphere />
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            PREMIUM BODY — replaces original 4-paragraph block
        ══════════════════════════════════════════════════════════════ */}

        {/* 2 ── Why We Exist */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 text-left grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-8 md:gap-12 items-center"
        >
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
              To create human-centered products{" "}
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
              for a better future.
            </span>
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
            className="text-left md:text-justify"
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
              lineHeight: 1.8,
              color: "#FFFFFF",
            }}
          >
             MDS&apos;s primary focus is to design and develop innovative,
            human-centered technologies and products that address real-world problems and evolving
            human needs, transform existing markets and create new ones.
          </motion.p>

          <BodyP delay={0.26} style={{ marginTop: "1rem" }}>
            Our purpose is to develop and transform advanced, high-impact technologies into
            human-centered solutions and products that better serve people, improve human
            capabilities and quality of life at scale, and contribute to the better future of the
            world.
          </BodyP>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
            className="relative mx-auto w-full max-w-[540px]"
            style={{ aspectRatio: "1479 / 1063" }}
          >
            {/* Soft glow behind the artwork. It is a separate, unmasked layer:
                the glow used to be a drop-shadow on the image itself, which the
                mask below clipped into a visible rectangle. */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: "30%",
                top: "6%",
                width: "55%",
                height: "80%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(90,140,255,0.28) 0%, rgba(123,47,190,0.12) 50%, transparent 72%)",
                filter: "blur(34px)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                // The arm runs past the artwork's frame at the left and bottom, so
                // its cut ends read as the edge of a picture. Fade the left side
                // and the bottom smoothly into the page background; the orb,
                // beam, palm and fingers all sit inside the fully opaque area.
                maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 9%, rgba(0,0,0,0.75) 19%, black 32%), linear-gradient(to top, transparent 0%, rgba(0,0,0,0.35) 7%, rgba(0,0,0,0.75) 14%, black 24%)",
                maskComposite: "intersect",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 9%, rgba(0,0,0,0.75) 19%, black 32%), linear-gradient(to top, transparent 0%, rgba(0,0,0,0.35) 7%, rgba(0,0,0,0.75) 14%, black 24%)",
                WebkitMaskComposite: "source-in",
              }}
            >
              <Image
                src="/images/why-we-exist/orb-in-hand.png"
                alt="A glowing AI companion floating above an open hand"
                fill
                // Served at full quality and at up to 2x the displayed width: the default
                // (q75, 1x) recompression softened the orb's glints and the beam's
                // sparkle detail, which are the fine details of this artwork.
                quality={100}
                sizes="(max-width: 768px) 180vw, 1080px"
                className="object-contain"
              />
            </div>
          </motion.div>
        </motion.div>

        <div className="my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        {/* 2a ── The 3 Core Values, between Why We Exist and what MDS is building */}
        <div className="-mx-6 md:-mx-10">
          <StorySection />
        </div>

        <div className="my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        {/* 2b ── Personal Humanized AI — what MDS is doing today */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 text-left"
        >
          <span
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
            What We&apos;re Building Today
          </span>

          <h3
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.35rem, 2.6vw, 2.3rem)",
              lineHeight: 1.18,
              letterSpacing: "0.01em",
              marginBottom: "1rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.93)" }}>Noorva — </span>
            <span
              style={{
                background: "linear-gradient(135deg, #7AA4FF 0%, #00D4FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              an AI becomes a human companion.
            </span>
          </h3>

          <BodyP>
            Currently, MDS is pioneering the next generation of Personal Humanized AI with a mission
            to make artificial intelligence a natural, trusted, and meaningful part of everyday
            life.
          </BodyP>
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
              <span style={{ color: "rgba(255,255,255,0.93)" }}>Noorva Companion —&nbsp;</span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #a855f7 0%, #7B2FBE 50%, #00D4FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                your personal lifestyle companion.
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
              className="text-left md:text-justify"
            >
              At the center of the Noorva Ecosystem is Noorva Companion, MDS&apos;s flagship product
              and personal lifestyle companion. Noorva Companion is designed to help people navigate
              daily life, relationships, personal growth, productivity, wellbeing, learning, and
              decision-making through deeply personalized and emotionally aware interactions.
            </motion.p>

            <BodyP delay={0.26} style={{ marginTop: "1rem" }}>
              Our long-term vision is to create the world&apos;s most human-centered AI ecosystem,
              one that enables millions of people to form meaningful relationships with AI that
              feel natural, trustworthy, and genuinely helpful.
            </BodyP>
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
              The Noorva Ecosystem
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
                A new category of{" "}
              </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #7AA4FF 0%, #00D4FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                human-centered AI.
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
              className="text-left md:text-justify"
            >
              To achieve this, MDS is developing the Noorva Ecosystem, a new category of
              human-centered AI powered by Emotional AI, Affective AI, and our proprietary
              Human-centered AI technologies. These technologies are designed to understand
              context, emotions, behaviors, preferences, and personal experiences, enabling more
              natural, intuitive, and emotionally intelligent interactions in a way No AI Technology did before.
            </motion.p>
          </div>

          {/* Right — the three technologies and what they understand */}
          <div className="flex flex-col items-center md:items-start gap-6">
            {[
              {
                label: "Powered by",
                items: ["Emotional AI", "Affective AI", "MDS's Human-Centered AI"],
              },
              {
                label: "Understands",
                items: ["Context", "Emotions", "Behaviors", "Preferences", "Personal Experiences"],
              },
            ].map((group, g, groups) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + g * 0.12, ease: EASE }}
                className="text-center md:text-left"
              >
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
                  {group.label}
                </span>
                <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                  {group.items.map((t, k) => {
                    // One colour per chip, continuing through the second group
                    // so no two neighbouring chips match.
                    const offset = groups.slice(0, g).reduce((n, grp) => n + grp.items.length, 0);
                    const c = CHIP_COLORS[(offset + k) % CHIP_COLORS.length];
                    return (
                      <span
                        key={t}
                        className="px-4 py-2 rounded-full text-xs font-semibold uppercase"
                        style={{
                          fontFamily: SG,
                          letterSpacing: "0.12em",
                          color: c,
                          background: `${c}1c`,
                          border: `1px solid ${c}66`,
                          boxShadow: `0 0 18px ${c}22, inset 0 1px 0 ${c}22`,
                          backdropFilter: "blur(14px) saturate(150%)",
                          WebkitBackdropFilter: "blur(14px) saturate(150%)",
                        }}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="my-14 md:my-20" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        {/* 5 ── Vision */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-20 relative grid grid-cols-1 md:grid-cols-[1fr_1.05fr] gap-8 md:gap-10 items-center"
        >
          {/* Text — sits directly on the page, no card */}
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
              <span style={{ color: "rgba(255,255,255,0.93)" }}>To be the most innovative technology company </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #7B2FBE 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                in the world.
              </span>
            </h3>

            <p
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.8,
                color: "#FFFFFF",
              }}
              className="text-left md:text-justify"
            >
              Our long-term goal is to become the most innovative technology company in the world
              within the next 10 years and to help transform the world into a more advanced and
              futuristic society by accelerating progress that might otherwise take at least 30
              years or more to achieve.
            </p>

            <p
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.8,
                color: "#FFFFFF",
                marginTop: "0.9rem",
              }}
              className="text-left md:text-justify"
            >
              The next 10 years at MDS will be defined not by following market trends, but by
              creating them.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
            className="relative mx-auto w-full max-w-[640px] md:-mr-6"
            style={{ aspectRatio: "3 / 2" }}
          >
            {/* Soft glow behind the artwork (a separate layer so it is not
                clipped by the mask below). */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: "12%",
                top: "4%",
                width: "76%",
                height: "76%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(90,140,255,0.26) 0%, rgba(123,47,190,0.12) 52%, transparent 72%)",
                filter: "blur(40px)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                // The wrist runs off the artwork's bottom-right corner and bottom
                // edge; fade both into the page rather than ending in a flat cut.
                maskImage: "linear-gradient(to top left, transparent 0%, rgba(0,0,0,0.6) 9%, black 24%), linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) 5%, black 16%)",
                maskComposite: "intersect",
                WebkitMaskImage: "linear-gradient(to top left, transparent 0%, rgba(0,0,0,0.6) 9%, black 24%), linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) 5%, black 16%)",
                WebkitMaskComposite: "source-in",
              }}
            >
              <VisionWorld />
            </div>
          </motion.div>
        </motion.div>

        {/* 5a ── Alan Kay quote + the innovation philosophy behind it */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="mb-10 md:mb-14 text-left"
        >
          {/* The quote, highlighted through the type alone — no box. Larger
              and brighter than the body, with a soft white glow, the key
              phrase in a glowing gradient, and a gradient rule under it. */}
          <p
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.9rem, 4.2vw, 3.8rem)",
              lineHeight: 1.25,
              letterSpacing: "0.005em",
              color: "#FFFFFF",
              fontWeight: 800,
              textAlign: "left",
              textShadow: "0 0 34px rgba(255,255,255,0.28)",
            }}
          >
            &ldquo;The best way to predict the future is to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #c084fc 0%, #7AA4FF 50%, #22E0FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 18px rgba(122,164,255,0.6))",
              }}
            >
              invent it.
            </span>
            &rdquo;
          </p>
          <div className="mt-6 mb-8 flex items-center gap-4">
            <span
              aria-hidden
              style={{
                display: "block",
                width: 72,
                height: 3,
                borderRadius: 2,
                background: "linear-gradient(to right, #a855f7, #7AA4FF, #00D4FF)",
                boxShadow: "0 0 14px rgba(122,164,255,0.6)",
              }}
            />
            <p
              style={{
                fontFamily: SG,
                fontSize: "0.8rem",
                letterSpacing: "0.4em",
                color: "rgba(216,238,255,0.85)",
                textTransform: "uppercase",
              }}
            >
              Alan Kay
            </p>
          </div>

          <BodyP>
            At MDS, we believe true innovation goes beyond improving what already exists. It means
            challenging assumptions, redefining standards, and creating entirely new possibilities.
          </BodyP>
          <BodyP delay={0.26} style={{ marginTop: "1rem" }}>
            By combining first-principles thinking with a relentless focus on solving meaningful
            problems, we aim to create products, experiences, and markets that shape the future.
          </BodyP>
          <BodyP delay={0.34} style={{ marginTop: "1rem" }}>
            We do not aspire to be the best within the existing game. We aspire to redefine the game
            itself. The next decade for MDS is about imagining what does not yet exist and turning
            it into reality.
          </BodyP>
        </motion.div>

        {/* 5b ── The next decade */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-10 md:mb-14 text-left"
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
            The Next Decade
          </span>
          <h3
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.35rem, 2.6vw, 2.3rem)",
              lineHeight: 1.18,
              letterSpacing: "0.01em",
              marginBottom: "1rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.93)" }}>Beyond AI, into </span>
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7AA4FF 50%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              four new frontiers.
            </span>
          </h3>
          <p
            className="text-left md:text-justify"
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
              lineHeight: 1.8,
              color: "#FFFFFF",
              margin: "0 0 1.5rem",
            }}
          >
            Over the next ten years, MDS will expand its operations beyond artificial intelligence
            into four new areas: Quantum Technology, Nano technology, Automobiles, and Space tech.
            MDS plans to use Quantum Technology as a foundation to help advance the other three
            technologies it wants to focus on.
          </p>
          <div className="flex flex-wrap items-center justify-start gap-3">
            {["Quantum Technology", "Nano Technology", "Automobiles", "Space Tech"].map((t) => (
              <span
                key={t}
                className="px-4 py-2 rounded-full text-xs font-medium uppercase"
                style={{
                  fontFamily: SG,
                  letterSpacing: "0.12em",
                  color: "rgba(216,238,255,0.92)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(14px) saturate(150%)",
                  WebkitBackdropFilter: "blur(14px) saturate(150%)",
                }}
              >
                {t}
              </span>
            ))}
          </div>

         
          
        </motion.div>

      </div>
  );
}

/* ─── Homepage section — the full About MDS content, inline ─────────── */

export function WhyWeExistSection() {
  return (
    <section id="about-mds" className="section-padding relative overflow-hidden scroll-mt-24">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <AboutMDSFullContent />
    </section>
  );
}
