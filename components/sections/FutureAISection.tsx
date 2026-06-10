"use client";

import { motion } from "framer-motion";

const domains = [
  {
    icon: "🏥",
    title: "Healthcare",
    description:
      "AI companions that support mental health, chronic condition management, and proactive wellness — making quality care accessible to all.",
    color: "from-red-500/20 to-pink-600/10",
    border: "border-red-500/20",
  },
  {
    icon: "🎓",
    title: "Education",
    description:
      "Personalized learning companions that adapt to each student's pace, style, and potential — reimagining what it means to truly learn.",
    color: "from-yellow-500/20 to-orange-600/10",
    border: "border-yellow-500/20",
  },
  {
    icon: "⚡",
    title: "Productivity",
    description:
      "AI that understands your work style, eliminates friction, and helps you do your best work — without burnout or overwhelm.",
    color: "from-blue-500/20 to-cyan-600/10",
    border: "border-blue-500/20",
  },
  {
    icon: "🌱",
    title: "Personal Growth",
    description:
      "A companion that knows your dreams, tracks your patterns, and helps you consistently become the person you want to be.",
    color: "from-green-500/20 to-emerald-600/10",
    border: "border-green-500/20",
  },
  {
    icon: "🧘",
    title: "Mental Wellness",
    description:
      "Compassionate support for anxiety, stress, and emotional challenges — available 24/7, without judgment, without stigma.",
    color: "from-purple-500/20 to-violet-600/10",
    border: "border-purple-500/20",
  },
  {
    icon: "🤝",
    title: "Human-AI Collaboration",
    description:
      "The future isn't humans vs. AI — it's humans and AI creating together, solving harder problems, and achieving more than either could alone.",
    color: "from-cyan-500/20 to-blue-600/10",
    border: "border-cyan-500/20",
  },
];

export function FutureAISection() {
  return (
    <section id="future-ai" className="section-padding relative overflow-hidden">
      <div className="ambient-glow ambient-glow-blue w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">
            Domains of Impact
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            The <span className="text-gradient">Future</span>
            <br />
            of AI
          </h2>
          <p className="text-white/40 text-xl mt-6 max-w-2xl mx-auto">
            Every domain of human life, elevated by intelligent, empathetic AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain, i) => (
            <motion.div
              key={domain.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`relative rounded-3xl p-5 md:p-7 border ${domain.border} bg-gradient-to-br ${domain.color} cursor-default overflow-hidden group`}
            >
              {/* Hover gradient reveal */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)" }}
              />
              <div className="relative">
                {/* Icon — static, no float animation */}
                <span className="text-4xl block mb-4">{domain.icon}</span>
                <h3 className="text-xl font-bold text-white mb-3">{domain.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{domain.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
