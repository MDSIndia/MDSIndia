"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const subjects = [
    "General Inquiry",
    "Investment Discussion",
    "Partnership",
    "Career Opportunity",
    "Media & Press",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <div className="ambient-glow ambient-glow-blue w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">
            AI Communication Portal
          </span>
          <h2 className="text-4xl md:text-7xl font-black mt-4">
            Start a <span className="text-gradient">Conversation</span>
          </h2>
          <p className="text-white/40 text-xl mt-6">
            We read every message. We respond to every vision.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl glass-strong border border-white/10 p-5 sm:p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors duration-300"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors duration-300"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                    Subject
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, subject: s })}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-medium transition-colors duration-200 ${
                          formData.subject === s
                            ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white"
                            : "glass border border-white/8 text-white/40 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Share your vision, question, or idea..."
                    className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors duration-300 resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/20">
                    services@mdsindia.in · Hyderabad, Telangana, India
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="relative px-8 py-4 rounded-full font-semibold text-white overflow-hidden disabled:opacity-50 transition-opacity duration-300 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #0066FF, #00E5FF)" }}
                  >
                    <span className="relative z-10">
                      {sending ? "Transmitting..." : "Send Message"}
                    </span>
                    {sending && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                {/* Static star — no pulse animation */}
                <span className="text-6xl mb-6 block">✦</span>
                <h3 className="text-3xl font-bold text-white mb-3">Message Received</h3>
                <p className="text-white/40 text-lg">
                  We&apos;ll be in touch soon. The future is being built one conversation at a time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
