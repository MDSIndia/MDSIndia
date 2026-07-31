"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Brain, Crosshair, Microscope, Zap } from "lucide-react";
import { usePortalTransition } from "@/components/PortalTransition/PortalTransitionProvider";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const isDecimal = target % 1 !== 0;
  const display = useTransform(count, (v) =>
    `${isDecimal ? v.toFixed(2) : Math.round(v).toString()}${suffix}`
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, target, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [inView, target, count]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {display}
    </motion.span>
  );
}

const metrics = [
  { label: "AI Companion Market by 2030", value: 317.96, suffix: "B", prefix: "$", accent: "from-cyan-500 to-blue-500", textGradient: "from-cyan-400 to-blue-400", glow: "rgba(0,212,255,0.15)" },
  { label: "Annual Growth Rate", value: 28.4, suffix: "%", prefix: "", accent: "from-blue-500 to-indigo-500", textGradient: "from-blue-400 to-indigo-400", glow: "rgba(0,85,255,0.15)" },
  { label: "Potential Users Worldwide", value: 4.2, suffix: "B+", prefix: "", accent: "from-violet-500 to-purple-500", textGradient: "from-violet-400 to-purple-400", glow: "rgba(139,92,246,0.15)" },
  { label: "Year One Target Users", value: 100, suffix: "K", prefix: "", accent: "from-emerald-500 to-teal-400", textGradient: "from-emerald-400 to-teal-400", glow: "rgba(16,185,129,0.15)" },
];

const roadmap = [
  { quarter: "Q3 2026", milestone: "Noorva MLP Launch", status: "upcoming" },
  { quarter: "Q4 2026", milestone: "Noorva MVP — 10M Users", status: "upcoming" },
  { quarter: "Q1 2027", milestone: "Seed Funding Close", status: "upcoming" },
  { quarter: "Q2 2027", milestone: "Noorva 1.0 Public Release", status: "upcoming" },
  { quarter: "2027", milestone: "Series A — Regional Expansion", status: "future" },
  { quarter: "2028+", milestone: "Global AI Leadership", status: "future" },
];

const whyPoints = [
  { title: "Emotional AI", desc: "We're not building another chatbot. We're building a companion that remembers, empathizes, and grows.", iconComponent: Brain },
  { title: "First-Mover Advantage", desc: "In the emotional AI companion space, MDS is positioning at the exact moment the market is forming.", iconComponent: Zap },
  { title: "Mission Alignment", desc: "We don't optimize for engagement metrics. We optimize for human flourishing.", iconComponent: Crosshair },
  { title: "Technical Depth", desc: "Our AI architecture is built for depth, not just scale — real understanding, not statistical outputs.", iconComponent: Microscope },
];

