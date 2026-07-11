"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const navLinks = [
  { label: "Vision",     href: "#vision",     id: "vision" },
  { label: "About MDS",  href: "#about-mds",  id: "about-mds" },
  { label: "Noorva",     href: "#noorva",     id: "noorva" },
  { label: "Future",     href: "#future-ai",  id: "future-ai" },
  { label: "Invest",     href: "#invest",     id: "invest" },
  { label: "Team",       href: "#team",       id: "team" },
  { label: "Contact",    href: "#contact",    id: "contact" },
];

export function Navbar() {
  const progress = useScrollProgress();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    setScrolled(progress > 0.02);
  }, [progress]);

  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.id);
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
          scrolled ? "py-2.5" : "py-4"
        }`}
      >
        {/* Glassmorphism backdrop */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "rgba(8, 8, 20, 0.55)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <Image
              src="/fevicon.png"
              alt="MDS"
              width={40}
              height={40}
              className="w-9 h-9 rounded-xl object-contain"
              style={{ filter: "brightness(1.4) drop-shadow(0 0 12px rgba(0,212,255,0.6))" }}
              priority
            />
          </a>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative text-sm font-medium tracking-wide transition-colors duration-300 group py-1"
                  style={{ fontFamily: "var(--font-space-grotesk), Inter, sans-serif", color: isActive ? "#fff" : "rgba(255,255,255,0.55)" }}
                >
                  {link.label}
                  {/* Active indicator */}
                  <span
                    className="absolute -bottom-0.5 left-0 h-px transition-all duration-500 ease-out"
                    style={{
                      width: isActive ? "100%" : "0%",
                      background: "linear-gradient(to right, #0055FF, #00D4FF)",
                    }}
                  />
                  {/* Hover fallback underline */}
                  {!isActive && (
                    <span className="absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-blue-500/50 to-cyan-400/50 w-0 group-hover:w-full transition-all duration-500 ease-out" />
                  )}
                  {/* Active dot */}
                  {isActive && (
                    <span
                      className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#00D4FF", boxShadow: "0 0 6px #00D4FF" }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Primary CTA */}
          <div className="hidden md:flex items-center">
            <a
              href="https://noorva.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-full text-sm font-medium hover:text-white transition-all duration-300"
              style={{
                fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                background: "rgba(0,85,255,0.16)",
                border: "1px solid rgba(0,153,255,0.35)",
                backdropFilter: "blur(12px) saturate(160%)",
                WebkitBackdropFilter: "blur(12px) saturate(160%)",
                color: "rgba(255,255,255,0.88)",
              }}
            >
              Discover Noorva
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden flex items-center justify-center rounded-full transition-transform duration-300 hover:scale-105"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              width: 42,
              height: 42,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(14px) saturate(160%)",
              WebkitBackdropFilter: "blur(14px) saturate(160%)",
            }}
          >
            {mobileOpen ? (
              <X className="size-[18px] text-white" strokeWidth={2} />
            ) : (
              <Menu className="size-[18px] text-white" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Scroll progress bar */}
        <div className="absolute bottom-0 left-0 h-px w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full bg-gradient-to-r from-blue-500/70 to-cyan-400/70 transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </motion.nav>

      {/* Mobile Menu — glass dropdown card */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed left-4 right-4 z-[99] rounded-[28px] overflow-hidden"
            style={{
              top: "5.5rem",
              background: "rgba(10, 10, 24, 0.72)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex flex-col px-7 py-6">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.id;
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2.5 py-3 text-sm uppercase transition-colors duration-300"
                    style={{
                      fontFamily: "'Neue Machina', 'Inter', sans-serif",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: isActive ? "#fff" : "rgba(255,255,255,0.62)",
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00D4FF", boxShadow: "0 0 6px #00D4FF" }} />
                    )}
                    {link.label}
                  </motion.a>
                );
              })}

              <a
                href="https://noorva.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-center py-3.5 rounded-2xl text-sm font-medium text-white"
                style={{
                  fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
                  background: "linear-gradient(135deg, rgba(0,85,255,0.38), rgba(0,212,255,0.30))",
                  border: "1px solid rgba(0,212,255,0.35)",
                  backdropFilter: "blur(16px) saturate(180%)",
                  WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                }}
                onClick={() => setMobileOpen(false)}
              >
                Discover Noorva
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
