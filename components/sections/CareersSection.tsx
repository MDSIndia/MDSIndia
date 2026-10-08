"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Handshake,
  Lightbulb,
  Mail,
  Megaphone,
  Network,
  Package,
  Scale,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const SG = "var(--font-space-grotesk), Inter, sans-serif";
const NM = "var(--font-display)";

// Applications go to the same Formspree endpoint as the contact form;
// the notification address is configured on that form in Formspree.
const APPLY_ENDPOINT = "https://formspree.io/f/mdavpjog";
const APPLY_EMAIL = "services@mdsindia.in";

const lookingFor = [
  "Thinks big and isn't afraid to take bold bets.",
  "Takes ownership and turns ideas into reality.",
  "Is ambitious, driven, and passionate about creating meaningful impact.",
  "Wants to challenge the status quo and help shape the future.",
  "Sees technology as a force for positive change.",
  "Wants to build something extraordinary rather than simply work for it.",
  "Is ready to leave their mark on the world and create a better tomorrow for generations to come.",
];

const responsibilities: {
  title: string;
  icon: LucideIcon;
  color: string;
  points: string[];
}[] = [
  {
    title: "Fundraising & Financial Management",
    icon: Wallet,
    color: "#00D4FF",
    points: [
      "Co-lead fundraising efforts, pitch to investors, prepare business cases, and manage capital requirements.",
      "Monitor budgets, allocate resources responsibly, and ensure financial discipline to support growth and operational scalability.",
    ],
  },
  {
    title: "Product & Operations Oversight",
    icon: Package,
    color: "#0055FF",
    points: [
      "Oversee product roadmaps, establish operational processes, and ensure alignment between development efforts and market demands.",
      "Take on an executive role as COO, involved in day-to-day decision-making during the early stages.",
    ],
  },
  {
    title: "Team Building & Leadership",
    icon: Users,
    color: "#A855F7",
    points: [
      "Recruit, mentor, and develop a high-performing team.",
      "Assign roles, maintain morale, and foster a collaborative culture that encourages innovation and accountability.",
      "Ensure each team member's responsibilities are clear and aligned with the company's goals.",
    ],
  },
  {
    title: "Risk Management & Problem Solving",
    icon: ShieldAlert,
    color: "#EC4899",
    points: [
      "Assess risks related to product, market, finances, and operations, and implement strategies to mitigate them.",
      "Adapt to challenges, pivot when necessary, and make timely decisions based on data, expert input, and market feedback.",
    ],
  },
  {
    title: "Brand Development & External Relations",
    icon: Megaphone,
    color: "#7AA4FF",
    points: [
      "Represent the company to investors, partners, customers, and the media.",
      "Help build credibility, establish strategic partnerships, and communicate the company's vision effectively to stakeholders.",
    ],
  },
  {
    title: "Cross-Functional Leadership",
    icon: Network,
    color: "#00D4FF",
    points: [
      "As COO, act as a bridge between departments — fostering collaboration, breaking down silos, and ensuring smooth coordination.",
      "Oversee multiple departments, including product development, project management, research and development, product design, and administrative functions, ensuring resources are effectively utilized.",
    ],
  },
  {
    title: "Strategic Partner to the CEO",
    icon: Handshake,
    color: "#0055FF",
    points: [
      "While the CEO focuses on vision, external relationships, and long-term strategy, the COO translates these high-level plans into actionable initiatives.",
      "May lead expansion projects, mergers, acquisitions, or new product rollouts, ensuring strategic objectives are implemented efficiently.",
    ],
  },
  {
    title: "Compliance & Governance",
    icon: Scale,
    color: "#A855F7",
    points: [
      "Ensure adherence to statutory regulations, corporate policies, and industry standards.",
      "May be accountable for labour laws, environmental regulations, taxation, and contractual obligations, coordinating with legal teams to manage operational risks.",
    ],
  },
  {
    title: "Problem Solving & Innovation",
    icon: Lightbulb,
    color: "#EC4899",
    points: [
      "Be a resourceful problem solver, continuously seeking ways to improve operational efficiency, implement innovative solutions, and maintain competitive advantage through operational excellence.",
    ],
  },
];

