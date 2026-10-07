"use client";

import React from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, HandHeart, Lightbulb, Navigation } from "lucide-react";

// The areas of life Noorva Companion is designed to help people
// navigate, grouped into four cards. Each card gets one clearly
// distinct accent: blue and cyan come from Noorva's own orb/text-gradient
// palette; violet and rose extend that same family into hues that
// stay far enough apart to avoid the "two purples" look.
const scenarios = [
  {
    iconComponent: CalendarCheck,
    title: "Daily Life & Productivity",
    description:
      "Noorva Companion helps people navigate daily life and stay productive, through deeply personalized and emotionally aware interactions.",
    color: "#0055FF",
    glow: "rgba(0,85,255,0.22)",
  },
  {
    iconComponent: HandHeart,
    title: "Relationships & Wellbeing",
    description:
      "Understanding emotions, behaviors, and personal experiences, Noorva supports people through relationships and everyday wellbeing.",
    color: "#EC4899",
    glow: "rgba(236,72,153,0.22)",
  },
  {
    iconComponent: Lightbulb,
    title: "Personal Growth & Learning",
    description:
      "A companion that grows alongside you — supporting your personal growth and learning as your context and preferences evolve.",
    color: "#A855F7",
    glow: "rgba(168,85,247,0.22)",
  },
  {
    iconComponent: Navigation,
    title: "Decision-Making",
    description:
      "By understanding your context, emotions, and preferences, Noorva helps you make decisions with more natural, intuitive, and emotionally intelligent support.",
    color: "#00D4FF",
    glow: "rgba(0,212,255,0.22)",
  },
];

function NoorvaOrb() {
  const S: React.CSSProperties = { position: "absolute" };
  return (
    <div
      className="relative mx-auto"
      style={{ width: "280px", height: "280px", perspective: "900px" }}
    >
      {/* Outer aura pulse rings — animate outward then fade */}
      <div style={{ ...S, inset: "-60px", borderRadius: "50%", border: "1px solid rgba(0,85,255,0.14)", animation: "outerRingPulse 4s ease-out infinite" }} />
      <div style={{ ...S, inset: "-35px", borderRadius: "50%", border: "1px solid rgba(0,212,255,0.20)", animation: "outerRingPulse 4s ease-out infinite 1.4s" }} />
      <div style={{ ...S, inset: "-14px", borderRadius: "50%", border: "1px solid rgba(0,212,255,0.28)", animation: "outerRingPulse 4s ease-out infinite 2.8s" }} />

      {/* Orbital ring 1 — tilted, rotating */}
      <div style={{
        ...S, inset: "-18px", borderRadius: "50%",
        border: "1px solid rgba(0,212,255,0.38)",
        animation: "ringOrbit 9s linear infinite",
      }} />

      {/* Orbital ring 2 — different tilt angle */}
      <div style={{
        ...S, inset: "-8px", borderRadius: "50%",
        border: "1px solid rgba(139,92,246,0.32)",
        animation: "ringOrbitAlt 14s linear infinite",
      }} />

      {/* Core sphere */}
      <div style={{
        ...S, inset: "0", borderRadius: "50%",
        background: "radial-gradient(circle at 34% 30%, rgba(0,212,255,1), rgba(0,85,255,0.85) 45%, rgba(100,30,185,0.92) 80%)",
        animation: "orbPulse 4.5s ease-in-out infinite",
      }} />

      {/* Specular highlight */}
      <div style={{
        ...S,
        top: "12%", left: "12%", right: "42%", bottom: "42%",
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.50), transparent 60%)",
      }} />

      {/* Inner cyan glow */}
      <div style={{
        ...S,
        top: "30%", left: "30%", right: "30%", bottom: "30%",
        borderRadius: "50%",
        background: "radial-gradient(circle at center, rgba(0,212,255,0.45), transparent 70%)",
      }} />

      {/* Orbiting particle 1 — cyan */}
      <div style={{
        ...S,
        top: "50%", left: "50%",
        width: "8px", height: "8px",
        marginTop: "-4px", marginLeft: "-4px",
        borderRadius: "50%",
        background: "rgba(0,212,255,1)",
        boxShadow: "0 0 14px rgba(0,212,255,0.9), 0 0 28px rgba(0,212,255,0.45)",
        transformOrigin: "4px 4px",
        animation: "orbitParticle1 6s linear infinite",
      }} />

      {/* Orbiting particle 2 — purple */}
      <div style={{
        ...S,
        top: "50%", left: "50%",
        width: "6px", height: "6px",
        marginTop: "-3px", marginLeft: "-3px",
        borderRadius: "50%",
        background: "rgba(168,85,247,1)",
        boxShadow: "0 0 10px rgba(168,85,247,0.9), 0 0 20px rgba(168,85,247,0.45)",
        transformOrigin: "3px 3px",
        animation: "orbitParticle2 9s linear infinite",
      }} />

      {/* Orbiting particle 3 — white */}
      <div style={{
        ...S,
        top: "50%", left: "50%",
        width: "4px", height: "4px",
        marginTop: "-2px", marginLeft: "-2px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 0 8px rgba(255,255,255,0.8)",
        transformOrigin: "2px 2px",
        animation: "orbitParticle3 12s linear infinite",
      }} />
    </div>
  );
}

