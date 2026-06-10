"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12 md:py-16 px-4 sm:px-6 overflow-hidden">
      {/* Ambient glow — radial gradient, no blur */}
      <div className="ambient-glow ambient-glow-cyan w-96 h-48 bottom-0 left-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/fevicon.png" alt="MDS" width={40} height={40} className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <span className="text-white font-bold">Mahadeva Digital Solutions</span>
                <span className="text-white/40 text-xs block">Think Beyond</span>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Building the future of AI. Creating companions that understand, learn, and evolve with humanity.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4 tracking-wider uppercase">
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Vision", "Noorva", "Careers"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-white/40 hover:text-white text-sm transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4 tracking-wider uppercase">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li>services@mdsindia.in</li>
              <li>Hyderabad, Telangana, India</li>
              <li className="pt-2">
                <a href="#contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Get in touch →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs">
            © 2025 Mahadeva Digital Solutions. All rights reserved.
          </p>
          <p className="text-white/20 text-xs tracking-widest uppercase">Think Beyond</p>
        </div>
      </div>
    </footer>
  );
}
