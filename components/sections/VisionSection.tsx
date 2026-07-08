"use client";

import { motion } from "framer-motion";
import { Globe2, Sparkles, Zap } from "lucide-react";

const cards = [
  {
    icon: "⚡",
    iconComponent: Zap,
    label: "Mission",
    headline: "To create AI that genuinely understands human life — in all its complexity, emotion, and beauty.",
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(0,85,255,0.2)",
  },
  {
    icon: "🌐",
    iconComponent: Globe2,
    label: "Vision",
    headline: "A world where every person has an intelligent companion that helps them live more fully, intentionally, and meaningfully.",
    accent: "from-violet-500 to-blue-500",
    glow: "rgba(123,47,190,0.2)",
  },
  {
    icon: "✦",
    iconComponent: Sparkles,
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
        <div className="text-center mb-8">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(0,212,255,0.8)" }}
          >
            Our Philosophy
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.8rem, 7vw, 7rem)", lineHeight: 0.92, letterSpacing: "0.01em" }}
          >
            Built On
            <br />
            <span className="text-gradient">Conviction</span>
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {cards.map((card, i) => {
            const Icon = card.iconComponent;

            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="relative rounded-2xl overflow-hidden cursor-default"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(20px) saturate(150%)",
                  WebkitBackdropFilter: "blur(20px) saturate(150%)",
                  boxShadow: `0 0 40px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.07)`,
                }}
              >
                <div className="p-6 md:p-8">
                  {/* Icon */}
                  <Icon className="mb-5 size-8 text-white" strokeWidth={2} />

                {/* Label */}
                <span
                  className={`text-xs font-bold tracking-widest uppercase mb-4 block bg-gradient-to-r ${card.accent} bg-clip-text text-transparent`}
                >
                  {card.label}
                </span>

                {/* Headline */}
                <p
                  className="font-medium leading-relaxed"
                  style={{
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                    fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {card.headline}
                </p>
              </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-10 text-center"
        >
          <blockquote
            className="font-light leading-relaxed max-w-4xl mx-auto"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
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
