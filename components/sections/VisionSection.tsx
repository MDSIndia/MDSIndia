"use client";

import { motion } from "framer-motion";

const cards = [
  {
    type: "Mission",
    icon: "⚡",
    headline: "To create AI that genuinely understands human life — in all its complexity, emotion, and beauty.",
    color: "from-blue-600/20 to-cyan-400/10",
    borderColor: "border-blue-600/20",
    glowColor: "rgba(0,102,255,0.1)",
  },
  {
    type: "Vision",
    icon: "🌐",
    headline: "A world where every person has an intelligent companion that helps them live more fully, intentionally, and meaningfully.",
    color: "from-cyan-400/20 to-purple-600/10",
    borderColor: "border-cyan-400/20",
    glowColor: "rgba(0,229,255,0.1)",
  },
  {
    type: "Purpose",
    icon: "✦",
    headline: "We don't build technology for technology's sake. We build it to advance what it means to be human.",
    color: "from-purple-600/20 to-blue-600/10",
    borderColor: "border-purple-600/20",
    glowColor: "rgba(123,47,190,0.1)",
  },
];

export function VisionSection() {
  return (
    <section id="vision" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="ambient-glow ambient-glow-cyan w-[800px] h-[600px] top-0 right-0 translate-x-1/4 -translate-y-1/4" />
        <div className="ambient-glow ambient-glow-blue w-[600px] h-[600px] bottom-0 left-0 -translate-x-1/4 translate-y-1/4" />
      </div>
      {/* Cinematic edge fades */}
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase"
          >
            Why We Exist
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-7xl font-black mt-4 leading-tight"
          >
            Technology That
            <br />
            <span className="text-gradient">Advances Humanity</span>
          </motion.h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.type}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                y: -8,
                transition: { duration: 0.3 },
              }}
              className={`relative rounded-3xl p-5 md:p-8 border ${card.borderColor} bg-gradient-to-br ${card.color} cursor-default overflow-hidden group`}
            >
              {/* Icon */}
              <span className="text-4xl mb-6 block">{card.icon}</span>

              {/* Type label */}
              <span className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3 block">
                {card.type}
              </span>

              {/* Headline */}
              <p className="text-xl font-medium text-white leading-relaxed">
                {card.headline}
              </p>

              {/* Hover glow border */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${card.glowColor} 0%, transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <blockquote className="text-2xl md:text-5xl font-light text-white/80 leading-relaxed max-w-4xl mx-auto">
            &ldquo;The greatest technology is the one that{" "}
            <span className="text-gradient font-semibold">
              makes you feel more human.
            </span>
            &rdquo;
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
