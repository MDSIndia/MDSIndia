"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const navLinks = [
  { label: "Vision",   href: "#vision" },
  { label: "Noorva",   href: "#noorva" },
  { label: "Future",   href: "#future-ai" },
  { label: "Invest",   href: "#invest" },
  { label: "Contact",  href: "#contact" },
];

export function Navbar() {
  const progress = useScrollProgress();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setScrolled(progress > 0.02);
  }, [progress]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, delay: 3.2, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
          scrolled ? "py-2.5" : "py-4"
        }`}
      >
        {/* Glassmorphism backdrop — only visible when scrolled */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "rgba(5, 5, 5, 0.70)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center group">
            <Image
              src="/name_logo.png"
              alt="Mahadeva Digital Solutions"
              width={160}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </a>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-white/40 hover:text-white/90 text-sm font-medium tracking-wide transition-colors duration-400 group py-1"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-cyan-400 to-blue-500 w-0 group-hover:w-full transition-all duration-500 ease-out" />
              </a>
            ))}
          </nav>

          {/* Primary CTA only — minimal */}
          <div className="hidden md:flex items-center">
            <a
              href="#noorva"
              className="px-5 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.03)" }}
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
        <div className="absolute bottom-0 left-0 h-px w-full" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div
            className="h-full bg-gradient-to-r from-cyan-400/60 to-blue-600/60 transition-all duration-100"
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
              background: "rgba(5,5,5,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex flex-col gap-7">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="text-xl font-light text-white/50 hover:text-white transition-colors duration-300"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
            <a
              href="#noorva"
              className="mt-10 text-center py-3.5 rounded-2xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #00E5FF)" }}
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
