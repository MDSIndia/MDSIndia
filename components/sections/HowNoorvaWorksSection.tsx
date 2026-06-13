"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const STAGE_MS = 4500;

const stages = [
  {
    id: "observe", label: "Observe", number: "01",
    accent: "#00D4FF", glow: "0,212,255",
    description:
      "Noorva silently observes your habits, routines, conversations, and emotional patterns — building a real-time model of your life without being intrusive.",
    details: ["Passive behavioral mapping", "Emotional tone detection", "Contextual awareness", "Privacy-first architecture"],
  },
  {
    id: "understand", label: "Understand", number: "02",
    accent: "#818CF8", glow: "129,140,248",
    description:
      "Through thousands of micro-interactions, Noorva builds a deep, nuanced understanding of what matters to you, what stresses you, and what makes you thrive.",
    details: ["Deep semantic analysis", "Value & priority mapping", "Stress pattern recognition", "Personal model building"],
  },
  {
    id: "learn", label: "Learn", number: "03",
    accent: "#A855F7", glow: "168,85,247",
    description:
      "Noorva doesn't just gather data — she continuously refines her understanding, adapting to how you change, grow, and evolve over time.",
    details: ["Continuous model refinement", "Growth tracking", "Preference evolution", "Adaptive personalization"],
  },
  {
    id: "guide", label: "Guide", number: "04",
    accent: "#F97316", glow: "249,115,22",
    description:
      "Armed with deep understanding, Noorva proactively offers guidance, insights, and gentle nudges exactly when you need them — before you even ask.",
    details: ["Proactive recommendations", "Decision support", "Goal alignment guidance", "Timely interventions"],
  },
  {
    id: "support", label: "Support", number: "05",
    accent: "#EC4899", glow: "236,72,153",
    description:
      "In moments of joy, difficulty, uncertainty, and growth — Noorva is your unwavering companion, offering the right support in the right way at the right moment.",
    details: ["Emotional support system", "Crisis-aware responses", "Celebration & motivation", "Long-term relationship"],
  },
];

export function HowNoorvaWorksSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeRef = useRef(active);
  const progressRef = useRef(0);
  activeRef.current = active;

  const goTo = (i: number) => {
    activeRef.current = i;
    progressRef.current = 0;
    setActive(i);
    setProgress(0);
  };

  useEffect(() => {
    if (paused) return;
    const step = 100 / (STAGE_MS / 50);
    const id = setInterval(() => {
      progressRef.current += step;
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        const next = (activeRef.current + 1) % stages.length;
        activeRef.current = next;
        setActive(next);
        setProgress(0);
      }
    }, 50);
    return () => clearInterval(id);
  }, [paused]);

  const cur = stages[active];

  return (
    <section id="how-noorva" className="section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${cur.glow},0.05) 0%, transparent 70%)`,
          transition: "background 0.8s ease",
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center mb-8 md:mb-10"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase block mb-4"
            style={{ color: "rgba(0,212,255,0.78)", fontFamily: "var(--font-space-grotesk)" }}
          >
            Intelligence by Design
          </span>
          <h2
            className="neue-machina"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 7rem)",
              lineHeight: 0.92,
              letterSpacing: "0.01em",
            }}
          >
            How{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7B2FBE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Noorva
            </span>{" "}
            Works
          </h2>
        </motion.div>

        {/* ── STEP NAVIGATOR ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="flex items-center mb-3"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {stages.map((stage, i) => (
            <React.Fragment key={stage.id}>
              {i > 0 && (
                <div
                  className="flex-1 h-px relative overflow-hidden rounded-full mx-3 md:mx-5"
                  style={{ minWidth: "20px" }}
                >
                  <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.10)" }} />
                  {i <= active && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `linear-gradient(to right, ${stages[i - 1].accent}, ${stage.accent})` }}
                    />
                  )}
                </div>
              )}
              <button
                onClick={() => goTo(i)}
                className="flex flex-col items-center gap-2 flex-shrink-0 focus:outline-none"
              >
                <motion.div
                  animate={{
                    borderColor: i === active ? cur.accent : "rgba(255,255,255,0.14)",
                    boxShadow: i === active
                      ? `0 0 18px rgba(${cur.glow},0.45), 0 0 40px rgba(${cur.glow},0.18)`
                      : "none",
                    scale: i === active ? 1.12 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
                  style={{
                    border: `2px solid ${i === active ? cur.accent : "rgba(255,255,255,0.14)"}`,
                    background: i === active ? `rgba(${cur.glow},0.12)` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span
                    className="font-mono text-[0.65rem] md:text-xs font-semibold"
                    style={{ color: i === active ? cur.accent : "rgba(255,255,255,0.30)" }}
                  >
                    {stage.number}
                  </span>
                </motion.div>
                <span
                  className="text-[0.58rem] md:text-[0.68rem] tracking-[0.16em] uppercase font-medium transition-colors duration-300"
                  style={{ color: i === active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.25)" }}
                >
                  {stage.label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </motion.div>

        {/* ── PROGRESS BAR ── */}
        <div
          className="h-px rounded-full mb-6 md:mb-8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${cur.accent}66, ${cur.accent})`,
              transition: "width 0.05s linear",
            }}
          />
        </div>

        {/* ── CONTENT CARD ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative rounded-2xl md:rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: `0 0 100px rgba(${cur.glow},0.10), inset 0 0 0 1px rgba(${cur.glow},0.07)`,
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(to right, transparent 5%, ${cur.accent} 50%, transparent 95%)` }}
            />

            {/* Ghost number — decorative */}
            <div
              className="absolute right-4 md:right-10 top-2 neue-machina select-none pointer-events-none"
              style={{
                fontSize: "clamp(7rem, 18vw, 16rem)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: `rgba(${cur.glow},0.055)`,
              }}
            >
              {cur.number}
            </div>

            <div className="relative p-6 md:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-10 items-start">

              {/* Left: Heading + Description */}
              <div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="h-0.5 w-14 mb-8 rounded-full origin-left"
                  style={{ background: `linear-gradient(to right, ${cur.accent}, ${cur.accent}44)` }}
                />

                <h3
                  className="neue-machina mb-6"
                  style={{
                    fontSize: "clamp(3rem, 6.5vw, 7rem)",
                    lineHeight: 0.90,
                    letterSpacing: "-0.01em",
                    color: "rgba(255,255,255,0.96)",
                  }}
                >
                  {cur.label}
                </h3>

                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                    fontSize: "clamp(1rem, 1.25vw, 1.18rem)",
                    lineHeight: 1.78,
                    color: "rgba(255,255,255,0.56)",
                    maxWidth: "560px",
                  }}
                >
                  {cur.description}
                </p>
              </div>

              {/* Right: Detail tags */}
              <div className="flex flex-col gap-3 pt-1">
                {cur.details.map((detail, i) => (
                  <motion.div
                    key={detail}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.09, duration: 0.45, ease: EASE }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                    style={{
                      background: `rgba(${cur.glow},0.07)`,
                      border: `1px solid rgba(${cur.glow},0.15)`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: cur.accent, boxShadow: `0 0 6px ${cur.accent}` }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                        fontSize: "0.875rem",
                        color: "rgba(255,255,255,0.70)",
                      }}
                    >
                      {detail}
                    </span>
                  </motion.div>
                ))}

                {/* Stage counter */}
                <div
                  className="mt-2 flex items-center gap-1.5 px-4"
                  style={{ fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" }}
                >
                  <span style={{ color: cur.accent }}>{cur.number}</span>
                  <span>/</span>
                  <span>0{stages.length}</span>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