const qualifications = [
  "Anyone can apply. Your educational background is not a deciding factor if you have the skills, mindset, and desire to be part of something big.",
  "A background in business, finance, entrepreneurship, or related experience will be considered an added advantage.",
  "MDS Pvt. Ltd. is an inclusive company, and we welcome applications from individuals of all genders, regions, races, nationalities, and economic backgrounds.",
  "We are also looking for a candidate who is willing to invest in the company as a demonstration of their commitment to the business, its vision, and its long-term success. The amount you choose to invest is entirely at your discretion.",
  "This opportunity is not for someone who makes promises without following through. Greatness is not built on great words alone, but on consistent action, commitment, and execution.",
];

const glass = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)",
} as const;

function Eyebrow({ children, color = "rgba(0,212,255,0.8)" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="text-xs font-medium tracking-[0.5em] uppercase block"
      style={{ fontFamily: SG, color }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="mb-6"
      style={{
        fontFamily: NM,
        fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)",
        lineHeight: 1.1,
        fontWeight: 700,
        color: "rgba(255,255,255,0.95)",
      }}
    >
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className="mt-2 size-1.5 shrink-0 rounded-full"
            style={{ background: "#00D4FF", boxShadow: "0 0 8px rgba(0,212,255,0.8)" }}
          />
          <span
            style={{
              fontFamily: SG,
              fontSize: "clamp(0.92rem, 1.15vw, 1.02rem)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.86)",
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Application form ──────────────────────────────────────────────── */

const availabilityOptions = ["Immediately", "Within a month", "Need more time"];
const investOptions = ["Yes, I'm willing", "Open to discussing", "Not at this time"];

const initialForm = {
  name: "",
  mobile: "",
  email: "",
  location: "",
  experience: "",
  background: "",
  profile: "",
  venture: "",
  finance: "",
  operations: "",
  risk: "",
  why: "",
  availability: "",
  invest: "",
  coverLetter: "",
  gotcha: "",
};

type FormState = typeof initialForm;

const labelStyle = { fontFamily: SG, color: "rgba(255,255,255,0.6)" } as const;
const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.32)";
  e.target.style.background = "rgba(255,255,255,0.075)";
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.14)";
  e.target.style.background = "rgba(255,255,255,0.045)";
};

function ApplicationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

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

  const area = (id: keyof FormState, label: string, placeholder: string, rows = 4) => (
    <div>
      <label htmlFor={id} className="field-label text-xs uppercase tracking-widest mb-2.5 !w-auto" style={labelStyle}>
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        required
        rows={rows}
        value={form[id]}
        onChange={set(id)}
        placeholder={placeholder}
        className="premium-field w-full rounded-[28px] px-6 py-4 text-white text-sm focus:outline-none transition-all duration-300 resize-none"
        style={{ colorScheme: "dark" }}
        onFocus={focusIn}
        onBlur={focusOut}
      />
    </div>
  );

  const pills = (id: "availability" | "invest", label: string, options: string[]) => (
    <div>
      <span className="field-label text-xs uppercase tracking-widest mb-2.5" style={labelStyle}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={form[id] === o}
            onClick={() => setForm((f) => ({ ...f, [id]: o }))}
            className={`subject-pill inline-flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs font-medium ${
              form[id] === o ? "is-active" : ""
            }`}
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            {form[id] === o && <Check className="size-3" strokeWidth={3} />}
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.availability || !form.invest) {
      setError("Please answer the availability and investment questions before submitting.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(APPLY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `Co-Founder Application — ${form.name}`,
          form: "Co-Founder / COO application",
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          location: form.location,
          experience: form.experience,
          professional_background: form.background,
          profile_or_resume_link: form.profile || "(not provided)",
          screening_venture_built_or_led: form.venture,
          screening_fundraising_and_finance: form.finance,
          screening_operations_and_compliance: form.operations,
          screening_risk_and_pivot: form.risk,
          screening_why_cofounder_and_contribution: form.why,
          availability_to_start: form.availability,
          willing_to_invest: form.invest,
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

            <div className="grid grid-cols-1 gap-6">
              {input("experience", "Years of Experience", {
                placeholder: "Total years of experience, and in which fields",
              })}
              {area(
                "background",
                "Professional Background",
                "Your roles, companies, ventures, and the education or skills you consider relevant (education is not a deciding factor)…"
              )}
              {input("profile", "LinkedIn / Portfolio / Resume Link", {
                type: "url",
                required: false,
                placeholder: "https://… (optional — you can also email your resume)",
              })}
            </div>

            <div className="h-px w-full" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.14), transparent 60%)" }} />

            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ fontFamily: SG, color: "rgba(0,212,255,0.8)" }}
            >
              Screening Questions
            </p>

            {area(
              "venture",
              "Tell us about a venture, product, or team you built or led",
              "What was your role, what did you build, and what was the outcome?"
            )}
            {area(
              "finance",
              "Fundraising & financial management experience",
              "Investor pitches, business cases, budgets, or capital you have managed…"
            )}
            {area(
              "operations",
              "Operations, team building & compliance",
              "How have you set up processes, built and led teams, or handled regulatory and compliance responsibilities?"
            )}
            {area(
              "risk",
              "A major risk or setback you faced",
              "How did you decide whether to push forward or pivot, and what did you learn?"
            )}
            {area(
              "why",
              "Why do you want to be a Co-Founder of MDS?",
              "What will you bring to MDS's vision, and what do you want to build with us?"
            )}

            <div className="grid grid-cols-1 gap-6">
              {pills("availability", "When can you start?", availabilityOptions)}
              {pills("invest", "Are you willing to invest in the company?", investOptions)}
            </div>
            <p className="text-xs -mt-3" style={{ fontFamily: SG, color: "rgba(255,255,255,0.45)" }}>
              Any investment is a demonstration of commitment, and the amount is entirely at your discretion.
            </p>

            {area(
              "coverLetter",
              "Cover Letter",
              "In your own words: your ideas, your ambitions, and why you want to be part of MDS. We'd rather hear your authentic voice than read an AI-generated response.",
              7
            )}

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

