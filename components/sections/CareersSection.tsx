"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const roles = [
  {
    title: "AI Research Engineer",
    type: "Full-time",
    location: "Hyderabad / Remote",
    description: "Help us push the boundaries of emotional AI. Work on Noorva's core intelligence systems.",
    tags: ["Python", "PyTorch", "LLMs", "NLP"],
    accent: "from-blue-500 to-cyan-400",
    tagStyle: { background: "rgba(0,85,255,0.12)", color: "rgba(147,197,253,0.9)", border: "1px solid rgba(0,85,255,0.25)" },
  },
  {
    title: "Full Stack Engineer",
    type: "Full-time",
    location: "Hyderabad / Remote",
    description: "Build the platform that millions will use to connect with Noorva. Next.js, Node, AI APIs.",
    tags: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    accent: "from-cyan-500 to-teal-400",
    tagStyle: { background: "rgba(0,212,255,0.10)", color: "rgba(103,232,249,0.9)", border: "1px solid rgba(0,212,255,0.22)" },
  },
  {
    title: "Product Designer",
    type: "Full-time",
    location: "Hyderabad / Remote",
    description: "Design the most human-centered AI product the world has ever seen. Think beyond conventional UX.",
    tags: ["Figma", "Motion Design", "UX Research", "3D"],
    accent: "from-purple-500 to-violet-400",
    tagStyle: { background: "rgba(139,92,246,0.12)", color: "rgba(196,181,253,0.9)", border: "1px solid rgba(139,92,246,0.25)" },
  },
  {
    title: "Growth & Marketing Lead",
    type: "Full-time",
    location: "Hyderabad",
    description: "Tell the MDS story to the world. Build communities, create movements, launch the future.",
    tags: ["Brand Strategy", "Content", "Community", "Analytics"],
    accent: "from-emerald-500 to-teal-400",
    tagStyle: { background: "rgba(16,185,129,0.10)", color: "rgba(110,231,183,0.9)", border: "1px solid rgba(16,185,129,0.22)" },
  },
];

export function CareersSection() {
  return (
    <section id="careers" className="section-padding relative overflow-hidden">
      <div
        className="absolute w-[600px] h-[400px] top-1/2 right-0 -translate-y-1/2 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,212,255,0.10) 0%, transparent 70%)" }}
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
            Join The Mission
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            Build The{" "}
            <span className="text-gradient">Future</span>
            <br />
            With Us
          </h2>
          <p
            className="text-xl mt-6 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            We&apos;re not hiring employees. We&apos;re recruiting people who believe that their work can change the trajectory of human history.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl overflow-hidden cursor-default group"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(20px) saturate(150%)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1">{role.title}</h3>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      >
                        {role.type}
                      </span>
                      <span>·</span>
                      <span>{role.location}</span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ x: 3 }}
                    className="text-xl mt-0.5 transition-colors duration-300"
                    style={{ color: "rgba(255,255,255,0.20)" }}
                  >
                    →
                  </motion.div>
                </div>
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {role.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={role.tagStyle}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p
            className="mb-6 text-sm"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            Don&apos;t see your role? We hire exceptional people regardless.
          </p>
          <a href="mailto:services@mdsindia.in" className="btn-primary text-sm">
            Send Your Vision
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
