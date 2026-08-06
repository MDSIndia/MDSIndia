"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    try {
      const res = await fetch("https://formspree.io/f/mdavpjog", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data?.errors?.[0]?.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,55,210,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span
            className="text-xs font-medium tracking-[0.5em] uppercase"
            style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(0,212,255,0.8)" }}
          >
            AI Communication Portal
          </span>
          <h2
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.8rem, 7vw, 7rem)", lineHeight: 0.92, letterSpacing: "0.01em" }}
          >
            Start a <span className="text-gradient">Conversation</span>
          </h2>
          <p
            className="mt-6"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(1rem, 1.25vw, 1.18rem)",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            We read every message. We respond to every vision.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="contact-panel rounded-3xl p-5 sm:p-8 md:p-12 relative overflow-hidden"
          style={{
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            boxShadow: "0 0 90px rgba(236,72,153,0.10), 0 0 70px rgba(0,85,255,0.14), 0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
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
                    <label
                      className="field-label text-xs uppercase tracking-widest mb-2.5"
                      style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.6)" }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="premium-field w-full rounded-full px-6 py-3.5 text-white text-sm focus:outline-none transition-all duration-300"
                      style={{ colorScheme: "dark" }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.32)";
                        e.target.style.background = "rgba(255,255,255,0.075)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.14)";
                        e.target.style.background = "rgba(255,255,255,0.045)";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="field-label text-xs uppercase tracking-widest mb-2.5"
                      style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.6)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="premium-field w-full rounded-full px-6 py-3.5 text-white text-sm focus:outline-none transition-all duration-300"
                      style={{ colorScheme: "dark" }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.32)";
                        e.target.style.background = "rgba(255,255,255,0.075)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.14)";
                        e.target.style.background = "rgba(255,255,255,0.045)";
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="field-label text-xs uppercase tracking-widest mb-2.5"
                    style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.6)" }}
                  >
                    Subject
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {subjects.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, subject: s })}
                        className={`subject-pill inline-flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs font-medium ${
                          formData.subject === s ? "is-active" : ""
                        }`}
                        style={{ fontFamily: "var(--font-inter), sans-serif" }}
                      >
                        {formData.subject === s && <Check className="size-3" strokeWidth={3} />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="field-label text-xs uppercase tracking-widest mb-2.5"
                    style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.6)" }}
                  >
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Share your vision, question, or idea..."
                    className="premium-field w-full rounded-[28px] px-6 py-4 text-white text-sm focus:outline-none transition-all duration-300 resize-none"
                    style={{ colorScheme: "dark" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.32)";
                      e.target.style.background = "rgba(255,255,255,0.075)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.14)";
                      e.target.style.background = "rgba(255,255,255,0.045)";
                    }}
                  />
                </div>

                {error && (
                  <p
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{
                      fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                      background: "rgba(255,60,60,0.10)",
                      border: "1px solid rgba(255,60,60,0.25)",
                      backdropFilter: "blur(12px) saturate(150%)",
                      WebkitBackdropFilter: "blur(12px) saturate(150%)",
                      color: "rgba(255,120,120,0.95)",
                    }}
                  >
                    {error}
                  </p>
                )}

                <div
                  className="h-px w-full"
                  style={{ background: "linear-gradient(to right, rgba(255,255,255,0.14), transparent 60%)" }}
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div
                    className="text-xs tracking-wide"
                    style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.45)" }}
                  >
                    services@mdsindia.in · Hyderabad, Telangana, India
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary contact-submit-btn relative text-sm overflow-hidden"
                  >
                    <span className="relative z-10 inline-flex items-center gap-2.5">
                      {!sending && <ArrowRight className="size-4" strokeWidth={2.25} />}
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
                <span className="text-6xl mb-6 block">✦</span>
                <h3
                  className="neue-machina text-3xl mb-3"
                  style={{ color: "#ffffff" }}
                >
                  Message Received
                </h3>
                <p
                  className="text-lg"
                  style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: "rgba(255,255,255,0.68)" }}
                >
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