export function NoorvaSection() {
  return (
    <section
      id="noorva"
      className="section-padding relative overflow-hidden"
    >
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-3"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(139,92,246,0.90)" }}
          >
            The Noorva Ecosystem
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="neue-machina text-center mb-3"
          style={{ fontSize: "clamp(3rem, 10vw, 8rem)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
        >
          Meet{" "}
          <span className="text-gradient-warm">Noorva</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="text-center mb-4 max-w-lg mx-auto"
          style={{
            fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
            fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          Personal Humanized AI — Part of the Noorva Ecosystem
        </motion.p>

        {/* Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <p
            className="font-light max-w-2xl mx-auto leading-relaxed"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1.1rem, 2.2vw, 1.75rem)",
              color: "rgba(255,255,255,0.68)",
            }}
          >
            From a tool people use, into a companion that genuinely understands, supports, and
            grows alongside them.
          </p>
          <p
            className="font-semibold mt-2"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1.1rem, 2.2vw, 1.75rem)",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Noorva Companion — a personal lifestyle companion.
          </p>
        </motion.div>

        {/* AI Orb — the centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <NoorvaOrb />
          {/* Label tags around orb — HUD status-readout chips */}
          <div className="flex items-center justify-center gap-3 flex-wrap mt-10">
            {["Emotional AI", "Affective AI", "Human-Interactive AI"].map((tag) => (
              <span
                key={tag}
                className="hud-tag px-3.5 py-1.5 rounded-full text-[0.7rem] font-medium uppercase"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  letterSpacing: "0.06em",
                  color: "rgba(180,225,255,0.85)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Scenarios grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
          {scenarios.map((scenario, i) => {
            const Icon = scenario.iconComponent;

            return (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.09 }}
                whileHover={{
                  y: -6,
                  boxShadow: `0 12px 44px ${scenario.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  transition: { duration: 0.25 },
                }}
                className="hud-panel cursor-default"
                style={{
                  ["--card-c0" as string]: scenario.color,
                  ["--card-c1" as string]: scenario.color,
                } as CSSProperties}
              >
                <div className="hud-panel-inner">
                  {/* Index readout — reinforces the panel-of-data feel */}
                  <span
                    className="absolute top-4 right-5 text-[0.65rem] z-10"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      color: `${scenario.color}99`,
                      letterSpacing: "0.05em",
                    }}
                  >
                    N.0{i + 1}
                  </span>

                  <div className="relative flex gap-4 p-5">
                    <Icon
                      className="size-7 shrink-0"
                      strokeWidth={2}
                      style={{ color: scenario.color, filter: `drop-shadow(0 0 8px ${scenario.glow})` }}
                    />
                    <div>
                      <h4
                        className="mb-1.5"
                        style={{
                          fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                          fontWeight: 700,
                          letterSpacing: "0.01em",
                          color: "#ffffff",
                        }}
                      >
                        {scenario.title}
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.72)" }}
                      >
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Closing text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm leading-relaxed max-w-2xl mx-auto mt-12"
          style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.52)" }}
        >
          Noorva Companion is the flagship of the Noorva Ecosystem — a new category of
          human-centered AI powered by Emotional AI, Affective AI, and our proprietary
          Human-Interactive AI, designed to understand context, emotions, behaviors, preferences,
          and personal experiences. Our vision is to transform AI from a tool people use into a
          companion that genuinely understands, supports, and grows alongside them — the world&apos;s
          most human-centered AI ecosystem, where millions of people can form meaningful
          relationships with AI that feel natural, trustworthy, and genuinely helpful.
        </motion.p>
      </div>
    </section>
  );
}
