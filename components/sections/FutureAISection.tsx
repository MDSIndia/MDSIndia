"use client";

import { motion } from "framer-motion";

const domains = [
  {
    icon: "🏥",
    title: "Healthcare",
    description: "AI companions that support mental health, chronic condition management, and proactive wellness — making quality care accessible to all.",
    accent: "from-rose-500 to-pink-400",
    glow: "rgba(244,63,94,0.15)",
    labelGradient: "from-rose-400 to-pink-400",
  },
  {
    icon: "🎓",
    title: "Education",
    description: "Personalized learning companions that adapt to each student's pace, style, and potential — reimagining what it means to truly learn.",
    accent: "from-amber-500 to-yellow-400",
    glow: "rgba(245,158,11,0.15)",
    labelGradient: "from-amber-400 to-yellow-400",
  },
  {
    icon: "⚡",
    title: "Productivity",
    description: "AI that understands your work style, eliminates friction, and helps you do your best work — without burnout or overwhelm.",
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(0,85,255,0.15)",
    labelGradient: "from-blue-400 to-cyan-400",
  },
  {
    icon: "🌱",
    title: "Personal Growth",
    description: "A companion that knows your dreams, tracks your patterns, and helps you consistently become the person you want to be.",
    accent: "from-emerald-500 to-teal-400",
    glow: "rgba(16,185,129,0.15)",
    labelGradient: "from-emerald-400 to-teal-400",
  },
  {
    icon: "🧘",
    title: "Mental Wellness",
    description: "Compassionate support for anxiety, stress, and emotional challenges — available 24/7, without judgment, without stigma.",
    accent: "from-violet-500 to-purple-400",
    glow: "rgba(139,92,246,0.15)",
    labelGradient: "from-violet-400 to-purple-400",
  },
  {
    icon: "🤝",
    title: "Human-AI Collaboration",
    description: "The future isn't humans vs. AI — it's humans and AI creating together, solving harder problems, and achieving more than either could alone.",
    accent: "from-cyan-500 to-blue-500",
    glow: "rgba(0,212,255,0.15)",
    labelGradient: "from-cyan-400 to-blue-400",
  },
];

export function FutureAISection() {
  return (
    <section id="future-ai" className="section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,55,210,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            Domains of Impact
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            The <span className="text-gradient">World</span>
            <br />
            We&apos;re Building
          </h2>
          <p
            className="text-xl mt-6 max-w-2xl mx-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Every domain of human life, elevated by intelligent, empathetic AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {domains.map((domain, i) => (
            <motion.div
              key={domain.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="rounded-2xl overflow-hidden cursor-default"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 0 35px ${domain.glow}`,
              }}
            >
              {/* Gradient top accent */}
              <div className={`h-0.5 w-full bg-gradient-to-r ${domain.accent}`} />

              <div className="p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {domain.icon}
                </div>
                <span
                  className={`text-xs font-bold tracking-widest uppercase mb-2 block bg-gradient-to-r ${domain.labelGradient} bg-clip-text text-transparent`}
                >
                  {domain.title}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                  {domain.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
