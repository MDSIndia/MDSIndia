"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const NM = "'Neue Machina', 'Inter', sans-serif";
const SG = "var(--font-space-grotesk), 'Inter', sans-serif";

const pillars = [
  {
    number: "01",
    title: "Technology Without Soul",
    body: "The world's most advanced technology still fails to understand a single human soul. It processes. It responds. But it does not truly know you.",
    color: "rgba(0,212,255,0.80)",
  },
  {
    number: "02",
    title: "A World Left Alone",
    body: "Billions of people navigate life's most important moments — career crossroads, personal struggles, late nights of doubt — without anyone truly there to help them think, grow, and thrive.",
    color: "rgba(80,130,255,0.80)",
  },
  {
    number: "03",
    title: "The Gap We Fill",
    body: "We exist to bridge the distance between human potential and human reality. Through AI that doesn't just respond — but remembers, understands, and grows alongside you.",
    color: "rgba(160,80,255,0.80)",
  },
];

export function WhyWeExistSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,55,210,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-6"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ color: "rgba(0,212,255,0.72)", fontFamily: SG }}
          >
            Our Purpose
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.08, ease: EASE }}
          className="text-center mb-8"
          style={{
            fontFamily: NM,
            fontSize: "clamp(2.6rem, 7vw, 7.5rem)",
            lineHeight: 0.92,
            letterSpacing: "0.02em",
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 28%, #7AA4FF 58%, #00D4FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Why We Exist
        </motion.h2>

        {/* Opening statement */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.18, ease: EASE }}
          className="text-center max-w-3xl mx-auto mb-20 md:mb-28"
          style={{
            fontFamily: SG,
            fontSize: "clamp(1rem, 2vw, 1.35rem)",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          We don&apos;t build technology for technology&apos;s sake. We build it to do
          the most human thing possible —{" "}
          <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
            be there for someone.
          </span>
        </motion.p>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.number}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: i * 0.12, ease: EASE }}
              className="pt-10 md:pr-10"
            >
              {/* Number */}
              <span
                className="block mb-5"
                style={{
                  fontFamily: NM,
                  fontSize: "0.62rem",
                  letterSpacing: "0.44em",
                  color: pillar.color,
                }}
              >
                {pillar.number}
              </span>

              {/* Title */}
              <h3
                className="mb-4"
                style={{
                  fontFamily: NM,
                  fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                  lineHeight: 1.15,
                  letterSpacing: "0.01em",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {pillar.title}
              </h3>

              {/* Accent line */}
              <div
                className="mb-5 h-px"
                style={{
                  width: "48px",
                  background: `linear-gradient(to right, ${pillar.color}, transparent)`,
                }}
              />

              {/* Body */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(0.875rem, 1.1vw, 1rem)",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.90)",
                }}
              >
                {pillar.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing manifesto */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.3, ease: EASE }}
          className="mt-20 md:mt-28 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "3rem" }}
        >
          <p
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.4rem, 3.5vw, 3rem)",
              lineHeight: 1.25,
              letterSpacing: "0.01em",
              color: "rgba(255,255,255,0.88)",
              maxWidth: "820px",
              margin: "0 auto",
            }}
          >
            &ldquo;The greatest technology is the one that{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #00D4FF 0%, #7AA4FF 50%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              makes you feel more human.
            </span>
            &rdquo;
          </p>
          <p
            className="mt-5"
            style={{
              fontFamily: SG,
              fontSize: "0.75rem",
              letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.22)",
              textTransform: "uppercase",
            }}
          >
            — Mahadeva Digital Solutions
          </p>
        </motion.div>

      </div>
    </section>
  );
}
