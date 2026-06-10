"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const milestones = [
  {
    year: "2025",
    label: "Foundation",
    description:
      "Mahadeva Digital Solutions is born from a singular vision — to create AI that truly understands humanity, not just processes it.",
    color: "from-blue-600 to-cyan-400",
  },
  {
    year: "Now",
    label: "Noorva Development",
    description:
      "Deep in development, Noorva is being trained on the nuances of human emotion, cognition, and life — becoming the world's most empathetic AI.",
    color: "from-cyan-400 to-purple-500",
  },
  {
    year: "Tomorrow",
    label: "Global AI Leadership",
    description:
      "MDS leads a new era where AI is not a tool but a companion — trusted, present, and profoundly human in its understanding.",
    color: "from-purple-500 to-blue-600",
  },
];

export function StorySection() {
  return (
    <section id="story" className="section-padding relative overflow-hidden">
      <div className="ambient-glow ambient-glow-blue w-[600px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">
            Our Story
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4 leading-tight">
            The <span className="text-gradient">MDS</span>
            <br />
            Journey
          </h2>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col gap-12">
            {milestones.map((milestone, i) => (
              <StoryCard key={milestone.year} milestone={milestone} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCard({
  milestone,
  index,
}: {
  milestone: (typeof milestones)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-6 md:gap-16 ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      } flex-col`}
    >
      <div className="flex-1 text-left">
        <div
          className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-4 bg-gradient-to-r ${milestone.color} text-white tracking-widest`}
        >
          {milestone.year}
        </div>
        <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">{milestone.label}</h3>
        <p className="text-white/50 text-base md:text-lg leading-relaxed max-w-md">{milestone.description}</p>
      </div>

      {/* Central node — static dot, no pulse */}
      <div className="hidden md:flex w-16 h-16 shrink-0 items-center justify-center">
        <div
          className={`w-4 h-4 rounded-full bg-gradient-to-br ${milestone.color} opacity-70`}
        />
      </div>

      {/* Accent visual — static, no float */}
      <div className="flex-1 flex justify-center">
        <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-3xl glass gradient-border flex items-center justify-center">
          <div
            className={`text-7xl md:text-8xl font-black text-transparent bg-gradient-to-br ${milestone.color} bg-clip-text opacity-25`}
          >
            {index + 1}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
