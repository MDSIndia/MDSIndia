"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer
      className="relative py-12 md:py-16 px-4 sm:px-6 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="ambient-glow ambient-glow-cyan w-96 h-48 bottom-0 left-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/fevicon.png" alt="MDS" width={40} height={40} className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <span className="text-white/90 font-bold">Mahadeva Digital Solutions</span>
                <span className="text-white/35 text-xs block">Think Beyond</span>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Building the future of AI. Creating companions that understand, learn, and evolve with humanity.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white/50 font-semibold text-xs mb-4 tracking-widest uppercase">
              Company
            </h4>
            <ul className="space-y-3">
              {["Vision", "Noorva", "Future AI", "Careers"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="text-white/35 hover:text-white/80 text-sm transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white/50 font-semibold text-xs mb-4 tracking-widest uppercase">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-white/35">
              <li>services@mdsindia.in</li>
              <li>Hyderabad, Telangana, India</li>
              <li className="pt-2">
                <a href="#contact" className="text-cyan-400/70 hover:text-cyan-400 transition-colors">
                  Get in touch →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-white/25 text-xs">
            © 2025 Mahadeva Digital Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://in.linkedin.com/company/mahadeva-digital-solutions-private-limited"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors duration-300 text-xs"
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[0.6rem] flex-shrink-0"
                style={{ background: "#0A66C2" }}
              >
                in
              </span>
              LinkedIn
            </a>
            <p className="text-white/20 text-xs tracking-widest uppercase">Think Beyond</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
