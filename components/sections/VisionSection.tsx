"use client";

import { motion } from "framer-motion";

const cards = [
  {
    number: "I",
    icon: "⚡",
    label: "Mission",
    headline: "To create AI that genuinely understands human life — in all its complexity, emotion, and beauty.",
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(0,85,255,0.2)",
  },
  {
    number: "II",
    icon: "🌐",
    label: "Vision",
    headline: "A world where every person has an intelligent companion that helps them live more fully, intentionally, and meaningfully.",
    accent: "from-violet-500 to-blue-500",
    glow: "rgba(123,47,190,0.2)",
  },
  {
    number: "III",
    icon: "✦",
    label: "Purpose",
    headline: "We don't build technology for technology's sake. We build it to advance what it means to be human.",
    accent: "from-cyan-400 to-teal-400",
    glow: "rgba(0,212,255,0.18)",
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

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            Our Philosophy
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-7xl font-black mt-4 leading-tight"
          >
            Built On
            <br />
            <span className="text-gradient">Conviction</span>
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="relative rounded-2xl overflow-hidden cursor-default"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 0 40px ${card.glow}`,
              }}
            >
              {/* Top gradient bar */}
              <div className={`h-0.5 w-full bg-gradient-to-r ${card.accent}`} />

              <div className="p-6 md:p-8">
                {/* Number */}
                <span
                  className="text-xs font-mono block mb-5"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                >
                  {card.number}
                </span>

                {/* Icon */}
                <div className="text-3xl mb-5">{card.icon}</div>

                {/* Label */}
                <span
                  className={`text-xs font-bold tracking-widest uppercase mb-4 block bg-gradient-to-r ${card.accent} bg-clip-text text-transparent`}
                >
                  {card.label}
                </span>

                {/* Headline */}
                <p
                  className="text-base md:text-lg font-medium leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.80)" }}
                >
                  {card.headline}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <blockquote
            className="text-2xl md:text-4xl lg:text-5xl font-light leading-relaxed max-w-4xl mx-auto"
            style={{ color: "rgba(255,255,255,0.60)" }}
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
