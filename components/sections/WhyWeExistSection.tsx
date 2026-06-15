"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const pillars = [
  {
    number: "01",
    title1: "Product",
    title2: "Without Soul",
    body: "The world's most advanced product still fails to understand a single human soul. It processes. It responds. But it does not truly know you.",
    image: "/technlogy.png",
    accentGradient: "linear-gradient(135deg, #C084FC 0%, #9333EA 100%)",
    accentDot: "#A855F7",
    glow: "168,85,247",
  },
  {
    number: "02",
    title1: "A World",
    title2: "Left Alone",
    body: "Billions of people navigate life's most important moments — career crossroads, personal struggles, late nights of doubt — without anyone truly there to help them think, grow, and thrive.",
    image: "/worldleftalone.png",
    accentGradient: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)",
    accentDot: "#818CF8",
    glow: "129,140,248",
  },
  {
    number: "03",
    title1: "The Gap",
    title2: "We Fill",
    body: "We exist to bridge the distance between human potential and human reality. Through AI that doesn't just respond — but remembers, understands, and grows alongside you.",
    image: "/gapwefill.png",
    accentGradient: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
    accentDot: "#00D4FF",
    glow: "0,212,255",
  },
];

export function WhyWeExistSection() {
  return (
    <section id="about-mds" className="section-padding relative overflow-hidden">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center mb-8 md:mb-12"
        >
         
          <h2
            className="neue-machina"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 6rem)",
              lineHeight: 0.92,
              letterSpacing: "0.02em",
              background: "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 28%, #7AA4FF 58%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            About MDS
          </h2>
        </motion.div>

        {/* About body text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className="mb-10 md:mb-14 space-y-4"
          style={{ textAlign: "justify" }}
        >
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1rem, 1.25vw, 1.15rem)",
              lineHeight: 1.85,
              color: "#FFFFFF",
            }}
          >
            MDS is not just a technology company—we are{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>architects of the future.</span>{" "}
            Driven by an uncompromising pursuit of innovation, we exist to create transformative,
            world-class products that solve real problems, unlock human potential, and leave a
            meaningful, lasting impact on society.
          </p>

          <p
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1rem, 1.25vw, 1.15rem)",
              lineHeight: 1.85,
              color: "#FFFFFF",
            }}
          >
            At the heart of our vision is{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF, #7AA4FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 600,
              }}
            >
              Noorva Companion
            </span>
            , our flagship product—an intelligent AI companion designed to redefine how humans
            interact with AI technology. Noorva is not merely an assistant; it is a trusted partner
            for growth, productivity, learning, creativity, and decision-making.
          </p>

          <p
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1rem, 1.25vw, 1.15rem)",
              lineHeight: 1.85,
              color: "#FFFFFF",
            }}
          >
            Built with deep intelligence and human-centric design, Noorva Companion understands
            people at a profound level, adapts intuitively to their evolving needs, and grows
            alongside them. Its purpose is to elevate human capability—helping individuals move from
            intention to action, and closing the gap between what they aspire to achieve and what
            they actually accomplish.
          </p>

          <p
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1rem, 1.25vw, 1.15rem)",
              lineHeight: 1.85,
              color: "#FFFFFF",
              fontStyle: "italic",
            }}
          >
            At MDS, we are not building for the present alone. We are creating the foundations of a
            smarter, more empowered tomorrow—where technology amplifies human capability and
            redefines what is possible.
          </p>
        </motion.div>

        {/* Pillars */}
        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.number}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-center py-5 md:py-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Left — text */}
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              {/* Number badge */}
              <span
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-mono font-semibold tracking-[0.18em] mb-3 block w-fit"
                style={{
                  background: `rgba(${pillar.glow},0.10)`,
                  border: `1px solid rgba(${pillar.glow},0.28)`,
                  color: pillar.accentDot,
                }}
              >
                {pillar.number}
              </span>

              {/* Heading */}
              <h3
                className="neue-machina mb-0"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.8rem)",
                  lineHeight: 1.05,
                  letterSpacing: "0.01em",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.96)" }}>{pillar.title1}</span>
                <br />
                <span
                  style={{
                    background: pillar.accentGradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {pillar.title2}
                </span>
              </h3>

              {/* Accent dot */}
              <div
                className="w-2 h-2 rounded-full mt-4 mb-5"
                style={{ background: pillar.accentDot, boxShadow: `0 0 8px ${pillar.accentDot}` }}
              />

              {/* Body */}
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                  fontSize: "clamp(0.88rem, 1.1vw, 1rem)",
                  lineHeight: 1.8,
                  color: "#FFFFFF",
                }}
              >
                {pillar.body}
              </p>
            </div>

            {/* Right — image faded into background */}
            <div className={`relative ${i % 2 === 1 ? "md:order-1" : ""}`}>
              <div
                className="relative w-full"
                style={{
                  aspectRatio: "4/3",
                  maskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, black 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.55) 44%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.03) 76%, transparent 88%)",
                  WebkitMaskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, black 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.55) 44%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.03) 76%, transparent 88%)",
                }}
              >
                <Image
                  src={pillar.image}
                  alt=""
                  fill
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    mixBlendMode: "screen",
                    filter: "contrast(1.2) brightness(1.0) saturate(1.5)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Closing manifesto */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.2, ease: EASE }}
          className="mt-4 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.75rem" }}
        >
          <p
            className="neue-machina"
            style={{
              fontSize: "clamp(1.3rem, 3vw, 2.6rem)",
              lineHeight: 1.28,
              letterSpacing: "0.01em",
              color: "#FFFFFF",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            &ldquo;The greatest Product is the one that{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7AA4FF 50%, #a855f7 100%)",
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
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "0.72rem",
              letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.35)",
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
