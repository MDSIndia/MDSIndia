"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

const SG = "var(--font-space-grotesk), Inter, sans-serif";
const NM = "'Neue Machina', 'Inter', sans-serif";
const EASE = [0.22, 1, 0.36, 1] as const;

const edgeFadeMask: CSSProperties = {
  maskImage:
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
  WebkitMaskComposite: "source-in",
};

const pillars = [
  {
    index: "01",
    label: "Mission",
    headline: "To create AI that genuinely understands human life — in all its complexity, emotion, and beauty.",
    image: "/pillar-mission.png",
    aspect: "1037 / 681",
    dot: "#3B82F6",
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(59,130,246,0.35)",
  },
  {
    index: "02",
    label: "Vision",
    headline: "A world where every person has an intelligent companion that helps them live more fully, intentionally, and meaningfully.",
    image: "/pillar-vision.png",
    aspect: "962 / 617",
    dot: "#A855F7",
    accent: "from-violet-500 to-blue-500",
    glow: "rgba(168,85,247,0.35)",
  },
  {
    index: "03",
    label: "Purpose",
    headline: "We don't build technology for technology's sake. We build it to advance what it means to be human.",
    image: "/pillar-purpose.png",
    aspect: "1005 / 546",
    dot: "#F5B942",
    accent: "from-amber-400 to-yellow-300",
    glow: "rgba(245,185,66,0.35)",
  },
];

function TimelineRail({ progress }: { progress: MotionValue<number> }) {
  const total = pillars.length;
  const dotTop = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="hidden md:flex flex-col items-center h-full flex-shrink-0" style={{ width: 24 }}>
      <span
        className="mb-3 text-[0.6rem] tracking-[0.3em] uppercase whitespace-nowrap"
        style={{ fontFamily: SG, color: "rgba(255,255,255,0.5)" }}
      >
        Start
      </span>
      <div className="relative flex-1 w-px" style={{ background: "rgba(255,255,255,0.16)" }}>
        {pillars.map((item, i) => (
          <span
            key={item.label}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: `${(i / (total - 1)) * 100}%`,
              width: 11,
              height: 11,
              background: item.dot,
              boxShadow: `0 0 14px ${item.glow}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        <motion.span
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: dotTop,
            width: 15,
            height: 15,
            background: "#FFFFFF",
            boxShadow: "0 0 16px rgba(255,255,255,0.85)",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}

function MobileProgress({ progress }: { progress: MotionValue<number> }) {
  const width = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <div
      className="md:hidden relative w-full rounded-full overflow-hidden mb-6"
      style={{ height: 4, background: "rgba(255,255,255,0.12)" }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width, background: "linear-gradient(to right, #3B82F6, #A855F7, #F5B942)" }}
      />
    </div>
  );
}

function ScrollPanel({
  pillar,
  index,
  total,
  progress,
}: {
  pillar: (typeof pillars)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const step = 1 / total;
  const start = index * step;
  const end = (index + 1) * step;
  const pad = step * 0.25;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const opacity = useTransform(
    progress,
    isFirst
      ? [start, start + pad, end - pad, end]
      : isLast
        ? [start, start + pad, end]
        : [start, start + pad, end - pad, end],
    isFirst ? [1, 1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0]
  );
  const scale = useTransform(
    progress,
    isFirst
      ? [end - pad, end]
      : isLast
        ? [start, start + pad]
        : [start, start + pad, end - pad, end],
    isFirst ? [1, 1.05] : isLast ? [0.95, 1] : [0.95, 1, 1, 1.05]
  );

  return (
    <motion.div
      className="absolute inset-0 flex flex-col md:flex-row items-center gap-8 md:gap-14"
      style={{ opacity, scale }}
    >
      {/* Text */}
      <div className="w-full md:w-[300px] flex-shrink-0 text-center md:text-left">
        <span
          className="block text-sm font-semibold mb-1"
          style={{ fontFamily: SG, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}
        >
          {pillar.index}
        </span>
        <span
          className={`block text-2xl md:text-3xl tracking-widest uppercase mb-4 bg-gradient-to-r ${pillar.accent} bg-clip-text text-transparent`}
          style={{ fontFamily: NM, fontWeight: 800 }}
        >
          {pillar.label}
        </span>
        <p
          className="font-medium leading-relaxed"
          style={{
            fontFamily: SG,
            fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.88)",
          }}
        >
          {pillar.headline}
        </p>
      </div>

      {/* Image */}
      <div
        className="relative w-full flex-1 rounded-2xl overflow-hidden"
        style={{ aspectRatio: pillar.aspect, ...edgeFadeMask }}
      >
        <Image
          src={pillar.image}
          alt={pillar.label}
          fill
          quality={100}
          sizes="(min-width: 768px) 640px, 92vw"
          className="object-contain"
        />
      </div>
    </motion.div>
  );
}

export function VisionSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start start", "end end"] });

  return (
    <section id="vision" className="section-padding relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[700px] h-[600px] -top-20 right-0 translate-x-1/4"
          style={{ background: "radial-gradient(ellipse, rgba(0,212,255,0.10) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[600px] h-[500px] bottom-0 left-0 -translate-x-1/4"
          style={{ background: "radial-gradient(ellipse, rgba(0,85,255,0.10) 0%, transparent 70%)" }}
        />
      </div>
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.5em] uppercase block"
            style={{ fontFamily: SG, color: "rgba(0,212,255,0.8)" }}
          >
            Our Philosophy
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 5rem)", lineHeight: 0.95, letterSpacing: "0.01em" }}
          >
            Built On
            <br />
            <span className="text-gradient">Conviction</span>
          </motion.h2>
        </div>
      </div>

      {/* Scroll-driven stage — pinned for a full screen while pillars cross-dissolve, no card framing */}
      <div ref={stageRef} className="relative" style={{ height: `${pillars.length * 100}dvh` }}>
        <div className="sticky top-0 flex items-center justify-center overflow-hidden" style={{ height: "100dvh" }}>
          <div className="relative max-w-6xl mx-auto w-full px-6 md:px-10">
            <MobileProgress progress={scrollYProgress} />

            <div
              className="relative flex items-stretch gap-6 md:gap-10"
              style={{ height: "min(58vh, 480px)" }}
            >
              <TimelineRail progress={scrollYProgress} />

              <div className="relative flex-1">
                {pillars.map((pillar, i) => (
                  <ScrollPanel
                    key={pillar.label}
                    pillar={pillar}
                    index={i}
                    total={pillars.length}
                    progress={scrollYProgress}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mt-10 md:mt-14 text-center"
        >
          <blockquote
            className="font-light leading-relaxed max-w-4xl mx-auto"
            style={{
              fontFamily: SG,
              fontSize: "clamp(1.3rem, 2.8vw, 2.4rem)",
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.70)",
            }}
          >
            &ldquo;The greatest technology is the one that{" "}
            <span className="text-gradient font-medium">
              makes you feel more human.
            </span>
            &rdquo;
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
