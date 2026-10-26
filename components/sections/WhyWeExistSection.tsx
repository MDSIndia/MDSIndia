"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, GraduationCap, Heart, Rocket, Scale, Sprout, Sun } from "lucide-react";
import { StorySection } from "./StorySection";
import { Slide } from "@/components/layout/Slide";

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

/* ── Noorva Companion visual ──
   The Noorva companion itself — the glowing orb with its living face — floating
   over a pool of light, with the things it helps with circling it on two tilted
   rings (real 3D: labels pass in front of the orb on the near side of a ring and
   behind it on the far side). Everything animates by transform/opacity only, and
   stops for reduced motion. The orb's picture and face are the same artwork used
   in the "Why We Exist" hand (see OrbHand), cropped to just the ball. */
const NB_TILT = 64; // degrees the rings lean back
const NB_RINGS = [
  { size: 98, seconds: 58, reverse: false, labels: [{ t: "Relationships", c: "#F472B6", deg: 0 }, { t: "Wellbeing", c: "#4ADE80", deg: 120 }, { t: "Decisions", c: "#FBBF24", deg: 240 }] },
  { size: 68, seconds: 40, reverse: true, labels: [{ t: "Learning", c: "#00D4FF", deg: 60 }, { t: "Productivity", c: "#A78BFA", deg: 180 }, { t: "Growth", c: "#2DD4BF", deg: 300 }] },
];

