"use client";

import { motion } from "framer-motion";

const roles = [
  {
    title: "AI Research Engineer",
    type: "Full-time",
    location: "Hyderabad / Remote",
    description: "Help us push the boundaries of emotional AI. Work on Noorva's core intelligence systems.",
    tags: ["Python", "PyTorch", "LLMs", "NLP"],
    color: "border-blue-500/20",
  },
  {
    title: "Full Stack Engineer",
    type: "Full-time",
    location: "Hyderabad / Remote",
    description: "Build the platform that millions will use to connect with Noorva. Next.js, Node, AI APIs.",
    tags: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    color: "border-cyan-500/20",
  },
  {
    title: "Product Designer",
    type: "Full-time",
    location: "Hyderabad / Remote",
    description: "Design the most human-centered AI product the world has ever seen. Think beyond conventional UX.",
    tags: ["Figma", "Motion Design", "UX Research", "3D"],
    color: "border-purple-500/20",
  },
  {
    title: "Growth & Marketing Lead",
    type: "Full-time",
    location: "Hyderabad",
    description: "Tell the MDS story to the world. Build communities, create movements, launch the future.",
    tags: ["Brand Strategy", "Content", "Community", "Analytics"],
    color: "border-green-500/20",
  },
];

export function CareersSection() {
  return (
    <section id="careers" className="section-padding relative overflow-hidden">
      <div className="ambient-glow ambient-glow-cyan w-[600px] h-[400px] top-1/2 right-0 -translate-y-1/2" />
      {/* Cinematic edge fades */}
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
            Join The Mission
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            Build The{" "}
            <span className="text-gradient">Future</span>
            <br />
            With Us
          </h2>
          <p className="text-white/40 text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            We&apos;re not hiring employees. We&apos;re recruiting people who believe that their work can change the trajectory of human history.
          </p>
        </motion.div>

        {/* Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              whileHover={{ y: -4 }}
              className={`p-4 md:p-6 rounded-3xl glass border ${role.color} hover:border-opacity-100 transition-all duration-300 group cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1">{role.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span>{role.type}</span>
                    <span>·</span>
                    <span>{role.location}</span>
                  </div>
                </div>
                <motion.div
                  whileHover={{ x: 3 }}
                  className="text-white/20 group-hover:text-cyan-400 transition-colors duration-300 text-xl"
                >
                  →
                </motion.div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-4">{role.description}</p>
              <div className="flex flex-wrap gap-2">
                {role.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs glass border border-white/8 text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Apply CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-white/30 mb-6 text-sm">Don&apos;t see your role? We hire exceptional people regardless.</p>
          <a
            href="mailto:services@mdsindia.in"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass border border-white/10 text-white hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] transition-all duration-300"
          >
            <span>Send Your Vision</span>
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
