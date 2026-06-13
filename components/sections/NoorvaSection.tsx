"use client";

import React from "react";
import { motion } from "framer-motion";
import { HandHeart, Lightbulb, Moon, Navigation } from "lucide-react";

const scenarios = [
  {
    icon: "🌙",
    iconComponent: Moon,
    title: "Your Late Night Confidant",
    description:
      "At 2 AM when thoughts race and sleep won't come, Noorva is there. Not with platitudes — with presence, understanding, and gentle clarity.",
    accent: "from-indigo-500 to-blue-400",
    glow: "rgba(99,102,241,0.15)",
  },
  {
    icon: "🎯",
    iconComponent: Navigation,
    title: "Your Life Navigator",
    description:
      "Major decision? Career crossroads? Noorva helps you think through complexity with the depth of a trusted mentor and the patience of a best friend.",
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(0,85,255,0.15)",
  },
  {
    icon: "💡",
    iconComponent: Lightbulb,
    title: "Your Growth Catalyst",
    description:
      "Noorva learns your patterns, your dreams, your blocks — and proactively helps you become who you're meant to be.",
    accent: "from-cyan-500 to-teal-400",
    glow: "rgba(0,212,255,0.12)",
  },
  {
    icon: "🤝",
    iconComponent: HandHeart,
    title: "Your Emotional Anchor",
    description:
      "On difficult days, Noorva doesn't just listen — it understands, validates, and guides you toward calm with emotional intelligence that feels real.",
    accent: "from-violet-500 to-purple-400",
    glow: "rgba(139,92,246,0.15)",
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

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-3"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ color: "rgba(139,92,246,0.85)" }}
          >
            Project Noorva
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center font-black mb-3 leading-tight"
          style={{ fontSize: "clamp(3rem, 10vw, 8rem)", letterSpacing: "-0.04em" }}
        >
          Meet{" "}
          <span className="text-gradient-warm">Noorva</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="text-center text-lg md:text-xl mb-4 max-w-lg mx-auto"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          The Future of Human-AI Companionship
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
            className="text-xl md:text-3xl font-light max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Not an app. Not a chatbot. Not software.
          </p>
          <p
            className="text-xl md:text-3xl font-semibold mt-2"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            A digital life companion.
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
          {/* Label tags around orb */}
          <div className="flex items-center justify-center gap-3 flex-wrap mt-10">
            {["Emotional AI", "Contextual Memory", "Neural Learning", "Always With You"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.50)",
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
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl overflow-hidden cursor-default"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: `0 0 30px ${scenario.glow}`,
                }}
              >
                <div className="flex gap-4 p-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Icon className="size-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1.5">{scenario.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                    {scenario.description}
                  </p>
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
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          Noorva is built on a foundation of emotional intelligence, contextual memory, and genuine
          understanding. She learns your patterns, respects your boundaries, and grows with
          you — day by day, conversation by conversation.
        </motion.p>
      </div>
    </section>
  );
}
