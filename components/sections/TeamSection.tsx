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
    photo: "/Sumanth.jpeg",
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
    photo: "/Rakesh.jpeg",
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
            className="neue-machina"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 7rem)",
              lineHeight: 0.92,
              letterSpacing: "0.01em",
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

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.9, ease: EASE }}
              whileHover={{ y: -10 }}
              className="relative group flex flex-col items-center text-center rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(20px) saturate(150%)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                padding: "2.5rem 2rem 2.2rem",
                boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
                transition: "border-color 0.4s, box-shadow 0.4s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `rgba(${member.glow},0.40)`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 70px rgba(${member.glow},0.20), inset 0 1px 0 rgba(255,255,255,0.10)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)";
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(to right, transparent 10%, ${member.accent} 50%, transparent 90%)`,
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

              {/* Ambient glow behind photo */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, rgba(${member.glow},0.6) 0%, transparent 70%)`,
                  filter: "blur(32px)",
                  top: "-20px",
                }}
              />

              {/* Photo ring */}
              <div className="relative mb-6 flex-shrink-0">
                {/* Outer animated ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    padding: "3px",
                    background: `conic-gradient(from 0deg, ${member.accent}, rgba(${member.glow},0.15), ${member.accent})`,
                    borderRadius: "50%",
                    transform: "scale(1.08)",
                    opacity: 0.7,
                  }}
                />
                {/* Inner ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: `0 0 0 2px rgba(${member.glow},0.45), 0 0 28px rgba(${member.glow},0.35), 0 0 60px rgba(${member.glow},0.15)`,
                    borderRadius: "50%",
                  }}
                />
                {/* Photo */}
                <div
                  className="relative rounded-full overflow-hidden"
                  style={{ width: "160px", height: "160px" }}
                >
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    style={{
                      objectFit: "cover",
                      objectPosition: "center 15%",
                      filter: "contrast(1.15) saturate(1.1) brightness(0.95)",
                    }}
                  />
                </div>
              </div>

              {/* Badge */}
              <span
                className="px-3 py-1 rounded-full text-[0.6rem] font-semibold tracking-[0.22em] uppercase mb-4"
                style={{
                  background: `rgba(${member.glow},0.15)`,
                  border: `1px solid rgba(${member.glow},0.30)`,
                  backdropFilter: "blur(10px) saturate(160%)",
                  WebkitBackdropFilter: "blur(10px) saturate(160%)",
                  color: member.accent,
                  fontFamily: "monospace",
                }}
              >
                {member.short}
              </span>

              {/* Role */}
              <span
                className="text-[0.6rem] font-medium tracking-[0.3em] uppercase block mb-2"
                style={{ color: `rgba(${member.glow},0.70)`, fontFamily: "var(--font-space-grotesk)" }}
              >
                {member.role}
              </span>

              {/* Name */}
              <h3
                className="neue-machina mb-3"
                style={{
                  fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
                  lineHeight: 1.1,
                  color: "rgba(255,255,255,0.96)",
                  letterSpacing: "0.01em",
                }}
              >
                {member.name}
              </h3>

              {/* Tagline */}
              <p
                className="text-[0.68rem] tracking-[0.18em] uppercase mb-5"
                style={{ color: member.accent, fontFamily: "var(--font-space-grotesk)", opacity: 0.8 }}
              >
                {member.tagline}
              </p>

              {/* Divider */}
              <div
                className="w-12 h-px mb-5 rounded-full"
                style={{ background: `linear-gradient(to right, transparent, ${member.accent}, transparent)` }}
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
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
