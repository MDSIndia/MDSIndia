"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Slide } from "@/components/layout/Slide";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Same card language as the Leadership Team (see TeamSection): a quiet glass
   card at rest, the member's accent only showing as a border tint + soft glow
   on hover. Add further advisors to this array and the grid lays them out. */
const advisors = [
  {
    name: "Dr. Nandita Sethi",
    role: "Founder & MD, The Entrepreneur Zone (TEZ)",
    short: "Advisor",
    tagline: "Mentor. Educator. Ecosystem Builder.",
    description:
      "Founder of TEZ, an entrepreneurship development centre and startup accelerator. A doctorate in International Economics and 30 years of experience training senior managers and, since 2015, mentoring startups and SMEs. Mentor to TiE, T-Hub, WeHub, ISB-TEP and CII-IWN; TEDx speaker and author. Her mission: bring entrepreneurship into mainstream education.",
    highlights: [
      "TiE Best Mentor Award, 2016–17",
      "Indywood Business Excellence Award, 2019",
      "COWE Excellence Award, 2021",
      "T-Hub Top 50 Women Achievers, 2022",
      "Past Chairperson, CII Indian Women Network, Telangana (2019–20)",
    ],
    photo: "/Nandita-full3.jpg",
    // the whole, uncropped portrait (1168×1347, with a little backdrop added above the head)
    photoAspect: "1168 / 1497",
    accent: "#4F8CFF",
    glow: "79,140,255",
  },
];

export function AdvisorySection() {
  return (
    <section id="advisory" className="hgroup section-padding relative overflow-hidden scroll-mt-24">
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <Slide label="Advisory Board">
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
            className="text-base font-medium tracking-[0.5em] uppercase block mb-4"
            style={{ color: "rgba(0,212,255,0.78)", fontFamily: "var(--font-space-grotesk)" }}
          >
            Guiding Voices
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
            Advisory{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #7B2FBE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Board
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
            Seasoned mentors who lend MDS their experience, perspective and trust.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {advisors.map((member, i) => (
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
              {/* Portrait */}
              <div className="relative p-2.5 sm:p-3.5 pb-0">
                <div
                  className="id-card-photo-frame relative w-full overflow-hidden mx-auto"
                  style={{ aspectRatio: member.photoAspect, maxWidth: "88%", border: `1px solid rgba(${member.glow},0.35)` }}
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
                        objectPosition: "center",
                        filter: "contrast(1.05) saturate(1.02) brightness(0.97)",
                      }}
                    />
                  </div>

                  {/* Accent colour wash */}
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
                </div>

                {/* Badge — straddles the photo's bottom edge */}
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
                <span
                  className="text-[0.55rem] font-medium tracking-[0.24em] uppercase block mb-1.5"
                  style={{ color: `rgba(${member.glow},0.75)`, fontFamily: "var(--font-space-grotesk)" }}
                >
                  {member.role}
                </span>

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

                <p
                  className="text-[0.6rem] tracking-[0.15em] uppercase mb-3"
                  style={{ color: member.accent, fontFamily: "var(--font-space-grotesk)", opacity: 0.85 }}
                >
                  {member.tagline}
                </p>

                <div
                  className="w-8 h-[2px] mb-3 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${member.accent}, transparent)`,
                    boxShadow: `0 0 8px ${member.accent}`,
                  }}
                />

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

                {/* Recognition */}
                <span
                  className="text-[0.55rem] font-medium tracking-[0.24em] uppercase block mt-4 mb-2"
                  style={{ color: `rgba(${member.glow},0.75)`, fontFamily: "var(--font-space-grotesk)" }}
                >
                  Recognition
                </span>
                <ul className="flex flex-col gap-1.5">
                  {member.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2"
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: "0.72rem",
                        lineHeight: 1.5,
                        color: "rgba(255,255,255,0.66)",
                      }}
                    >
                      <span
                        className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full"
                        style={{ background: member.accent, boxShadow: `0 0 6px ${member.accent}` }}
                      />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      </Slide>
    </section>
  );
}
