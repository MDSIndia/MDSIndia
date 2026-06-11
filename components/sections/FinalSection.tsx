"use client";

import { motion } from "framer-motion";

export function FinalSection() {
  return (
    <section
      id="finale"
      className="relative py-32 md:py-40 overflow-hidden flex items-center justify-center"
    >
      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,102,255,0.12) 0%, transparent 70%)",
        }}
      />


      {/* Vignette edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.8) 100%)",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Sub-line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-white/30 text-sm tracking-[0.4em] uppercase mb-6"
        >
          We Don&apos;t Just Build Software — We Build The Future
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(5rem,18vw,14rem)] font-black leading-none tracking-[-0.04em] text-gradient mb-10"
        >
          THINK
          <br />
          BEYOND
        </motion.h1>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="w-px h-12 bg-gradient-to-b from-cyan-400/60 to-transparent" />
          <a
            href="#noorva"
            className="px-10 py-5 rounded-full text-white font-semibold text-lg transition-opacity duration-300 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0066FF, #00E5FF)",
              boxShadow: "0 0 60px rgba(0,102,255,0.3)",
            }}
          >
            Begin The Journey
          </a>
          <p className="text-white/20 text-xs tracking-widest uppercase">
            Mahadeva Digital Solutions
          </p>
        </motion.div>
      </div>
    </section>
  );
}
