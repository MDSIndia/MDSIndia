"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const team = [
  {
    name: "Sumanth Mahadeva",
    role: "Founder & Chief Executive Officer",
    short: "CEO",
    tagline: "Visionary. Builder. Dreamer.",
    description:
      "The architect of MDS's grand vision — a believer that AI should serve humanity's highest potential, not just its productivity. Sumanth leads MDS with purpose, pushing the boundaries of what intelligent technology can mean for human life.",
    photo: "/Sumanth-avatar.jpg",
    accent: "#00D4FF",
    glow: "0,212,255",
  },
];

export function TeamSection() {
  return (
    // scroll-mt-24 — the fixed navbar (see Navbar.tsx's `fixed top-0`)
    // sits above everything at a height taller than this section's own
    // top padding accounts for; without an explicit scroll offset,
    // clicking "Team" in the nav scrolls this section's top edge flush
    // with the viewport top, leaving the heading partially hidden
    // behind the navbar instead of clearing it.
    <section id="team" className="section-padding relative overflow-hidden scroll-mt-24">
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
              fontFamily: "var(--font-display)",
              fontWeight: 600,
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

        {/* Card — a quiet glass card at rest; the member's accent
            color only shows up as a border tint + soft glow on hover.
            Single centered "founder spotlight" card now that only
            Sumanth is listed — sized for its own presence rather than
            the narrower width the old 2-up grid used, but still capped
            so it doesn't stretch into an oddly wide single column on
            large screens. Full-bleed on the smallest phones (px-4 from
            the section's own side padding does the clamping there),
            up through a fixed comfortable width from sm and up. */}
        <div className="w-full sm:w-auto sm:max-w-sm mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.9, ease: EASE }}
              whileHover={{ y: -6, transition: { duration: 0.4 } }}
              className="id-card-frame group relative flex flex-col"
              style={{
                ["--id-c0" as string]: member.accent,
                ["--id-glow" as string]: `rgba(${member.glow},0.16)`,
                ["--id-glow-strong" as string]: `rgba(${member.glow},0.4)`,
              } as CSSProperties}
            >
              {/* Portrait — inset with its own rounded frame, not
                  full-bleed to the card's edges */}
              <div className="relative p-2.5 sm:p-3.5 pb-0">
                <div
                  className="id-card-photo-frame relative w-full overflow-hidden mx-auto"
                  style={{ aspectRatio: "1 / 1", maxWidth: "88%", border: `1px solid rgba(${member.glow},0.35)` }}
                >
                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.07]">
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      quality={100}
                      sizes="(max-width: 640px) 80vw, 400px"
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
                        "linear-gradient(to top, rgba(6,7,16,0.9) 0%, rgba(6,7,16,0.35) 32%, transparent 62%)",
                    }}
                  />

                  {/* Founder badge — Sumanth only */}
                  {i === 0 && (
                    <div
                      className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,85,255,0.18) 100%)",
                        border: "1px solid rgba(0,212,255,0.35)",
                        backdropFilter: "blur(10px) saturate(160%)",
                        WebkitBackdropFilter: "blur(10px) saturate(160%)",
                        boxShadow: "0 0 12px rgba(0,212,255,0.20)",
                      }}
                    >
                      <span style={{ fontSize: "0.5rem", color: "#00D4FF", lineHeight: 1 }}>✦</span>
                      <span
                        style={{
                          fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                          fontSize: "0.52rem",
                          fontWeight: 600,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "rgba(0,212,255,0.92)",
                        }}
                      >
                        Founder
                      </span>
                    </div>
                  )}
                </div>

                {/* Short badge — straddles the photo's bottom edge */}
                <span
                  className="absolute left-6 -bottom-2.5 px-2.5 py-0.5 rounded-full text-[0.56rem] font-semibold tracking-[0.2em] uppercase z-10"
                  style={{
                    background: "rgba(8,10,20,0.92)",
                    border: `1px solid rgba(${member.glow},0.55)`,
                    backdropFilter: "blur(10px) saturate(160%)",
                    WebkitBackdropFilter: "blur(10px) saturate(160%)",
                    color: member.accent,
                    fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                    boxShadow: `0 0 10px rgba(${member.glow},0.3)`,
                  }}
                >
                  {member.short}
                </span>
              </div>

              {/* Content */}
              <div className="relative flex flex-col text-left px-4 pt-7 pb-4 sm:px-5 sm:pt-8 sm:pb-5">
                {/* Role */}
                <span
                  className="text-[0.55rem] font-medium tracking-[0.24em] uppercase block mb-1.5"
                  style={{ color: `rgba(${member.glow},0.75)`, fontFamily: "var(--font-space-grotesk)" }}
                >
                  {member.role}
                </span>

                {/* Name */}
                <h3
                  className="mb-1.5"
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)",
                    lineHeight: 1.15,
                    color: "rgba(255,255,255,0.96)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {member.name}
                </h3>

                {/* Tagline */}
                <p
                  className="text-[0.6rem] tracking-[0.15em] uppercase mb-3"
                  style={{ color: member.accent, fontFamily: "var(--font-space-grotesk)", opacity: 0.85 }}
                >
                  {member.tagline}
                </p>

                {/* Divider */}
                <div
                  className="w-8 h-[2px] mb-3 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${member.accent}, transparent)`,
                    boxShadow: `0 0 8px ${member.accent}`,
                  }}
                />

                {/* Description */}
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.65,
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
