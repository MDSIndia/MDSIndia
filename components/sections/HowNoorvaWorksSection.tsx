"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const stages = [
  {
    id: "observe",
    label: "Observe",
    number: "01",
    icon: "👁",
    color: "from-blue-600 to-blue-400",
    description:
      "Noorva silently observes your habits, routines, conversations, and emotional patterns — building a real-time model of your life without being intrusive.",
    details: [
      "Passive behavioral mapping",
      "Emotional tone detection",
      "Contextual awareness",
      "Privacy-first architecture",
    ],
  },
  {
    id: "understand",
    label: "Understand",
    number: "02",
    icon: "🧠",
    color: "from-cyan-400 to-teal-400",
    description:
      "Through thousands of micro-interactions, Noorva builds a deep, nuanced understanding of what matters to you, what stresses you, and what makes you thrive.",
    details: [
      "Deep semantic analysis",
      "Value & priority mapping",
      "Stress pattern recognition",
      "Personal model building",
    ],
  },
  {
    id: "learn",
    label: "Learn",
    number: "03",
    icon: "⚡",
    color: "from-purple-500 to-purple-400",
    description:
      "Noorva doesn't just gather data — she continuously refines her understanding, adapting to how you change, grow, and evolve over time.",
    details: [
      "Continuous model refinement",
      "Growth tracking",
      "Preference evolution",
      "Adaptive personalization",
    ],
  },
  {
    id: "guide",
    label: "Guide",
    number: "04",
    icon: "🧭",
    color: "from-orange-500 to-yellow-400",
    description:
      "Armed with deep understanding, Noorva proactively offers guidance, insights, and gentle nudges exactly when you need them — before you even ask.",
    details: [
      "Proactive recommendations",
      "Decision support",
      "Goal alignment guidance",
      "Timely interventions",
    ],
  },
  {
    id: "support",
    label: "Support",
    number: "05",
    icon: "💙",
    color: "from-pink-500 to-rose-400",
    description:
      "In moments of joy, difficulty, uncertainty, and growth — Noorva is your unwavering companion, offering the right support in the right way at the right moment.",
    details: [
      "Emotional support system",
      "Crisis-aware responses",
      "Celebration & motivation",
      "Long-term relationship",
    ],
  },
];

export function HowNoorvaWorksSection() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="how-noorva" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="ambient-glow ambient-glow-cyan w-[800px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      {/* Cinematic edge fades */}
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">
            Intelligence by Design
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            How{" "}
            <span className="text-gradient">Noorva</span>
            <br />
            Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Stage Selector */}
          <div className="space-y-3">
            {stages.map((stage, i) => (
              <motion.button
                key={stage.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setActiveStage(i)}
                className={`w-full text-left p-5 rounded-2xl border transition-colors duration-300 ${
                  activeStage === i
                    ? "glass-strong border-white/15"
                    : "glass border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 transition-opacity duration-300 ${
                      activeStage === i ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    {stage.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs text-white/30 font-mono">{stage.number}</span>
                      <span
                        className={`font-semibold transition-colors duration-300 ${
                          activeStage === i ? "text-white" : "text-white/50"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </div>
                  {activeStage === i && (
                    <motion.div
                      layoutId="activeArrow"
                      className={`w-2 h-2 rounded-full bg-gradient-to-br ${stage.color}`}
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Active Stage Detail */}
          <div className="lg:sticky lg:top-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl glass-strong border border-white/10 p-8 relative overflow-hidden"
              >
                {/* Gradient glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b opacity-20 ${stages[activeStage].color}`}
                />

                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-5xl">{stages[activeStage].icon}</span>
                    <div>
                      <span className="text-xs text-white/30 font-mono block">
                        {stages[activeStage].number}
                      </span>
                      <h3 className="text-2xl font-bold text-white">
                        {stages[activeStage].label}
                      </h3>
                    </div>
                  </div>

                  <p className="text-white/60 leading-relaxed mb-8 text-lg">
                    {stages[activeStage].description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stages[activeStage].details.map((detail, i) => (
                      <motion.div
                        key={detail}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-2 text-sm text-white/50"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${stages[activeStage].color} flex-shrink-0`} />
                        {detail}
                      </motion.div>
                    ))}
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-8 flex gap-2">
                    {stages.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                          i <= activeStage
                            ? `bg-gradient-to-r ${stages[activeStage].color}`
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
