"use client";

import { motion } from "framer-motion";

const scenarios = [
  {
    icon: "🌙",
    title: "Your Late Night Confidant",
    description:
      "At 2 AM when thoughts race and sleep won't come, Noorva is there. Not with platitudes — with presence, understanding, and gentle clarity.",
  },
  {
    icon: "🎯",
    title: "Your Life Navigator",
    description:
      "Major decision? Career crossroads? Noorva helps you think through complexity with the depth of a trusted mentor and the patience of a best friend.",
  },
  {
    icon: "💡",
    title: "Your Growth Catalyst",
    description:
      "Noorva learns your patterns, your dreams, your blocks — and proactively helps you become who you're meant to be.",
  },
  {
    icon: "🤝",
    title: "Your Emotional Anchor",
    description:
      "On difficult days, Noorva doesn't just listen — it understands, validates, and guides you toward calm with emotional intelligence that feels real.",
  },
];

export function NoorvaSection() {
  return (
    <section
      id="noorva"
      className="relative py-14 md:py-20 overflow-hidden"
    >
      {/* Static gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(123,47,190,0.06) 0%, transparent 60%)",
        }}
      />
      {/* Cinematic edge fades */}
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-purple-400 uppercase">
            Project Noorva
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center text-4xl md:text-7xl font-black mb-4 leading-tight"
        >
          Meet{" "}
          <span className="text-gradient-warm">Noorva</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-xl text-white/40 max-w-2xl mx-auto mb-10"
        >
          The AI Companion Designed To Understand You
        </motion.p>

        {/* Essence statement */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center text-xl md:text-3xl text-white/70 leading-relaxed font-light max-w-3xl mx-auto mb-2"
        >
          Not an app. Not a chatbot. Not software.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-xl md:text-3xl text-white font-medium mb-10"
        >
          A digital life companion.
        </motion.p>

        {/* Scenarios grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 max-w-4xl mx-auto">
          {scenarios.map((scenario, i) => (
            <motion.div
              key={scenario.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="flex gap-4 p-5 rounded-2xl glass border border-white/5 hover:border-purple-400/20 transition-colors duration-300 cursor-default"
            >
              <span className="text-2xl shrink-0 mt-0.5">{scenario.icon}</span>
              <div>
                <h4 className="text-white font-semibold mb-1">{scenario.title}</h4>
                <p className="text-white/40 text-sm leading-relaxed">
                  {scenario.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Depth copy */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/30 text-sm leading-relaxed max-w-2xl mx-auto mt-8"
        >
          Noorva is built on a foundation of emotional intelligence, contextual memory, and genuine
          understanding. She learns your patterns, respects your boundaries, and grows with
          you — day by day, conversation by conversation.
        </motion.p>
      </div>
    </section>
  );
}
