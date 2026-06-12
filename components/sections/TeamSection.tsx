"use client";

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
    initials: "SM",
    accent: "#00D4FF",
    glow: "0,212,255",
    linkedin: "#",
  },
  {
    name: "Seshagiri Rao",
    role: "Director",
    short: "DIR",
    tagline: "Strategist. Leader. Enabler.",
    description:
      "Turning vision into reality — building the systems, teams, and culture that will take MDS from a bold idea to a global AI company. Seshagiri bridges strategy and execution with clarity and conviction.",
    initials: "SR",
    accent: "#818CF8",
    glow: "129,140,248",
    linkedin: "#",
  },
  {
    name: "Rakesh Nerella",
    role: "Chief Technology Officer",
    short: "CTO",
    tagline: "Engineer. Architect. Innovator.",
    description:
      "The technical force behind Noorva's intelligence — designing AI systems that genuinely understand the complexity of human life. Rakesh builds the future one breakthrough at a time.",
    initials: "RN",
    accent: "#A855F7",
    glow: "168,85,247",
    linkedin: "#",
  },
];

export function TeamSection() {
  return (
    <section id="team" className="section-padding relative overflow-hidden">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(129,140,248,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center mb-16 md:mb-20"
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
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.38)",
            }}
          >
            Driven by purpose. United by a belief that technology should serve humanity.
          </p>
        </motion.div>

        {/* ── CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.8, ease: EASE }}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl overflow-hidden group cursor-default"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `rgba(${member.glow},0.28)`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 60px rgba(${member.glow},0.12), 0 20px 40px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(to right, transparent 5%, ${member.accent} 50%, transparent 95%)`,
                  opacity: 0.7,
                }}
              />

              {/* Subtle inner glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${member.glow},0.08) 0%, transparent 70%)`,
                }}
              />

              <div className="relative p-8">

                {/* Avatar row */}
                <div className="flex items-start justify-between mb-8">
                  {/* Initials avatar */}
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, rgba(${member.glow},0.25) 0%, rgba(${member.glow},0.08) 100%)`,
                      border: `1px solid rgba(${member.glow},0.30)`,
                      boxShadow: `0 0 20px rgba(${member.glow},0.15)`,
                      fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {member.initials}
                  </div>

                  {/* Short role badge */}
                  <span
                    className="px-3 py-1 rounded-full text-[0.62rem] font-semibold tracking-[0.18em] uppercase"
                    style={{
                      background: `rgba(${member.glow},0.10)`,
                      border: `1px solid rgba(${member.glow},0.22)`,
                      color: member.accent,
                      fontFamily: "monospace",
                    }}
                  >
                    {member.short}
                  </span>
                </div>

                {/* Name + role */}
                <div className="mb-1">
                  <span
                    className="text-[0.65rem] font-medium tracking-[0.22em] uppercase block mb-2"
                    style={{
                      color: member.accent,
                      fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                      opacity: 0.85,
                    }}
                  >
                    {member.role}
                  </span>
                  <h3
                    className="neue-machina mb-3"
                    style={{
                      fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)",
                      lineHeight: 1.1,
                      letterSpacing: "0.01em",
                      color: "rgba(255,255,255,0.96)",
                    }}
                  >
                    {member.name}
                  </h3>
                </div>

                {/* Tagline */}
                <p
                  className="text-xs tracking-[0.14em] uppercase mb-5"
                  style={{
                    color: `rgba(${member.glow},0.70)`,
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                  }}
                >
                  {member.tagline}
                </p>

                {/* Accent line */}
                <div
                  className="h-px w-10 mb-5 rounded-full"
                  style={{ background: `linear-gradient(to right, ${member.accent}, transparent)` }}
                />

                {/* Description */}
                <p
                  className="mb-7 leading-relaxed"
                  style={{
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.52)",
                    lineHeight: 1.75,
                  }}
                >
                  {member.description}
                </p>

                {/* LinkedIn */}
                <a
                  href={member.linkedin}
                  className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-opacity duration-200 hover:opacity-70"
                  style={{
                    color: member.accent,
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[0.6rem]"
                    style={{ background: "#0A66C2" }}
                  >
                    in
                  </span>
                  Connect
                </a>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
