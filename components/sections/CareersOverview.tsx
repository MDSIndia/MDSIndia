"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Code,
  Crown,
  GraduationCap,
  Handshake,
  Heart,
  Box,
  BrainCircuit,
  PartyPopper,
  PersonStanding,
  Scale,
  Server,
  Smartphone,
  ShieldCheck,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { CAREER_ROLES, type RoleIcon } from "@/lib/careers";
import { EASE, Eyebrow, NM, SG, glass } from "./CareersSection";

const ROLE_ICONS: Record<RoleIcon, LucideIcon> = {
  crown: Crown,
  wand: Wand2,
  cube: Box,
  figure: PersonStanding,
  code: Code,
  phone: Smartphone,
  server: Server,
  brain: BrainCircuit,
};

const values: { title: string; text: string; icon: LucideIcon; color: string }[] = [
  { title: "Teamwork", text: "We grow stronger by working together.", icon: Handshake, color: "#00D4FF" },
  { title: "Inclusivity", text: "Every voice, perspective, and idea matters.", icon: Users, color: "#7AA4FF" },
  { title: "Professionalism", text: "We hold ourselves to high standards.", icon: Scale, color: "#A855F7" },
  { title: "Integrity", text: "We believe in doing the right thing, always.", icon: ShieldCheck, color: "#0055FF" },
  {
    title: "Continuous Learning",
    text: "We encourage curiosity and personal growth.",
    icon: GraduationCap,
    color: "#EC4899",
  },
  {
    title: "Having Fun",
    text: "Meaningful work should also be an enjoyable experience.",
    icon: PartyPopper,
    color: "#00D4FF",
  },
];

const bodyText = {
  fontFamily: SG,
  fontSize: "clamp(0.95rem, 1.2vw, 1.08rem)",
  lineHeight: 1.8,
  color: "#FFFFFF",
} as const;

const gradientText = {
  background: "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 35%, #7AA4FF 70%, #00D4FF 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
} as const;

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-3 mb-6"
      style={{
        fontFamily: NM,
        fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)",
        lineHeight: 1.15,
        fontWeight: 700,
        color: "rgba(255,255,255,0.95)",
      }}
    >
      {children}
    </h2>
  );
}