export function MarketOpportunityFullContent() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,55,210,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(0,212,255,0.8)" }}
          >
            Investment Opportunity
          </span>
          <h2
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.8rem, 7vw, 7rem)", lineHeight: 0.92, letterSpacing: "0.01em" }}
          >
            The{" "}
            <span className="text-gradient">Market</span>
            <br />
            Opportunity
          </h2>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden text-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(20px) saturate(150%)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                boxShadow: `0 0 30px ${metric.glow}, inset 0 1px 0 rgba(255,255,255,0.07)`,
              }}
            >
              <div className="p-5 md:p-6">
                <div
                  className={`text-2xl md:text-4xl font-black mb-2 bg-gradient-to-r ${metric.textGradient} bg-clip-text text-transparent`}
                >
                  {metric.prefix}
                  <AnimatedNumber target={metric.value} suffix={metric.suffix} />
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.55)" }}
                >
                  {metric.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Roadmap + Why MDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              boxShadow: "0 0 30px rgba(0,85,255,0.10), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <h3
              className="neue-machina mb-6"
              style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)", color: "#ffffff", lineHeight: 1.2 }}
            >Vision Roadmap</h3>
            <div className="space-y-4 relative">
              <div
                className="absolute left-4 top-2 bottom-2 w-px"
                style={{ background: "linear-gradient(to bottom, rgba(0,212,255,0.5), rgba(0,85,255,0.3), transparent)" }}
              />
              {roadmap.map((item, i) => (
                <motion.div
                  key={item.quarter}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 pl-10 relative"
                >
                  <div
                    className="absolute left-3 top-2 w-2 h-2 rounded-full"
                    style={{
                      background: "rgba(0,212,255,0.9)",
                      boxShadow: "0 0 6px rgba(0,212,255,0.6)",
                    }}
                  />
                  <div>
                    <span
                      className="text-xs font-mono font-medium"
                      style={{ color: "rgba(255,255,255,0.30)" }}
                    >
                      {item.quarter}
                    </span>
                    <p
                      className="font-medium mt-0.5 text-sm"
                      style={{
                        color: item.status === "future"
                          ? "rgba(255,255,255,0.30)"
                          : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {item.milestone}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3
              className="neue-machina mb-6"
              style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)", color: "#ffffff", lineHeight: 1.2 }}
            >Why MDS Wins</h3>
            <div className="space-y-3">
              {whyPoints.map((point, i) => {
                const Icon = point.iconComponent;

                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-4 rounded-xl transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      backdropFilter: "blur(16px) saturate(150%)",
                      WebkitBackdropFilter: "blur(16px) saturate(150%)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                      e.currentTarget.style.borderColor = "rgba(0,85,255,0.30)";
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(0,85,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                  <Icon className="mt-0.5 size-5 shrink-0 text-white" strokeWidth={2} />
                  <div>
                    <h4 className="font-semibold mb-1 text-sm" style={{ color: "rgba(0,212,255,0.85)" }}>
                      {point.title}
                    </h4>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.68)" }}
                    >
                      {point.desc}
                    </p>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <Link href="/#contact" className="btn-primary text-sm">
            <ArrowUpRight className="size-4" strokeWidth={2.25} />
            Discuss Investment
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Condensed "Market Opportunity" teaser — homepage ──────────────── */

const MARKET_STATEMENT =
  "Artificial intelligence is redefining how the world lives, works, and creates. With billions of future users and a multi-trillion-dollar market ahead, MDS is building the trusted AI ecosystem for the next generation.";

export function InvestorSection() {
  const { trigger } = usePortalTransition();

  return (
    <section id="invest" className="section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,55,210,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col md:flex-row md:items-center md:justify-center md:gap-16"
        >
          {/* Left: text */}
          <div className="order-2 md:order-1 text-center md:text-left md:flex-1">
            <span
              className="text-xs font-medium tracking-[0.5em] uppercase"
              style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(0,212,255,0.8)" }}
            >
              Investment Opportunity
            </span>

            <h2
              className="neue-machina mt-4 mb-5"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)", lineHeight: 0.98, letterSpacing: "0.01em" }}
            >
              The <span className="text-gradient">Market</span> Opportunity
            </h2>

            <p
              className="mb-8 mx-auto md:mx-0"
              style={{
                fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
                maxWidth: 480,
              }}
            >
              {MARKET_STATEMENT}
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href="/market-opportunity"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  trigger("/market-opportunity");
                }}
                className="btn-primary text-sm"
              >
                <ArrowRight className="size-4" strokeWidth={2.25} />
                Know More
              </Link>
            </div>
          </div>

          {/* Right: image — masked and screen-blended so its black
              backdrop dissolves into the page instead of sitting in a
              hard-edged photo frame, same treatment as the pillar
              images in WhyWeExistSection. */}
          <div className="order-1 md:order-2 md:flex-1 w-full pt-12 md:pt-0">
            <div className="relative w-full mx-auto" style={{ maxWidth: 520 }}>
              <div
                className="relative"
                style={{
                  aspectRatio: "4 / 3",
                  maskImage:
                    "radial-gradient(ellipse 60% 62% at 50% 48%, black 0%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 68%, transparent 82%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 60% 62% at 50% 48%, black 0%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 68%, transparent 82%)",
                }}
              >
                {/* Slow breathing zoom — keeps the globe feeling alive rather than static */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: [1, 1.045, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/market-globe.png"
                    alt="A glowing digital globe wrapped in orbiting data rings, representing MDS's global AI market opportunity"
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    style={{
                      objectFit: "contain",
                      mixBlendMode: "screen",
                      filter: "contrast(1.15) brightness(1.08) saturate(1.3)",
                    }}
                  />
                </motion.div>

                {/* Orbiting data particles — echoes the rings already in the artwork */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    width: 6,
                    height: 6,
                    marginTop: -3,
                    marginLeft: -3,
                    background: "rgba(0,212,255,1)",
                    boxShadow: "0 0 12px rgba(0,212,255,0.9), 0 0 24px rgba(0,212,255,0.45)",
                    transformOrigin: "3px 3px",
                    animation: "orbitParticle1 8s linear infinite",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    width: 4,
                    height: 4,
                    marginTop: -2,
                    marginLeft: -2,
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 0 8px rgba(255,255,255,0.8)",
                    transformOrigin: "2px 2px",
                    animation: "orbitParticle2 11s linear infinite reverse",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
