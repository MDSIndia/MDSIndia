"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Mail } from "lucide-react";
import type { CareerRole } from "@/lib/careers";
import {
  APPLY_EMAIL,
  APPLY_ENDPOINT,
  BulletList,
  EASE,
  Eyebrow,
  SG,
  SectionTitle,
  availabilityOptions,
  focusIn,
  focusOut,
  glass,
  labelStyle,
} from "./CareersSection";

/* ─── Application form (every role except Co-Founder) ───────────────── */

const initialForm = {
  name: "",
  mobile: "",
  email: "",
  location: "",
  experience: "",
  portfolio: "",
  availability: "",
  coverLetter: "",
  gotcha: "",
};
type FormState = typeof initialForm;

function RoleApplicationForm({ role }: { role: CareerRole }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const input = (
    id: keyof FormState,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean; autoComplete?: string; pattern?: string } = {}
  ) => (
    <div>
      <label htmlFor={id} className="field-label text-xs uppercase tracking-widest mb-2.5" style={labelStyle}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={opts.type ?? "text"}
        required={opts.required ?? true}
        pattern={opts.pattern}
        autoComplete={opts.autoComplete}
        value={form[id]}
        onChange={set(id)}
        placeholder={opts.placeholder}
        className="premium-field w-full rounded-full px-6 py-3.5 text-white text-sm focus:outline-none transition-all duration-300"
        style={{ colorScheme: "dark" }}
        onFocus={focusIn}
        onBlur={focusOut}
      />
    </div>
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.availability) {
      setError("Please tell us when you can start before submitting.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(APPLY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `${role.title} Application — ${form.name}`,
          form: `${role.title} application`,
          role: role.title,
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          location: form.location,
          experience: form.experience,
          portfolio_or_resume_link: form.portfolio,
          availability_to_start: form.availability,
          cover_letter: form.coverLetter,
          _gotcha: form.gotcha,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(
          data?.errors?.[0]?.message ??
            `Something went wrong. Please try again, or email your application to ${APPLY_EMAIL}.`
        );
      }
    } catch {
      setError(
        `Network error. Please check your connection and try again, or email your application to ${APPLY_EMAIL}.`
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="contact-panel rounded-3xl p-5 sm:p-8 md:p-12 relative overflow-hidden"
      style={{
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        boxShadow:
          "0 0 90px rgba(236,72,153,0.10), 0 0 70px rgba(0,85,255,0.14), 0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
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
              {input("name", "Full Name", { placeholder: "Your full name", autoComplete: "name" })}
              {input("mobile", "Mobile Number", {
                type: "tel",
                placeholder: "+91 …",
                autoComplete: "tel",
                pattern: "[0-9+()\\-\\s]{7,}",
              })}
              {input("email", "Email", { type: "email", placeholder: "your@email.com", autoComplete: "email" })}
              {input("location", "City & Country", { placeholder: "Where are you based?" })}
            </div>

            {input("experience", "Years of Experience", {
              placeholder: "Total years of experience, and in which tools",
            })}
            {input("portfolio", "Portfolio / Showreel / Resume Link", {
              type: "url",
              placeholder: "https://… (your best work)",
            })}

            <div>
              <span className="field-label text-xs uppercase tracking-widest mb-2.5" style={labelStyle}>
                When can you start?
              </span>
              <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="When can you start?">
                {availabilityOptions.map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={form.availability === o}
                    onClick={() => setForm((f) => ({ ...f, availability: o }))}
                    className={`subject-pill inline-flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs font-medium ${
                      form.availability === o ? "is-active" : ""
                    }`}
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    {form.availability === o && <Check className="size-3" strokeWidth={3} />}
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="coverLetter"
                className="field-label text-xs uppercase tracking-widest mb-2.5 !w-auto"
                style={labelStyle}
              >
                Cover Letter
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                required
                rows={6}
                value={form.coverLetter}
                onChange={set("coverLetter")}
                placeholder="In your own words: what you've made, what you'd like to build with us, and why MDS. We'd rather hear your authentic voice than read an AI-generated response."
                className="premium-field w-full rounded-[28px] px-6 py-4 text-white text-sm focus:outline-none transition-all duration-300 resize-none"
                style={{ colorScheme: "dark" }}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </div>

            {/* Honeypot — hidden from people, bots tend to fill it in */}
            <input
              type="text"
              name="_gotcha"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.gotcha}
              onChange={set("gotcha")}
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />

            {error && (
              <p
                role="alert"
                className="text-sm px-4 py-3 rounded-xl"
                style={{
                  fontFamily: SG,
                  background: "rgba(255,60,60,0.10)",
                  border: "1px solid rgba(255,60,60,0.25)",
                  color: "rgba(255,120,120,0.95)",
                }}
              >
                {error}
              </p>
            )}

            <div className="h-px w-full" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.14), transparent 60%)" }} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs tracking-wide" style={{ fontFamily: SG, color: "rgba(255,255,255,0.45)" }}>
                Your application is sent to {APPLY_EMAIL}
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn-primary contact-submit-btn relative text-sm overflow-hidden"
              >
                <span className="relative z-10 inline-flex items-center gap-2.5">
                  {!sending && <ArrowRight className="size-4" strokeWidth={2.25} />}
                  {sending ? "Submitting..." : "Submit Application"}
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
            <h3 className="neue-machina text-3xl mb-3" style={{ color: "#ffffff" }}>
              Application Received
            </h3>
            <p className="text-lg" style={{ fontFamily: SG, color: "rgba(255,255,255,0.68)" }}>
              Thank you for your interest in MDS. We&apos;ll review your application and get back to you at the
              email address you provided.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Role page (/careers/<slug>) ───────────────────────────────────── */

export function RoleDetail({ role }: { role: CareerRole }) {
  return (
    <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 20%, ${role.color}1f 0%, transparent 70%)`,
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-center mb-14"
        >
          <Link href="/careers" className="inline-block hover:opacity-80 transition-opacity">
            <Eyebrow>Careers at MDS</Eyebrow>
          </Link>
          <h1
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.6rem, 6.5vw, 5.8rem)", lineHeight: 0.98, letterSpacing: "0.01em" }}
          >
            <span className="text-gradient">{role.title}</span>
          </h1>
          <p
            className="mt-5 text-xs uppercase"
            style={{ fontFamily: SG, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}
          >
            {role.team} · Mahadeva Digital Solutions Pvt. Ltd.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
            {role.tags.map((t) => (
              <span
                key={t}
                className="px-4 py-1.5 rounded-full text-xs font-medium uppercase"
                style={{
                  fontFamily: SG,
                  letterSpacing: "0.12em",
                  color: "rgba(216,238,255,0.92)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3.5 justify-center">
            <a href="#apply" className="btn-primary text-sm">
              <ArrowRight className="size-4" strokeWidth={2.25} />
              Apply Now
            </a>
            <a href={`mailto:${APPLY_EMAIL}`} className="btn-secondary text-sm">
              <Mail className="size-4" strokeWidth={2.25} />
              {APPLY_EMAIL}
            </a>
          </div>
        </motion.div>

        {role.about && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="rounded-2xl p-6 md:p-10 mb-12"
            style={glass}
          >
            <Eyebrow color="rgba(168,85,247,0.75)">About the Role</Eyebrow>
            <div className="mt-4 space-y-4" style={{ fontFamily: SG, lineHeight: 1.8, color: "#FFFFFF" }}>
              {role.about.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </motion.div>
        )}

        {role.responsibilities && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-14"
          >
            <Eyebrow>The Role</Eyebrow>
            <div className="mt-3">
              <SectionTitle>What you&apos;ll do</SectionTitle>
            </div>
            <BulletList items={role.responsibilities} />
          </motion.div>
        )}

        {role.requirements && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-14"
          >
            <Eyebrow>Requirements</Eyebrow>
            <div className="mt-3">
              <SectionTitle>What we&apos;re looking for</SectionTitle>
            </div>
            <BulletList items={role.requirements} />
          </motion.div>
        )}

        {role.niceToHave && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-14"
          >
            <Eyebrow color="rgba(168,85,247,0.75)">A Bonus</Eyebrow>
            <div className="mt-3">
              <SectionTitle>Nice to have</SectionTitle>
            </div>
            <BulletList items={role.niceToHave} />
          </motion.div>
        )}

        <motion.div
          id="apply"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="scroll-mt-28"
        >
          <div className="text-center mb-8">
            <Eyebrow>How to Apply</Eyebrow>
            <h2
              className="neue-machina mt-4"
              style={{ fontSize: "clamp(2rem, 4.6vw, 3.8rem)", lineHeight: 0.98 }}
            >
              Apply for <span className="text-gradient">{role.title}</span>
            </h2>
            <p
              className="mt-5 mx-auto"
              style={{
                fontFamily: SG,
                fontSize: "clamp(0.95rem, 1.2vw, 1.08rem)",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.7)",
                maxWidth: 680,
              }}
            >
              Fill in the form below, or email your portfolio and cover letter to{" "}
              <a href={`mailto:${APPLY_EMAIL}`} className="underline underline-offset-4" style={{ color: "#00D4FF" }}>
                {APPLY_EMAIL}
              </a>
              . Show us your best work — it tells us more than any résumé.
            </p>
          </div>

          <RoleApplicationForm role={role} />
        </motion.div>
      </div>
    </section>
  );
}