export function CareersOverview() {
  return (
    <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,55,210,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-center mb-16"
        >
          <Eyebrow>Careers at MDS</Eyebrow>
          <h1
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)", lineHeight: 0.95, letterSpacing: "0.01em" }}
          >
            Build what <span className="text-gradient">matters</span>
          </h1>
          <p className="mt-8 mx-auto" style={{ ...bodyText, maxWidth: 780 }}>
            At <strong>MDS</strong>, we believe work should be more than just a 9–5 routine. It should be an
            opportunity to create meaningful impact, challenge yourself, push boundaries, and build a career
            you&apos;re proud of.
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5 justify-center">
            <a href="#openings" className="btn-primary text-sm">
              <ArrowRight className="size-4" strokeWidth={2.25} />
              View Open Positions
            </a>
          </div>
        </motion.div>

        {/* Where innovation meets opportunity */}
        <Reveal className="mb-14">
          <div className="rounded-2xl p-6 md:p-10" style={glass}>
            <Eyebrow color="rgba(168,85,247,0.75)">Our Culture</Eyebrow>
            <h2
              className="mt-3 mb-5"
              style={{
                fontFamily: NM,
                fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)",
                lineHeight: 1.15,
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              Where Innovation Meets Opportunity
            </h2>
            <div className="space-y-4" style={bodyText}>
              <p>
                Innovation is at the heart of everything we do. From the products we build to the way we
                collaborate, we&apos;re always looking for better ideas, new perspectives, and smarter ways to
                solve problems.
              </p>
              <p>
                Our culture is <strong>dynamic, collaborative, and constantly evolving</strong>. We encourage our
                people to take ownership, experiment, learn from challenges, and turn ideas into meaningful
                solutions.
              </p>
            </div>
          </div>
        </Reveal>

        {/* A culture built around people */}
        <div className="mb-16">
          <Reveal>
            <Eyebrow>Our Values</Eyebrow>
            <H2>A Culture Built Around People</H2>
            <p className="mb-8" style={bodyText}>
              At MDS, we believe great products are built by great teams. We value:
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE }}
                  className="rounded-2xl p-5 md:p-6"
                  style={glass}
                >
                  <Icon
                    className="size-6 mb-3"
                    strokeWidth={2}
                    style={{ color: v.color, filter: `drop-shadow(0 0 8px ${v.color}66)` }}
                  />
                  <h3 style={{ fontFamily: SG, fontWeight: 700, color: "#fff" }}>{v.title}</h3>
                  <p className="mt-1.5 text-sm" style={{ fontFamily: SG, lineHeight: 1.7, color: "#FFFFFF" }}>
                    {v.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Open positions */}
        <div id="openings" className="mb-16 scroll-mt-28">
          <Reveal>
            <Eyebrow>Open Positions</Eyebrow>
            <H2>Find your place on the team</H2>
            <p className="mb-8" style={bodyText}>
              Select a role to see what it involves and to apply.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {CAREER_ROLES.map((role, i) => {
              const Icon = ROLE_ICONS[role.icon];
              const featured = role.slug === "co-founder";
              return (
                <motion.div
                  key={role.slug}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (i % 2) * 0.08, ease: EASE }}
                  // The Co-Founder card is full width; if the rest don't pair up evenly,
                  // the last one goes full width too instead of sitting alone.
                  className={
                    featured || (i === CAREER_ROLES.length - 1 && (CAREER_ROLES.length - 1) % 2 === 1)
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  <div
                    className="hud-panel h-full transition-transform duration-300 hover:-translate-y-1.5"
                    style={
                      {
                        ["--card-c0" as string]: role.color,
                        ["--card-c1" as string]: role.color,
                      } as CSSProperties
                    }
                  >
                    <div className="hud-panel-inner">
                      <Link
                        href={`/careers/${role.slug}`}
                        className="group relative block h-full p-5 md:p-6"
                      >
                        {/* Index readout, same detail as the Noorva panels */}
                        <span
                          className="absolute top-4 right-5 text-[0.65rem] z-10"
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            color: `${role.color}99`,
                            letterSpacing: "0.05em",
                          }}
                        >
                          R.{String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="relative flex gap-4">
                          <Icon
                            className="size-7 shrink-0"
                            strokeWidth={2}
                            style={{ color: role.color, filter: `drop-shadow(0 0 8px ${role.color}66)` }}
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className="block text-[0.65rem] uppercase mb-1"
                              style={{ fontFamily: SG, letterSpacing: "0.3em", color: `${role.color}cc` }}
                            >
                              {role.team}
                            </span>
                            <h3
                              className="mb-1.5"
                              style={{
                                fontFamily: SG,
                                fontWeight: 700,
                                fontSize: "1.15rem",
                                letterSpacing: "0.01em",
                                color: "#ffffff",
                              }}
                            >
                              {role.title}
                            </h3>
                            <p
                              className="text-sm leading-relaxed"
                              style={{ fontFamily: SG, color: "rgba(255,255,255,0.78)" }}
                            >
                              {role.summary}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {role.tags.map((t) => (
                                <span
                                  key={t}
                                  className="px-3 py-1 rounded-full text-[11px] font-medium uppercase"
                                  style={{
                                    fontFamily: SG,
                                    letterSpacing: "0.1em",
                                    color: role.color,
                                    background: `${role.color}14`,
                                    border: `1px solid ${role.color}55`,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                              <span
                                className="inline-flex items-center gap-1 text-xs font-semibold uppercase"
                                style={{ fontFamily: SG, letterSpacing: "0.12em", color: role.color }}
                              >
                                View role
                                <ArrowUpRight
                                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                  strokeWidth={2.25}
                                />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Grow with us */}
        <Reveal className="mb-16">
          <Eyebrow color="rgba(168,85,247,0.75)">Your Growth</Eyebrow>
          <H2>Grow With Us</H2>
          <div className="space-y-4" style={bodyText}>
            <p>
              We&apos;re building an environment where people can{" "}
              <strong>learn, contribute, take on new challenges, and grow</strong>—both professionally and
              personally. Whether you&apos;re starting your career or bringing years of experience, there&apos;s
              always an opportunity to make an impact at MDS.
            </p>
            <p>
              We are committed to creating an inclusive workplace where diversity is respected, different
              perspectives are welcomed, and everyone has the opportunity to contribute.
            </p>
          </div>
        </Reveal>

        {/* Closing */}
        <Reveal className="text-center">
          <Heart
            className="size-7 mx-auto mb-5"
            strokeWidth={2}
            style={{ color: "#EC4899", filter: "drop-shadow(0 0 10px rgba(236,72,153,0.5))" }}
          />
          <Eyebrow>You&apos;re Part of What We&apos;re Building</Eyebrow>
          <p className="mt-5 mx-auto" style={{ ...bodyText, maxWidth: 640 }}>
            Because at MDS, you&apos;re not just filling a role.
          </p>
          <p
            className="mt-6 mx-auto"
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.3rem, 2.6vw, 2.1rem)",
              lineHeight: 1.45,
              fontWeight: 700,
              maxWidth: 980,
              ...gradientText,
            }}
          >
            You&apos;re joining a team.
            <br />
            You&apos;re shaping products.
            <br />
            You&apos;re creating impact.
            <br />
            And you&apos;re becoming an important part of what we&apos;re building.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
