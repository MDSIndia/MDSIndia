"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const team = [
  {
    name: "Sumanth Mahadeva",
    role: "Chief Executive Officer",
    short: "CEO",
    tagline: "Visionary. Builder. Dreamer.",
    description:
      "The architect of MDS's grand vision — a believer that AI should serve humanity's highest potential, not just its productivity. Sumanth leads MDS with purpose, pushing the boundaries of what intelligent technology can mean for human life.",
    photo: "/Sumanth-avatar.jpg",
    accent: "#00D4FF",
    glow: "0,212,255",
  },
  
  {
    name: "Rakesh Nerella",
    role: "Chief Technology Officer",
    short: "CTO",
    tagline: "Engineer. Architect. Innovator.",
    description:
      "The technical force behind Noorva's intelligence — designing AI systems that genuinely understand the complexity of human life. Rakesh builds the future one breakthrough at a time.",
    photo: "/Rakesh-avatar.jpg",
    accent: "#A855F7",
    glow: "168,85,247",
  },
];

export function TeamSection() {
  return (
    <section id="team" className="section-padding relative overflow-hidden">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center mb-10 md:mb-12"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase block mb-4"
            style={{ color: "rgba(0,212,255,0.78)", fontFamily: "var(--font-space-grotesk)" }}
          >
            The Builders
          </span>
          <h2
            style={{
              fontFamily: "'General Sans', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.8rem, 7vw, 7rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
            }}
          >
            Leadership{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7B2FBE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Team
            </span>
          </h2>
          <p
            className="mt-6 max-w-xl mx-auto"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.38)",
            }}
          >
            Driven by purpose. United by a belief that technology should serve humanity.
          </p>
        </motion.div>

        {/* Cards — full-bleed editorial portrait, not the generic
            avatar-in-a-ring "directory card" pattern. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.9, ease: EASE }}
              whileHover={{
                y: -10,
                borderColor: `rgba(${member.glow},0.5)`,
                boxShadow: `0 20px 80px rgba(${member.glow},0.25), inset 0 1px 0 rgba(255,255,255,0.1)`,
                transition: { duration: 0.4 },
              }}
              className="group relative flex flex-col rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255,255,255,0.12)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Portrait — bleeds to the card's top edges */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.07]">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    quality={100}
                    sizes="(max-width: 640px) 100vw, 420px"
                    style={{
                      objectFit: "cover",
                      objectPosition: "top center",
                      filter: "contrast(1.1) saturate(1.05) brightness(0.97)",
                    }}
                  />
                </div>

                {/* Accent color wash, tying the photo to the card's identity color */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(150deg, rgba(${member.glow},0.28) 0%, transparent 45%)`,
                    mixBlendMode: "overlay",
                  }}
                />
                {/* Fade into the content block below */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(6,7,16,0.98) 0%, rgba(6,7,16,0.5) 32%, transparent 62%)",
                  }}
                />

                {/* Founder badge — Sumanth only */}
                {i === 0 && (
                  <div
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,85,255,0.18) 100%)",
                      border: "1px solid rgba(0,212,255,0.35)",
                      backdropFilter: "blur(10px) saturate(160%)",
                      WebkitBackdropFilter: "blur(10px) saturate(160%)",
                      boxShadow: "0 0 12px rgba(0,212,255,0.20)",
                    }}
                  >
                    <span style={{ fontSize: "0.55rem", color: "#00D4FF", lineHeight: 1 }}>✦</span>
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(0,212,255,0.92)",
                      }}
                    >
                      Founder
                    </span>
                  </div>
                )}

                {/* Short badge — sits on the photo fade */}
                <span
                  className="absolute bottom-4 left-5 px-3 py-1 rounded-full text-[0.62rem] font-semibold tracking-[0.22em] uppercase"
                  style={{
                    background: `rgba(${member.glow},0.18)`,
                    border: `1px solid rgba(${member.glow},0.4)`,
                    backdropFilter: "blur(10px) saturate(160%)",
                    WebkitBackdropFilter: "blur(10px) saturate(160%)",
                    color: member.accent,
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                  }}
                >
                  {member.short}
                </span>
              </div>

              {/* Content */}
              <div className="relative flex flex-col text-left px-7 pt-6 pb-7">
                {/* Role */}
                <span
                  className="text-[0.6rem] font-medium tracking-[0.3em] uppercase block mb-2"
                  style={{ color: `rgba(${member.glow},0.75)`, fontFamily: "var(--font-space-grotesk)" }}
                >
                  {member.role}
                </span>

                {/* Name */}
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "'General Sans', 'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(1.4rem, 2vw, 1.75rem)",
                    lineHeight: 1.15,
                    color: "rgba(255,255,255,0.96)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {member.name}
                </h3>

                {/* Tagline */}
                <p
                  className="text-[0.68rem] tracking-[0.18em] uppercase mb-4"
                  style={{ color: member.accent, fontFamily: "var(--font-space-grotesk)", opacity: 0.85 }}
                >
                  {member.tagline}
                </p>

                {/* Divider */}
                <div
                  className="w-10 h-px mb-4 rounded-full"
                  style={{ background: `linear-gradient(to right, ${member.accent}, transparent)` }}
                />

                {/* Description */}
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.8,
                  }}
                >
                  {member.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
