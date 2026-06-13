"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const navLinks = [
  { label: "Vision",   href: "#vision",    id: "vision" },
  { label: "Noorva",   href: "#noorva",    id: "noorva" },
  { label: "Future",   href: "#future-ai", id: "future-ai" },
  { label: "Invest",   href: "#invest",    id: "invest" },
  { label: "Team",     href: "#team",      id: "team" },
  { label: "Contact",  href: "#contact",   id: "contact" },
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
            background: "rgba(2, 2, 8, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
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
                  style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.42)" }}
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
              href="#noorva"
              className="px-5 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white transition-all duration-300"
              style={{
                background: "rgba(0,85,255,0.15)",
                border: "1px solid rgba(0,85,255,0.3)",
              }}
            >
              Discover Noorva
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-5 h-px bg-white/60 transition-transform duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
            <span className={`w-5 h-px bg-white/60 transition-opacity duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-px bg-white/60 transition-transform duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[99] w-64 flex flex-col justify-center p-8"
            style={{
              background: "rgba(4, 4, 16, 0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex flex-col gap-7">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.id;
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="text-xl font-light transition-colors duration-300 flex items-center gap-2"
                    style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00D4FF" }} />
                    )}
                    {link.label}
                  </motion.a>
                );
              })}
            </div>
            <a
              href="#noorva"
              className="mt-10 text-center py-3.5 rounded-2xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #0055FF, #00D4FF)" }}
              onClick={() => setMobileOpen(false)}
            >
              Discover Noorva
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