function NoorvaOrbit() {
  return (
    <div className="relative mx-auto" style={{ width: "min(100%, 480px)", aspectRatio: "1 / 1" }}>
      <style>{`
        @keyframes nbSpin { from { transform: rotateX(${NB_TILT}deg) rotateZ(0deg); } to { transform: rotateX(${NB_TILT}deg) rotateZ(360deg); } }
        @keyframes nbSpinRev { from { transform: rotateX(${NB_TILT}deg) rotateZ(0deg); } to { transform: rotateX(${NB_TILT}deg) rotateZ(-360deg); } }
        @keyframes nbUnspin { from { transform: rotateZ(0deg) rotateX(-${NB_TILT}deg); } to { transform: rotateZ(-360deg) rotateX(-${NB_TILT}deg); } }
        @keyframes nbUnspinRev { from { transform: rotateZ(0deg) rotateX(-${NB_TILT}deg); } to { transform: rotateZ(360deg) rotateX(-${NB_TILT}deg); } }
        @keyframes nbBob { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-3.5%) rotate(1deg); } }
        @keyframes nbPool { 0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(0.94); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.06); } }
        @keyframes nbBlink { 0%,90%,100% { transform: scaleY(1); } 94% { transform: scaleY(0.08); } }
        @keyframes nbGlance { 0%,22%,100% { transform: translateX(0); } 30%,50% { transform: translateX(7px); } 58%,78% { transform: translateX(-7px); } }
        .nb-ring { animation: nbSpin var(--nb-s) linear infinite; }
        .nb-ring.rev { animation-name: nbSpinRev; }
        .nb-chip { animation: nbUnspin var(--nb-s) linear infinite; }
        .nb-ring.rev .nb-chip { animation-name: nbUnspinRev; }
        .nb-ball { animation: nbBob 5s ease-in-out infinite; }
        .nb-pool { animation: nbPool 5s ease-in-out infinite; }
        .nb-eye { animation: nbBlink 4.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        .nb-eye.r { animation-delay: 0.04s; }
        .nb-face { animation: nbGlance 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .nb-ring, .nb-chip, .nb-ball, .nb-pool, .nb-eye, .nb-face { animation: none !important; } }
      `}</style>

      {/* wide, soft ambience behind everything */}
      <div
        className="absolute pointer-events-none"
        style={{ inset: "2%", borderRadius: "50%", background: "radial-gradient(circle, rgba(70,110,255,0.20) 0%, rgba(123,47,190,0.10) 48%, transparent 70%)" }}
      />

      {/* pool of light the companion floats above */}
      <div
        className="nb-pool absolute pointer-events-none"
        style={{
          left: "50%",
          top: "76%",
          width: "58%",
          height: "13%",
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(ellipse at center, rgba(150,210,255,0.55) 0%, rgba(70,130,255,0.25) 42%, transparent 72%)",
          filter: "blur(10px)",
        }}
      />

      {/* the 3D scene: rings + labels + orb share one depth space */}
      <div className="absolute inset-0" style={{ perspective: "1100px", transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {/* rings, centred just below the orb's middle */}
          {NB_RINGS.map((r) => (
            <div
              key={r.size}
              className={`absolute nb-ring ${r.reverse ? "rev" : ""}`}
              style={{
                left: `${50 - r.size / 2}%`,
                top: `${55 - r.size / 2}%`,
                width: `${r.size}%`,
                height: `${r.size}%`,
                transformStyle: "preserve-3d",
                ["--nb-s" as string]: `${r.seconds}s`,
              } as CSSProperties}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(160,190,255,0.20)", boxShadow: "0 0 24px rgba(90,140,255,0.10), inset 0 0 24px rgba(90,140,255,0.08)" }}
              />
              {r.labels.map((l) => (
                <div
                  key={l.t}
                  className="absolute"
                  style={{
                    left: `${50 + 50 * Math.sin((l.deg * Math.PI) / 180)}%`,
                    top: `${50 - 50 * Math.cos((l.deg * Math.PI) / 180)}%`,
                    transform: "translate(-50%, -50%)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <span
                    className="nb-chip inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5"
                    style={{
                      ["--nb-s" as string]: `${r.seconds}s`,
                      fontFamily: SG,
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.92)",
                      background: "linear-gradient(145deg, rgba(34,40,78,0.92) 0%, rgba(11,13,30,0.94) 100%)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      boxShadow: `0 8px 26px rgba(0,0,0,0.5), 0 0 18px ${l.c}38, inset 0 1px 0 rgba(255,255,255,0.10)`,
                    } as CSSProperties}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.c, boxShadow: `0 0 8px ${l.c}` }} />
                    {l.t}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* the companion */}
          <div
            className="absolute"
            style={{ left: "50%", top: "45%", width: "46%", aspectRatio: "480 / 540", transform: "translate(-50%, -50%)" }}
          >
            <div className="nb-ball absolute inset-0">
              <Image
                src="/images/why-we-exist/orbhand-ball15.webp"
                alt="The Noorva companion"
                fill
                quality={100}
                sizes="(max-width: 768px) 60vw, 300px"
                className="object-contain"
              />
              {/* the face, drawn in the artwork's coordinates (the ball's crop of it) */}
              <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="690 70 480 540">
                <defs>
                  <filter id="nbFaceGlow" x="-30%" y="-60%" width="160%" height="220%">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <g className="nb-face">
                  <g filter="url(#nbFaceGlow)" fill="none" stroke="#e9fcff" strokeWidth="7" strokeLinecap="round">
                    <g className="nb-eye">
                      <path d="M941 270 A30.5 32 0 0 1 1002 270" />
                    </g>
                    <g className="nb-eye r">
                      <path d="M1041 270 A24 32 0 0 1 1089 270" />
                    </g>
                    <path d="M984 306 Q1018 359 1052 306">
                      <animate
                        attributeName="d"
                        dur="4.2s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                        values="M984 306 Q1018 359 1052 306;M979 304 Q1018 376 1057 304;M984 306 Q1018 359 1052 306;M988 307 Q1018 346 1048 307;M984 306 Q1018 359 1052 306"
                      />
                    </path>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
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

/* ── The About panel's backdrop: the city plaza artwork, with the spinning
   globe (and its ring) standing on the plaza's podium. ──

   The artwork is shown with an `object-fit: cover` crop, so anything placed "on"
   it has to be placed in the picture's own coordinates. The inner box below is
   the picture's shape, sized to cover the panel (container query units) and
   centred, so percentages inside it are percentages of the picture and the globe
   stays on the podium at every screen size. */
const CITY_W = 1672;
const CITY_H = 941;
// Where the podium's top face sits in the artwork, and how big the globe is.
const PODIUM = { x: 53.6, y: 73.4 }; // % of the picture
const GLOBE_W = 16.5; // globe diameter, % of the picture's width
const BALL = { x: 613 / 1201, y: 525 / 1309, w: 0.558 }; // the ball inside the 1201×1309 globe artwork

function AboutCityBackdrop() {
  const asm = GLOBE_W / BALL.w; // width of the whole globe assembly, % of the picture
  // Centre of the globe: one radius above the podium top, hovering a little.
  const cy = PODIUM.y - ((GLOBE_W / 2) * CITY_W) / CITY_H - 2.2;
  return (
    <div className="about-bg absolute inset-0 overflow-hidden pointer-events-none" style={{ containerType: "size" }} aria-hidden>
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: `max(100cqw, calc(100cqh * ${CITY_W / CITY_H}))`,
          aspectRatio: `${CITY_W} / ${CITY_H}`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Everything that is "in" the picture dives together: the camera flies toward the
            globe (the focal point is the globe's centre), see JourneyController. */}
        <div data-zoom-layer data-keep-origin data-zoom-blur="7" className="absolute inset-0" style={{ transformOrigin: `${PODIUM.x}% ${cy}%` }}>
        <Image src="/images/about/about_city_dim.webp" alt="" fill priority sizes="100vw" className="object-cover" />

        {/* a soft pool of light on the podium under the globe */}
        <div
          className="absolute"
          style={{
            left: `${PODIUM.x}%`,
            top: `${PODIUM.y - 1}%`,
            width: "24%",
            aspectRatio: "6 / 1",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(120,190,255,0.38) 0%, rgba(80,130,255,0.14) 45%, transparent 72%)",
          }}
        />

        {/* the globe + ring, centred on its ball */}
        <div
          className="absolute"
          style={{
            left: `${PODIUM.x}%`,
            top: `${cy}%`,
            width: `${asm}%`,
            aspectRatio: "1201 / 1309",
            transform: `translate(${-BALL.x * 100}%, ${-BALL.y * 100}%)`,
          }}
        >
          <RingHalf front={false} />
          <div
            className="absolute"
            style={{
              left: "23.15%",
              top: "14.51%",
              width: "55.8%",
              aspectRatio: "1",
              borderRadius: "50%",
            }}
          >
            <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "50%" }}>
              <AboutGlobe />
            </div>
          </div>
          <RingHalf front />
        </div>
        </div>
      </div>

      {/* keeps the title and intro legible over the bright sky */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(2,2,8,0.62) 0%, rgba(2,2,8,0.3) 34%, rgba(2,2,8,0) 55%, rgba(2,2,8,0.25) 100%)" }}
      />

    </div>
  );
}

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


/* ── The orb in the hand, with a living face ────────────────────────────
   The picture is split into the hand-and-beam (base) and the ball (its own
   layer, face blanked). The ball bobs and tilts a little above the hand, and a
   small SVG face is drawn over the blank visor: the eyes blink and glance
   about, the mouth slowly morphs between a smile and a wider one, and the
   beam's light pulses in the palm. Only transform/opacity/path animate; it is
   switched off for reduced-motion users (static face). */
const ORB_BALL = { left: 690, top: 70, w: 480, h: 540 };
// Positions (artwork pixels) of the star glints cut into orbhand-stars.webp.
const ORB_STARS: [number, number][] = [[997,559],[843,555],[775,570],[986,589],[962,575],[1000,610],[1054,558]];
const ORB_FACE_INK = "#e9fcff";

function OrbHand() {
  const reduce = useReducedMotion();
  const pc = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div className="absolute inset-0" role="img" aria-label="A glowing AI companion floating above an open hand">
      <style>{`
        @keyframes orbBob { 0%,100% { transform: translateY(0) rotate(-1.2deg); } 50% { transform: translateY(-2%) rotate(1deg) scale(1.022); } }
        @keyframes orbBobSvg { 0%,100% { transform: translateY(0) rotate(-1.2deg); } 50% { transform: translateY(-11px) rotate(1deg); } }
        @keyframes orbBlink { 0%,90%,100% { transform: scaleY(1); } 94% { transform: scaleY(0.08); } }
        @keyframes orbGlance { 0%,22%,100% { transform: translateX(0); } 30%,50% { transform: translateX(7px); } 58%,78% { transform: translateX(-7px); } }
        @keyframes orbGlow { 0%,100% { opacity: 0.25; transform: scale(0.9); } 50% { opacity: 0.85; transform: scale(1.12); } }
        @keyframes orbFaceGlow { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } }
        .orb-ball { animation: orbBob 4.4s ease-in-out infinite; transform-origin: 50% 70%; }
        .orb-ball-svg { animation: orbBobSvg 4.4s ease-in-out infinite; transform-box: view-box; transform-origin: 930px 378px; }
        .orb-face { animation: orbGlance 9s ease-in-out infinite, orbFaceGlow 3.4s ease-in-out infinite; }
        .orb-eye { animation: orbBlink 4.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        .orb-eye.r { animation-delay: 0.04s; }
        @keyframes orbEmit { 0% { transform: scale(0.25); opacity: 0; } 14% { opacity: 1; } 100% { transform: scale(3.4); opacity: 0; } }
        @keyframes orbBurstPulse { 0%,100% { opacity: 0.55; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.12); } }
        @keyframes orbBeamRun { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: 1; } 80% { opacity: 0.9; } 100% { transform: translateY(-250px); opacity: 0; } }
        @keyframes orbBeamBreathe { 0%,100% { opacity: 0.35; } 50% { opacity: 0.8; } }
        .orb-burst { transform-box: view-box; transform-origin: 910px 697px; animation: orbBurstPulse 3.8s ease-in-out infinite; }
        .orb-emit { transform-box: view-box; transform-origin: 910px 697px; animation: orbEmit 4.2s ease-out infinite; opacity: 0; }
        .orb-run { animation: orbBeamRun 2.6s ease-in infinite; }
        .orb-beam-core { animation: orbBeamBreathe 3.2s ease-in-out infinite; }
        @keyframes orbStarMove { 0% { transform: translate(0,0) scale(1); opacity: 0.55; } 25% { opacity: 1; } 50% { transform: translate(var(--mx), var(--my)) scale(1.25); opacity: 0.9; } 75% { opacity: 1; } 100% { transform: translate(0,0) scale(1); opacity: 0.55; } }
        .orb-star { position: absolute; background-image: url(/images/why-we-exist/orbhand-stars.webp); background-size: 600% 200%; background-repeat: no-repeat; mix-blend-mode: screen; pointer-events: none; animation: orbStarMove 4s ease-in-out infinite; }
        .orb-palm { animation: orbGlow 3.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .orb-ball, .orb-ball-svg, .orb-face, .orb-eye, .orb-palm, .orb-burst, .orb-emit, .orb-star, .orb-run, .orb-beam-core { animation: none !important; } }
      `}</style>

      <Image
        src="/images/why-we-exist/orbhand-base18.webp"
        alt=""
        aria-hidden
        fill
        quality={100}
        sizes="(max-width: 768px) 180vw, 1080px"
        className="object-contain"
      />

      {/* Light in the palm where the beam lands. */}
      <div
        aria-hidden
        className="orb-palm absolute pointer-events-none"
        style={{
          left: "53.2%",
          top: "58%",
          width: "17%",
          height: "13%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(200,235,255,0.7) 0%, rgba(90,160,255,0.3) 45%, transparent 72%)",
          filter: "blur(8px)",
          mixBlendMode: "screen",
        }}
      />


      {/* The light: glow radiating outward from the palm in expanding
          rings, pulses of light running up the beam, and sparkles rising. All in
          the artwork's own 1479x1063 coordinates, under the ball. */}
      <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1479 1063" style={{ mixBlendMode: "screen" }}>
        <defs>
          <linearGradient id="orbRun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bfe8ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#bfe8ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbBeamG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8f4ff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#d8f4ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="orbSpark">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.4" stopColor="#9fd6ff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#4a8bff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbEmitG">
            <stop offset="0" stopColor="#bfe6ff" stopOpacity="0" />
            <stop offset="0.45" stopColor="#bfe6ff" stopOpacity="0.12" />
            <stop offset="0.68" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.85" stopColor="#8cc2ff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#4a8bff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbHalo">
            <stop offset="0" stopColor="#d8f2ff" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#6fb0ff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#3a78ff" stopOpacity="0" />
          </radialGradient>
          <filter id="orbBlur2" x="-100%" y="-30%" width="300%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {/* beam core, breathing */}
        <rect className="orb-beam-core" x="903" y="505" width="30" height="205" fill="url(#orbBeamG)" filter="url(#orbBlur2)" />


        {/* pulses running up the beam */}
        {[0, 0.9, 1.75].map((d, i) => (
          <rect key={i} className="orb-run" x="906" y="620" width="24" height="90" fill="url(#orbRun)" filter="url(#orbBlur2)" style={{ animationDelay: `${d}s` }} />
        ))}

        {/* Glow radiating outward from the palm: soft rings of light expand and
            fade, one after another, on top of a broad halo that breathes. */}
        <g className="orb-burst">
          <ellipse cx="910" cy="690" rx="300" ry="230" fill="url(#orbHalo)" />
        </g>
        {[0, 1.4, 2.8].map((d, i) => (
          <ellipse key={i} className="orb-emit" cx="910" cy="690" rx="120" ry="96" fill="url(#orbEmitG)" style={{ animationDelay: `${d}s` }} />
        ))}
        <circle cx="910" cy="697" r="40" fill="url(#orbSpark)" opacity="0.85" />

      </svg>

      {/* The star glints that are already in the picture, cut out and set
          moving: each drifts a little and twinkles, on its own timing. */}
      {ORB_STARS.map(([x, y], i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const size = 64;
        return (
          <div
            key={i}
            aria-hidden
            className="orb-star"
            style={
              {
                left: pc(x - size / 2, 1479),
                top: pc(y - size / 2, 1063),
                width: pc(size, 1479),
                height: pc(size, 1063),
                backgroundPosition: `${(col / 5) * 100}% ${(row / 1) * 100}%`,
                ["--mx" as string]: `${(((i * 37) % 17) - 8) * 1.6}px`,
                ["--my" as string]: `${(((i * 53) % 19) - 11) * 1.8}px`,
                animationDelay: `${((i * 0.43) % 4).toFixed(2)}s`,
                animationDuration: `${(3 + ((i * 7) % 5) * 0.55).toFixed(2)}s`,
              } as CSSProperties
            }
          />
        );
      })}

      <div
        className="orb-ball absolute"
        style={{
          left: pc(ORB_BALL.left, 1479),
          top: pc(ORB_BALL.top, 1063),
          width: pc(ORB_BALL.w, 1479),
          height: pc(ORB_BALL.h, 1063),
        }}
      >
        <Image
          src="/images/why-we-exist/orbhand-ball15.webp"
          alt=""
          aria-hidden
          fill
          quality={100}
          sizes="(max-width: 768px) 80vw, 560px"
          className="object-contain"
        />
      </div>

      {/* The face, in the artwork's own 1479x1063 coordinates. */}
      <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1479 1063">
        <defs>
          <filter id="orbGlowF" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="orb-ball-svg">
          <g className="orb-face">
            <g filter="url(#orbGlowF)" fill="none" stroke={ORB_FACE_INK} strokeWidth="7" strokeLinecap="round">
              <g className="orb-eye">
                <path d="M941 270 A30.5 32 0 0 1 1002 270" />
              </g>
              <g className="orb-eye r">
                <path d="M1041 270 A24 32 0 0 1 1089 270" />
              </g>
              <path d="M984 306 Q1018 359 1052 306">
                {!reduce && (
                  <animate
                    attributeName="d"
                    dur="4.2s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                    values="M984 306 Q1018 359 1052 306;M979 304 Q1018 376 1057 304;M984 306 Q1018 359 1052 306;M988 307 Q1018 346 1048 307;M984 306 Q1018 359 1052 306"
                  />
                )}
              </path>
            </g>
          </g>
        </g>
      </svg>
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

/* ── The Vision artwork: a lit Earth with a futuristic city ────────────
   One transparent picture (1536x1024) whose edges melt into the starfield.
   Two of the hover-craft are cut out as their own layers so they can fly
   about on their own. Everything else moves too: the whole scene floats and
   breathes, comets of light run along the glowing orbit ribbons, a hologram
   ripple spreads from the city's base, the sun on the rim pulses, the
   atmosphere glows, and lights twinkle over the continents and skyline. Only transform/opacity animate; reduced-motion
   users get the still picture. */
const EARTH = (name: string) => `/images/why-we-exist/vision-earth-${name}.webp`;
const EARTH_SUN = { x: 1110, y: 190 };
// Lights in the artwork's own 1536x1024 space: [x, y, start delay, radius].
const EARTH_GLINTS: [number, number, number, number][] = [
  [607, 452, 0.2, 5], [782, 438, 1.1, 4], [850, 520, 2.3, 4], [1042, 340, 0.7, 4],
  [505, 490, 1.9, 4], [1335, 458, 3.0, 5], [700, 600, 2.6, 4], [955, 590, 0.4, 4],
  [1145, 625, 1.5, 4], [482, 640, 3.4, 4], [880, 702, 2.0, 3.5], [1105, 840, 0.9, 3.5],
  [420, 780, 2.8, 3.5], [1260, 790, 1.3, 3.5],
];
// Orbit ribbons in the artwork (traced from the picture) that comets of light run along.
const EARTH_RIBBON =
  "M780 593 L810 590 L840 586 L870 582 L900 579 L930 574 L960 570 L990 567 L1020 560 L1050 556 L1080 553 L1110 546 L1140 542 L1170 539 L1200 536 L1230 530 L1260 525 L1290 518 L1320 512 L1350 504 L1380 494 L1410 482 L1440 470 L1462 448 L1462 415 L1440 388 L1400 365 L1350 347 L1300 335";
const EARTH_LOOP = "M528 232 C580 208 680 204 718 222 C690 244 590 254 528 232 Z";
// d: path, dur: seconds per lap, at: how far round the lap it starts (0-1), r: head radius,
// c: head colour, tail: number of trailing dots.
const EARTH_COMETS = [
  { d: EARTH_RIBBON, dur: 6.5, at: 0, r: 7, c: "#f1d6ff", tail: 9 },
  { d: EARTH_RIBBON, dur: 6.5, at: 0.5, r: 6, c: "#d6ecff", tail: 8 },
  { d: EARTH_LOOP, dur: 4.2, at: 0.1, r: 5, c: "#c9f0ff", tail: 8 },
];

// Hover-craft cut out as layers: how far each cruises (artwork px), and how fast.
const EARTH_CRAFT = [
  { name: "shipB", dx: 46, dy: -10, dur: 7.5, delay: 0 },
  { name: "shipC", dx: 26, dy: 5, dur: 9, delay: 1.6 },
];

function VisionEarth() {
  const reduce = useReducedMotion();
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const edgeMask =
    "radial-gradient(ellipse 60% 64% at 50% 50%, black 54%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%), linear-gradient(to top, transparent 0%, black 16%)";
  const maskStyle = {
    maskImage: edgeMask,
    maskComposite: "intersect",
    WebkitMaskImage: edgeMask,
    WebkitMaskComposite: "source-in",
  } as CSSProperties;
  const layer = (name: string, priority = false) => (
    <Image
      src={EARTH(name)}
      alt=""
      aria-hidden
      fill
      quality={100}
      priority={priority}
      sizes="(max-width: 768px) 100vw, 760px"
      className="object-contain"
    />
  );
  return (
    <div className="absolute inset-0" role="img" aria-label="Earth glowing at night, with a futuristic city and light trails orbiting it">
      {/* atmosphere glow behind the planet, breathing */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: "18%", top: "4%", width: "66%", height: "92%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(60,120,255,0.34) 0%, rgba(110,60,220,0.16) 50%, transparent 72%)",
          filter: "blur(36px)",
        }}
        animate={reduce ? undefined : { opacity: [0.55, 1, 0.55], scale: [0.96, 1.06, 0.96] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0"
        animate={reduce ? undefined : { y: [0, -12, 0], scale: [1, 1.022, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={maskStyle}
      >
        {layer("base", true)}

        {/* hover-craft cruising along their light trails */}
        {EARTH_CRAFT.map((c) => (
          <motion.div
            key={c.name}
            className="absolute inset-0"
            animate={reduce ? undefined : { x: [0, c.dx, 0], y: [0, c.dy, 0] }}
            transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            {layer(c.name)}
          </motion.div>
        ))}

        {!reduce && (
          <>
            {/* comets of light running along the orbit ribbons, each trailing a
                fading tail, plus a hologram ripple spreading from the city's base */}
            <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1536 1024" style={{ mixBlendMode: "screen" }}>
              <defs>
                <radialGradient id="earthComet">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="45%" stopColor="#d9c4ff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#8a5cff" stopOpacity="0" />
                </radialGradient>
              </defs>
              {[0, 3].map((d) => (
                <ellipse key={d} cx="770" cy="850" rx="120" ry="22" fill="none" stroke="rgba(120,200,255,0.55)" strokeWidth="2">
                  <animate attributeName="rx" values="120;690" dur="6s" begin={`${d}s`} repeatCount="indefinite" />
                  <animate attributeName="ry" values="22;120" dur="6s" begin={`${d}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0.7;0" keyTimes="0;0.2;1" dur="6s" begin={`${d}s`} repeatCount="indefinite" />
                </ellipse>
              ))}
              {EARTH_COMETS.map((c, ci) =>
                Array.from({ length: c.tail + 1 }, (_, k) => {
                  const lag = c.dur * 0.012;
                  const begin = -(c.at * c.dur + (c.tail - k) * lag);
                  const head = k === 0;
                  const r = head ? c.r : Math.max(1.2, c.r * (1 - k / (c.tail + 1)) * 0.8);
                  return (
                    <circle key={`${ci}-${k}`} r={r * (head ? 2.4 : 1.4)} fill={head ? "url(#earthComet)" : c.c} opacity="0">
                      <animateMotion path={c.d} dur={`${c.dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
                      <animate
                        attributeName="opacity"
                        values={`0;${head ? 1 : (1 - k / (c.tail + 1)) * 0.75};${head ? 1 : (1 - k / (c.tail + 1)) * 0.75};0`}
                        keyTimes="0;0.06;0.9;1"
                        dur={`${c.dur}s`}
                        begin={`${begin}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  );
                })
              )}
            </svg>

            {/* the sun catching the planet's rim */}
            <motion.div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left: pct(EARTH_SUN.x - 170, 1536), top: pct(EARTH_SUN.y - 170, 1024),
                width: pct(340, 1536), height: pct(340, 1024), borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,240,200,0.85) 0%, rgba(255,170,80,0.38) 26%, transparent 64%)",
                mixBlendMode: "screen",
              }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.18, 0.8] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* city and continent lights twinkling on their own timings */}
            <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1536 1024" style={{ mixBlendMode: "screen" }}>
              <defs>
                <radialGradient id="earthSpark">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#ffd9a0" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6aa0ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              {EARTH_GLINTS.map(([x, y, d, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="url(#earthSpark)">
                  <animate attributeName="opacity" values="0;0.95;0" dur={`${3.4 + (i % 4) * 0.8}s`} begin={`${d}s`} repeatCount="indefinite" />
                  <animate attributeName="r" values={`${r * 0.6};${r * 2.8};${r * 0.6}`} dur={`${3.4 + (i % 4) * 0.8}s`} begin={`${d}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </svg>
          </>
        )}
      </motion.div>
    </div>
  );
}

// Glints, in the artwork's own 1536x1024 space: [x, y, start delay].
const VISION_TWINKLES: [number, number, number][] = [
  [455, 215, 0.4], [1090, 215, 1.8], [1330, 470, 1.1], [700, 330, 2.6], [850, 270, 0.9], [770, 470, 3.2],
];

/* ─── Full expanded "About MDS" content ──────────────────────────────── */

export function AboutMDSFullContent({ scene = false }: { scene?: boolean }) {
  // `scene`: the About header is a full-width scene (city backdrop, globe on the
  // podium) — the homepage; elsewhere the globe sits in the page flow.
  return (
    <div className="relative max-w-6xl mx-auto hrow">

        <Slide label="About MDS" className={scene ? "about-scene" : ""} bg={scene ? <AboutCityBackdrop /> : undefined}>
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

        {/* Rotating globe (in the journey it lives on the podium in the backdrop) */}
        {!scene && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE }}
            className="mb-10 md:mb-14"
          >
            <AboutMDSSphere />
          </motion.div>
        )}
        </Slide>
        {/* ══════════════════════════════════════════════════════════════
            PREMIUM BODY — replaces original 4-paragraph block
        ══════════════════════════════════════════════════════════════ */}

        <Slide label="Why We Exist">
        {/* 2 ── Why We Exist */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 text-left grid grid-cols-1 md:grid-cols-[1.32fr_1fr] gap-4 md:gap-4 items-center"
        >
          <div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            style={{
              fontFamily: SG,
              fontSize: "1rem",
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
            className="relative mx-auto w-full max-w-[620px] md:-ml-6 md:-mr-8 -mb-4 md:mb-0"
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
              <OrbHand />
            </div>
          </motion.div>
        </motion.div>
        </Slide>
        <div className="hdivider my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        {/* 2a ── The 3 Core Values, between Why We Exist and what MDS is building */}
        <div className="-mx-6 md:-mx-10 hrow">
          <StorySection />
        </div>

        <div className="hdivider my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        <Slide label="Humanized AI">
        {/* 2b ── Personal Humanized AI — what MDS is doing today */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 text-left hstatement"
        >
          <span
            style={{
              fontFamily: SG,
              fontSize: "1rem",
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
        </Slide>
        <div className="hdivider my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        <Slide label="Noorva">
        {/* 3 ── The Flagship — Noorva */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 max-w-5xl mx-auto text-center"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            style={{
              fontFamily: SG,
              fontSize: "1rem",
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
              fontSize: "clamp(1.6rem, 3.2vw, 2.8rem)",
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              marginBottom: "1.25rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.93)" }}>Noorva Companion —</span>{" "}
            <br className="hidden md:block" />
            <span
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7B2FBE 50%, #00D4FF 100%)",
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
            className="mx-auto"
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.92rem, 1.2vw, 1.05rem)",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.88)",
              maxWidth: 740,
            }}
          >
            At the center of the Noorva Ecosystem is Noorva Companion, MDS&apos;s flagship product
            and personal lifestyle companion. Noorva Companion is designed to help people navigate:
          </motion.p>

          {/* What it helps with */}
          <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {[
              { t: "Daily life", Icon: Sun, c: "#FBBF24" },
              { t: "Relationships", Icon: Heart, c: "#F472B6" },
              { t: "Personal growth", Icon: Sprout, c: "#4ADE80" },
              { t: "Productivity", Icon: Rocket, c: "#A78BFA" },
              { t: "Wellbeing", Icon: Activity, c: "#2DD4BF" },
              { t: "Learning", Icon: GraduationCap, c: "#00D4FF" },
              { t: "Decision-making", Icon: Scale, c: "#7AA4FF" },
            ].map(({ t, Icon, c }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25 + i * 0.06, ease: EASE }}
                className="flex w-[calc(50%-0.375rem)] sm:w-[calc(25%-0.75rem)] flex-col items-center gap-3 rounded-2xl px-4 py-5 transition-transform duration-500 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `${c}1f`, border: `1px solid ${c}44`, color: c }}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <span
                  style={{
                    fontFamily: SG,
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {t}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.6, ease: EASE }}
            className="mx-auto mt-6"
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.92rem, 1.2vw, 1.05rem)",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.88)",
              maxWidth: 740,
            }}
          >
            …through deeply personalized and emotionally aware interactions.
          </motion.p>

          {/* The long-term vision */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.7, ease: EASE }}
            className="relative mx-auto mt-10 md:mt-12 overflow-hidden rounded-2xl px-6 py-6 md:px-9 md:py-7 text-left"
            style={{
              maxWidth: 820,
              background: "linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(0,212,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <span
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ background: "linear-gradient(to bottom, #a855f7, #00D4FF)" }}
            />
            <span
              style={{
                fontFamily: SG,
                fontSize: "0.72rem",
                letterSpacing: "0.4em",
                color: "rgba(0,212,255,0.7)",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: "0.6rem",
              }}
            >
              Long-term vision
            </span>
            <p
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.95rem, 1.3vw, 1.12rem)",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              To create the world&apos;s most human-centered AI ecosystem, one that enables millions of
              people to form meaningful relationships with AI that feel natural, trustworthy, and
              genuinely helpful.
            </p>
          </motion.div>
        </motion.div>
        </Slide>
        <div className="hdivider my-12 md:my-16" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        <Slide label="Noorva Ecosystem">
        {/* 4 ── How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-18 max-w-5xl mx-auto text-center"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            style={{
              fontFamily: SG,
              fontSize: "1rem",
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
              fontSize: "clamp(1.6rem, 3.2vw, 2.8rem)",
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              marginBottom: "1.25rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.92)" }}>A new category of </span>
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
            className="mx-auto"
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.92rem, 1.2vw, 1.05rem)",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.88)",
              maxWidth: 760,
            }}
          >
            To achieve this, MDS is developing the Noorva Ecosystem, a new category of
            human-centered AI powered by Emotional AI, Affective AI, and our proprietary
            Human-centered AI technologies. These technologies are designed to understand
            context, emotions, behaviors, preferences, and personal experiences, enabling more
            natural, intuitive, and emotionally intelligent interactions in a way No AI Technology did before.
          </motion.p>

          {/* Powered by — three technology cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            className="mt-10 md:mt-12"
          >
            <span
              style={{
                fontFamily: SG,
                fontSize: "0.8rem",
                letterSpacing: "0.48em",
                color: "rgba(168,85,247,0.7)",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: "1rem",
              }}
            >
              Powered by
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {["Emotional AI", "Affective AI", "MDS's Human-Centered AI"].map((t, k) => {
                const c = CHIP_COLORS[k % CHIP_COLORS.length];
                return (
                  <div
                    key={t}
                    className="relative overflow-hidden rounded-2xl px-5 py-5 text-left transition-transform duration-500 hover:-translate-y-1"
                    style={{
                      background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    <span
                      className="absolute left-0 top-0 h-[2px] w-full"
                      style={{ background: `linear-gradient(to right, ${c}, transparent 80%)` }}
                    />
                    <span
                      style={{
                        fontFamily: SG,
                        fontSize: "0.7rem",
                        letterSpacing: "0.3em",
                        color: c,
                        display: "block",
                        marginBottom: "0.6rem",
                      }}
                    >
                      {String(k + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontFamily: NM,
                        fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
                        fontWeight: 600,
                        lineHeight: 1.25,
                        color: "rgba(255,255,255,0.95)",
                      }}
                    >
                      {t}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Understands — quiet tags, colour only in the dot */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
            className="mt-9 md:mt-10"
          >
            <span
              style={{
                fontFamily: SG,
                fontSize: "0.8rem",
                letterSpacing: "0.48em",
                color: "rgba(168,85,247,0.7)",
                textTransform: "uppercase" as const,
                display: "block",
                marginBottom: "1rem",
              }}
            >
              Understands
            </span>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {["Context", "Emotions", "Behaviors", "Preferences", "Personal Experiences"].map((t, k) => {
                const c = CHIP_COLORS[(k + 3) % CHIP_COLORS.length];
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-transform duration-300 hover:-translate-y-0.5"
                    style={{
                      fontFamily: SG,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                      color: "rgba(255,255,255,0.82)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c, boxShadow: `0 0 8px ${c}` }}
                    />
                    {t}
                  </span>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
        </Slide>
        <div className="hdivider my-14 md:my-20" style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }} />

        <Slide label="Vision">
        {/* 5 ── Vision */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 md:mb-20 relative grid grid-cols-1 md:grid-cols-[0.72fr_1.28fr] gap-4 md:gap-2 items-center"
        >
          {/* Text — sits directly on the page, no card */}
          <div className="relative z-10 order-2 md:order-1 text-left -mt-4 md:mt-0">
            <span
              style={{
                fontFamily: SG,
                fontSize: "1rem",
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
              className="text-left"
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
              className="text-left"
            >
              The next 10 years at MDS will be defined not by following market trends, but by
              creating them.
            </p>
          </div>

          {/* The Earth artwork, in its own column, centred on the text. */}
          <div
            className="relative order-1 md:order-2 mx-auto w-full max-w-[600px] md:max-w-none md:-mr-8 pointer-events-none"
            style={{ aspectRatio: "3 / 2" }}
          >
            <VisionEarth />
          </div>
        </motion.div>
        </Slide>

        <Slide label="Philosophy">
        {/* 5a ── Alan Kay quote + the innovation philosophy behind it */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="mb-10 md:mb-14 text-left hstatement"
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
        </Slide>

        <Slide label="Next Decade">
        {/* 5b ── The next decade */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-10 md:mb-14 text-left hstatement"
        >
          <span
            style={{
              fontFamily: SG,
              fontSize: "1rem",
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
        </Slide>
      </div>
  );
}

/* ─── Homepage section — the full About MDS content, inline ─────────── */

export function WhyWeExistSection() {
  return (
    <section id="about-mds" className="section-padding relative overflow-hidden scroll-mt-24 hgroup">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <AboutMDSFullContent />
    </section>
  );
}
