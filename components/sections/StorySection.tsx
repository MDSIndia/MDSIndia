"use client";

import { motion } from "framer-motion";
import { Globe2, Sparkles, Zap } from "lucide-react";

const pillars = [
  {
    iconComponent: Globe2,
    label: "The Challenge",
    headline: "Humanity is overwhelmed.",
    body: "1 in 4 people experience mental health challenges globally. Loneliness, anxiety, and information overload are at epidemic levels. Technology has made us more connected — yet more isolated than ever before.",
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(0,85,255,0.18)",
  },
  {
    iconComponent: Zap,
    label: "The Turning Point",
    headline: "AI has crossed the threshold.",
    body: "For the first time in history, artificial intelligence can truly understand human emotion, context, and personal nuance — not just process language. We are at the inflection point that changes everything.",
    accent: "from-violet-500 to-blue-500",
    glow: "rgba(123,47,190,0.18)",
  },
  {
    iconComponent: Sparkles,
    label: "Our Answer",
    headline: "MDS was built for this moment.",
    body: "We don't build software. We build understanding. MDS exists to create AI that genuinely knows you — your patterns, your goals, your emotions — and helps you live with greater clarity, purpose, and joy.",
    accent: "from-cyan-400 to-teal-400",
    glow: "rgba(0,212,255,0.15)",
  },
];

export function StorySection() {
  return (
    <section id="story" className="section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,55,210,0.08) 0%, transparent 70%)",
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ color: "rgba(255,255,255,0.50)" }}
          >
            Why We Exist
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4 leading-tight">
            Technology Should{" "}
            <span className="text-gradient">Elevate</span>
            <br />
            Humanity
          </h2>
          <p
            className="text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Not just automate it. Not just optimize it. Truly elevate it.
          </p>
        </motion.div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-16">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="relative rounded-2xl overflow-hidden cursor-default group"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 0 40px ${pillar.glow}`,
              }}
            >
              <div className="p-6 md:p-8">
                {/* Icon */}
                <pillar.iconComponent className="mb-5 size-8 text-white" strokeWidth={2} />

                {/* Label */}
                <span
                  className={`text-xs font-bold tracking-widest uppercase mb-3 block bg-gradient-to-r ${pillar.accent} bg-clip-text text-transparent`}
                >
                  {pillar.label}
                </span>

                {/* Headline */}
                <h3 className="text-xl font-bold text-white mb-4 leading-tight">
                  {pillar.headline}
                </h3>

                {/* Body */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.50)" }}
                >
                  {pillar.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cinematic quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.3 }}
          className="text-center"
        >
          <div
            className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent mx-auto mb-8"
          />
          <blockquote
            className="text-2xl md:text-4xl lg:text-5xl font-light leading-relaxed max-w-4xl mx-auto"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            &ldquo;The question is not whether AI will change humanity.{" "}
            <span className="text-gradient font-medium">
              It&apos;s whether humanity will shape AI first.
            </span>
            &rdquo;
          </blockquote>
          <p
            className="text-xs tracking-[0.4em] uppercase mt-8"
            style={{ color: "rgba(255,255,255,0.20)" }}
          >
            — Mahadeva Digital Solutions
          </p>
        </motion.div>
      </div>
    </section>
  );
}
