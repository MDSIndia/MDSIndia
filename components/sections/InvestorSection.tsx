"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";
import { Brain, Crosshair, Microscope, Zap } from "lucide-react";

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
  { quarter: "Q1 2026", milestone: "Noorva Alpha Launch", status: "upcoming" },
  { quarter: "Q2 2026", milestone: "Beta User Onboarding — 10,000 Users", status: "upcoming" },
  { quarter: "Q3 2026", milestone: "Seed Funding Close", status: "upcoming" },
  { quarter: "Q4 2026", milestone: "Noorva 1.0 Public Release", status: "upcoming" },
  { quarter: "2027", milestone: "Series A — Regional Expansion", status: "future" },
  { quarter: "2028+", milestone: "Global AI Leadership", status: "future" },
];

const whyPoints = [
  { title: "Emotional AI", desc: "We're not building another chatbot. We're building a companion that remembers, empathizes, and grows.", iconComponent: Brain },
  { title: "First-Mover Advantage", desc: "In the emotional AI companion space, MDS is positioning at the exact moment the market is forming.", iconComponent: Zap },
  { title: "Mission Alignment", desc: "We don't optimize for engagement metrics. We optimize for human flourishing.", iconComponent: Crosshair },
  { title: "Technical Depth", desc: "Our AI architecture is built for depth, not just scale — real understanding, not statistical outputs.", iconComponent: Microscope },
];

export function InvestorSection() {
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

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            Investment Opportunity
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            The{" "}
            <span className="text-gradient">Market</span>
            <br />
            Opportunity
          </h2>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 0 30px ${metric.glow}`,
              }}
            >
              <div className="p-5 md:p-6">
                <div
                  className={`text-2xl md:text-4xl font-black mb-2 bg-gradient-to-r ${metric.textGradient} bg-clip-text text-transparent`}
                >
                  {metric.prefix}
                  <AnimatedNumber target={metric.value} suffix={metric.suffix} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
                  {metric.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Roadmap + Why MDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 30px rgba(0,85,255,0.10)",
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Vision Roadmap</h3>
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
            <h3 className="text-xl font-bold text-white mb-6">Why MDS Wins</h3>
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
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.borderColor = "rgba(0,85,255,0.30)";
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(0,85,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                  <Icon className="mt-0.5 size-5 shrink-0 text-white" strokeWidth={2} />
                  <div>
                    <h4 className="font-semibold mb-1 text-sm" style={{ color: "rgba(0,212,255,0.85)" }}>
                      {point.title}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
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
          className="mt-14 text-center"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #0055FF, #00D4FF)",
              boxShadow: "0 0 40px rgba(0,85,255,0.40), 0 0 80px rgba(0,85,255,0.18)",
            }}
          >
            Discuss Investment
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