/* ─── Page content ──────────────────────────────────────────────────── */

export function CareersPageContent() {
  return (
    <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,55,210,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="scene-top-fade" />
      <div className="scene-bottom-fade" />

      <div className="relative max-w-5xl mx-auto mb-10">
        <Link href="/#hero" className="btn-secondary group text-sm">
          <ArrowLeft
            className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={2.25}
          />
          Back to Home
        </Link>
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-center mb-14"
        >
          <Eyebrow>Careers at MDS</Eyebrow>
          <h1
            className="neue-machina mt-4"
            style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)", lineHeight: 0.95, letterSpacing: "0.01em" }}
          >
            Co-<span className="text-gradient">Founder</span>
          </h1>
          <p
            className="mt-5 text-xs uppercase"
            style={{ fontFamily: SG, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}
          >
            Executive role as COO · Mahadeva Digital Solutions Pvt. Ltd.
          </p>
          <p
            className="mt-8 mx-auto"
            style={{
              fontFamily: SG,
              fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 760,
            }}
          >
            MDS Pvt. Ltd. is looking for an ambitious Co-Founder who is ready to embark on an exciting startup
            adventure and join us on an extraordinary journey of innovation, invention, and impact. If you want to
            help build technologies and products that can transform lives and shape the future of humanity, this is
            your opportunity to become a co-creator of MDS&apos;s grand vision:
          </p>
          <p
            className="mt-6 mx-auto"
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.2rem, 2.3vw, 1.9rem)",
              lineHeight: 1.35,
              fontWeight: 700,
              maxWidth: 820,
              background: "linear-gradient(135deg, #FFFFFF 0%, #D8EEFF 35%, #7AA4FF 70%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            &ldquo;Shaping the future through innovation and advanced technology, creating a powerful, intelligent,
            and human-centered world.&rdquo;
          </p>
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

        {/* About us */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="rounded-2xl p-6 md:p-10 mb-12"
          style={glass}
        >
          <Eyebrow color="rgba(168,85,247,0.75)">About Us</Eyebrow>
          <div className="mt-4 space-y-4" style={{ fontFamily: SG, lineHeight: 1.8, color: "rgba(255,255,255,0.84)" }}>
            <p>
              Mahadeva Digital Solutions Private Limited (MDS) is a technology company based in Hyderabad, India.
              Founded on May 8, 2025, MDS is a Startup India-recognized company. Its primary goal is to build
              innovative products that create a positive impact on the world.
            </p>
            <p>
              MDS is currently focused on developing innovative Human-Interactive AI and Affective AI technologies
              to ensure that AI better serves humanity by enhancing human capabilities, intelligence, and quality of
              life at scale, rather than becoming a threat to society.
            </p>
            <p>
              As part of these initiatives, MDS is preparing to launch its flagship product, Noorva Companion MLP,
              under its broader Noorva Ecosystem vision of building humanized AI solutions around people&apos;s daily
              lives. Noorva Companion is a next-generation application designed to help individuals improve and
              enrich their everyday lives (additional details will be shared with selected candidates).
            </p>
            <p>
              MDS has already established a strong team and solid startup foundation and is now looking to further
              strengthen its leadership by bringing on a committed Co-Founder, who will serve as a co-creator of the
              company&apos;s vision.
            </p>
            <p>
              MDS is a strongly principle-centered and values-driven organization. Its core purpose is to create
              meaningful value for the world through its work, innovation, and commitment to human progress. To learn
              more about MDS, visit{" "}
              <a href="https://mdsindia.in" className="underline underline-offset-4" style={{ color: "#00D4FF" }}>
                MDSIndia.in
              </a>
              .
            </p>
          </div>
        </motion.div>

        {/* Who we're looking for */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-14"
        >
          <Eyebrow>Who We&apos;re Looking For</Eyebrow>
          <h2
            className="mt-3 mb-6"
            style={{
              fontFamily: NM,
              fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)",
              lineHeight: 1.15,
              fontWeight: 700,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            We&apos;re not just looking for a co-founder. We&apos;re looking for someone who:
          </h2>
          <BulletList items={lookingFor} />
        </motion.div>

        {/* Responsibilities */}
        <div className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <Eyebrow>The Role</Eyebrow>
            <div className="mt-3">
              <SectionTitle>Responsibilities</SectionTitle>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {responsibilities.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (i % 2) * 0.08, ease: EASE }}
                  className="rounded-2xl p-5 md:p-6"
                  style={glass}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon
                      className="size-6 shrink-0"
                      strokeWidth={2}
                      style={{ color: r.color, filter: `drop-shadow(0 0 8px ${r.color}66)` }}
                    />
                    <h3 style={{ fontFamily: SG, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>{r.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {r.points.map((p) => (
                      <li
                        key={p}
                        className="text-sm"
                        style={{ fontFamily: SG, lineHeight: 1.7, color: "rgba(255,255,255,0.74)" }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Qualifications */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-14"
        >
          <Eyebrow>Requirements</Eyebrow>
          <div className="mt-3">
            <SectionTitle>Qualifications</SectionTitle>
          </div>
          <BulletList items={qualifications} />
        </motion.div>

        {/* Compensation */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-14"
        >
          <Eyebrow color="rgba(168,85,247,0.75)">What You Receive</Eyebrow>
          <div className="mt-3">
            <SectionTitle>Compensation</SectionTitle>
          </div>
          <BulletList
            items={[
              "The selected candidate will receive equity in the company, based on their role, commitment, experience, and overall value contribution to the business.",
              "Salary and other compensation details will be discussed with shortlisted candidates.",
            ]}
          />
        </motion.div>

        {/* How to apply */}
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
              style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)", lineHeight: 0.98 }}
            >
              Start your <span className="text-gradient">Application</span>
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
              Fill in the form below, or email your resume and cover letter to{" "}
              <a href={`mailto:${APPLY_EMAIL}`} className="underline underline-offset-4" style={{ color: "#00D4FF" }}>
                {APPLY_EMAIL}
              </a>
              . We encourage you to write your cover letter in your own words — tell us about your ideas,
              ambitions, and why you want to be part of MDS. We&apos;d rather hear your authentic voice than read an
              AI-generated response.
            </p>
          </div>

          <ApplicationForm />
        </motion.div>
      </div>
    </section>
  );
}
