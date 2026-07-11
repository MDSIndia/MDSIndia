"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

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

export function VisionSection() {
  return (
    <section id="vision" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
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
        <div className="relative text-center mb-16 md:mb-24">
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ top: "-2rem", width: "min(1000px, 130%)", height: "220px", ...edgeFadeMask }}
          >
            <Image src="/vision-title-bg.png" alt="" fill className="object-cover opacity-80" />
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative text-xs font-medium tracking-[0.5em] uppercase"
            style={{ fontFamily: SG, color: "rgba(0,212,255,0.8)" }}
          >
            Our Philosophy
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative neue-machina mt-4"
            style={{ fontSize: "clamp(2.8rem, 7vw, 7rem)", lineHeight: 0.92, letterSpacing: "0.01em" }}
          >
            Built On
            <br />
            <span className="text-gradient">Conviction</span>
          </motion.h2>
        </div>

        {/* Timeline */}
        <div className="flex flex-col">
          {/* START marker */}
          <div className="hidden md:flex items-center gap-3 mb-3" style={{ width: 24 }}>
            <div className="flex flex-col items-center w-6 flex-shrink-0">
              <span
                className="mb-2 text-[0.6rem] tracking-[0.3em] uppercase whitespace-nowrap"
                style={{ fontFamily: SG, color: "rgba(255,255,255,0.5)" }}
              >
                Start
              </span>
              <span
                className="block rounded-full"
                style={{
                  width: 9,
                  height: 9,
                  background: "#FFFFFF",
                  boxShadow: "0 0 10px rgba(255,255,255,0.7)",
                }}
              />
            </div>
          </div>

          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: EASE }}
              className="flex gap-6 md:gap-12"
            >
              {/* Timeline gutter */}
              <div className="hidden md:flex flex-col items-center w-6 flex-shrink-0">
                <div className="w-px flex-1" style={{ background: "rgba(255,255,255,0.16)" }} />
                <motion.span
                  className="block rounded-full flex-shrink-0"
                  style={{ width: 11, height: 11, background: pillar.dot, boxShadow: `0 0 14px ${pillar.glow}` }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                />
                <div
                  className="w-px flex-1"
                  style={{ background: i === pillars.length - 1 ? "transparent" : "rgba(255,255,255,0.16)" }}
                />
              </div>

              {/* Content row */}
              <div className="flex-1 flex flex-col md:flex-row items-center gap-8 md:gap-14 pb-16 md:pb-24">
                {/* Text */}
                <div className="w-full md:w-[280px] flex-shrink-0 text-center md:text-left">
                  <span
                    className="block text-sm font-semibold mb-1"
                    style={{ fontFamily: SG, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}
                  >
                    {pillar.index}
                  </span>
                  <span
                    className={`block text-2xl tracking-widest uppercase mb-4 bg-gradient-to-r ${pillar.accent} bg-clip-text text-transparent`}
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
                <motion.div
                  className="relative w-full flex-1 rounded-2xl overflow-hidden"
                  style={{ aspectRatio: pillar.aspect, ...edgeFadeMask }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src={pillar.image}
                    alt={pillar.label}
                    fill
                    quality={100}
                    sizes="(min-width: 768px) 640px, 92vw"
                    className="object-contain"
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mt-4 text-center"
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ top: "-40px", width: "min(1100px, 140%)", height: "260px", ...edgeFadeMask }}
          >
            <Image src="/vision-closing-bg.png" alt="" fill className="object-cover opacity-60" />
          </div>

          <blockquote
            className="relative font-light leading-relaxed max-w-4xl mx-auto"
            style={{
              fontFamily: SG,
              fontSize: "clamp(1.4rem, 3.2vw, 3rem)",
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
