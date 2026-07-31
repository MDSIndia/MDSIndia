"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalSection() {
  return (
    <section
      id="finale"
      className="relative py-16 md:py-24 overflow-hidden flex items-center justify-center"
    >
      {/* Deep atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,55,210,0.20) 0%, rgba(100,30,180,0.10) 50%, transparent 75%)",
        }}
      />

      {/* Dark edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(2,2,8,0.90) 100%)",
        }}
      />

      {/* Particle dots */}
      {[
        { left: "10%", top: "20%", size: 2, color: "rgba(0,212,255,0.6)" },
        { left: "90%", top: "30%", size: 2, color: "rgba(0,85,255,0.6)" },
        { left: "15%", top: "75%", size: 1.5, color: "rgba(123,47,190,0.5)" },
        { left: "85%", top: "70%", size: 2, color: "rgba(0,212,255,0.5)" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 5}px ${p.color}`,
            animation: `particleFloat ${8 + i * 2}s ease-in-out infinite ${i}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Sub-line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-xs tracking-[0.5em] uppercase mb-8"
          style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.42)" }}
        >
          We Don&apos;t Just Build Software — We Build The Future
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="neue-machina leading-none text-gradient mb-10"
          style={{ fontSize: "clamp(5rem, 18vw, 14rem)", letterSpacing: "-0.04em" }}
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
          <div
            className="w-px h-12"
            style={{ background: "linear-gradient(to bottom, rgba(0,212,255,0.5), transparent)" }}
          />
          <a href="#noorva" className="btn-primary text-sm">
            <ArrowRight className="size-4" strokeWidth={2.25} />
            Begin The Journey
          </a>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.20)" }}
          >
            Mahadeva Digital Solutions
          </p>
        </motion.div>
      </div>
    </section>
  );
}
