"use client";

import { motion } from "framer-motion";

const team = [
  {
    name: "Founder",
    role: "Chief Executive Officer",
    tagline: "Visionary. Builder. Dreamer.",
    description:
      "The architect of MDS's grand vision — a believer that AI should serve humanity's highest potential, not just its productivity.",
    initials: "F",
    color: "from-blue-600 to-cyan-400",
    linkedin: "#",
  },
  {
    name: "Director",
    role: "Chief Operations Officer",
    tagline: "Executor. Strategist. Leader.",
    description:
      "Turning vision into reality — building the systems, teams, and culture that will take MDS from startup to global AI leader.",
    initials: "D",
    color: "from-purple-600 to-blue-600",
    linkedin: "#",
  },
  {
    name: "CTO",
    role: "Chief Technology Officer",
    tagline: "Engineer. Architect. Innovator.",
    description:
      "The technical mastermind behind Noorva's intelligence — building AI systems that genuinely understand the complexity of human life.",
    initials: "C",
    color: "from-cyan-400 to-purple-600",
    linkedin: "#",
  },
];

export function TeamSection() {
  return (
    <section id="team" className="section-padding relative overflow-hidden">
      <div className="ambient-glow ambient-glow-purple w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">
            The Builders
          </span>
          <h2 className="text-5xl md:text-7xl font-black mt-4">
            Leadership <span className="text-gradient">Team</span>
          </h2>
          <p className="text-white/40 text-xl mt-6 max-w-xl mx-auto">
            Driven by purpose. United by a belief that technology should serve humanity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <motion.div
              key={member.role}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className="rounded-3xl glass border border-white/8 p-8 relative overflow-hidden group cursor-default hover:border-white/15 transition-colors duration-300"
            >
              {/* Gradient top accent */}
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${member.color}`} />

              {/* Subtle hover fill */}
              <div
                className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${member.color}`}
                style={{ opacity: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.04")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              />

              {/* Avatar */}
              <div className="relative mb-6">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-black text-2xl`}
                >
                  {member.initials}
                </div>
              </div>

              <div className="relative">
                <span className="text-xs text-white/30 font-medium tracking-widest uppercase">
                  {member.role}
                </span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-1">{member.name}</h3>
                <p
                  className={`text-sm font-medium bg-gradient-to-r ${member.color} bg-clip-text text-transparent mb-4`}
                >
                  {member.tagline}
                </p>
                <p className="text-white/80 text-sm leading-relaxed mb-6">{member.description}</p>
                <a
                  href={member.linkedin}
                  className={`inline-flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${member.color} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                >
                  <span className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    in
                  </span>
                  Connect on LinkedIn
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
