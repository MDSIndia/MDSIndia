"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";

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
  { label: "AI Companion Market by 2030", value: 317.96, suffix: "B", prefix: "$", color: "text-cyan-400" },
  { label: "Annual Growth Rate", value: 28.4, suffix: "%", prefix: "", color: "text-blue-400" },
  { label: "Potential Users Worldwide", value: 4.2, suffix: "B+", prefix: "", color: "text-purple-400" },
  { label: "Year One Target Users", value: 100, suffix: "K", prefix: "", color: "text-green-400" },
];

const roadmap = [
  { quarter: "Q1 2026", milestone: "Noorva Alpha Launch", status: "upcoming" },
  { quarter: "Q2 2026", milestone: "Beta User Onboarding — 10,000 Users", status: "upcoming" },
  { quarter: "Q3 2026", milestone: "Seed Funding Close", status: "upcoming" },
  { quarter: "Q4 2026", milestone: "Noorva 1.0 Public Release", status: "upcoming" },
  { quarter: "2027", milestone: "Series A — Regional Expansion", status: "future" },
  { quarter: "2028+", milestone: "Global AI Leadership", status: "future" },
];

export function InvestorSection() {
  return (
    <section id="invest" className="section-padding relative overflow-hidden">
      <div className="ambient-glow ambient-glow-blue w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      {/* Cinematic section blends */}
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6 mb-12">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl glass border border-white/8 p-4 md:p-6 text-center relative overflow-hidden group hover:border-white/15 transition-all duration-300"
            >
              <div className={`text-3xl md:text-5xl font-black ${metric.color} mb-2`}>
                {metric.prefix}
                <AnimatedNumber target={metric.value} suffix={metric.suffix} />
              </div>
              <p className="text-white/40 text-xs leading-relaxed">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-8">Vision Roadmap</h3>
            <div className="space-y-4 relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-cyan-400/50 via-blue-600/30 to-transparent" />
              {roadmap.map((item, i) => (
                <motion.div
                  key={item.quarter}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-6 pl-10 relative"
                >
                  <div className="absolute left-3 top-2 w-2 h-2 rounded-full bg-cyan-400 border border-[#050505]" />
                  <div>
                    <span className="text-xs text-white/30 font-mono">{item.quarter}</span>
                    <p className={`font-medium mt-0.5 ${item.status === "future" ? "text-white/40" : "text-white"}`}>
                      {item.milestone}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Why MDS */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-8">Why MDS Wins</h3>
            <div className="space-y-4">
              {[
                { title: "Emotional AI", desc: "We're not building another chatbot. We're building a companion that remembers, empathizes, and grows." },
                { title: "First-Mover Advantage", desc: "In the emotional AI companion space, MDS is positioning at the exact moment the market is forming." },
                { title: "Mission Alignment", desc: "We don't optimize for engagement metrics. We optimize for human flourishing." },
                { title: "Technical Depth", desc: "Our AI architecture is built for depth, not just scale — real understanding, not statistical outputs." },
              ].map((point, i) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-2xl glass border border-white/5 hover:border-cyan-400/20 transition-all duration-300"
                >
                  <h4 className="text-cyan-400 font-semibold mb-2 text-sm">{point.title}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">{point.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-white font-semibold text-lg"
            style={{
              background: "linear-gradient(135deg, #0066FF, #00E5FF)",
              boxShadow: "0 0 60px rgba(0,102,255,0.3)",
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
