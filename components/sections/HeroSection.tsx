"use client";
import type { CSSProperties } from "react";
import Image from "next/image";
import { Compass, ArrowUpRight } from "lucide-react";

const seeded = (index: number, salt: number) => {
  const v = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const r4 = (n: number) => Math.round(n * 10000) / 10000;

const imageDots = Array.from({ length: 55 }, (_, i) => ({
  x: r4(seeded(i, 1) * 100),
  y: r4(seeded(i, 2) * 100),
  size: r4(1.2 + seeded(i, 3) * 2.2),
  color: ["255,255,255", "220,235,255", "200,220,255"][Math.floor(seeded(i, 4) * 3)],
  opacity: r4(0.25 + seeded(i, 5) * 0.45),
  duration: r4(12 + seeded(i, 6) * 18),
  delay: r4(-seeded(i, 7) * 28),
  dx: r4((seeded(i, 8) - 0.5) * 60),
  dy: r4(-15 - seeded(i, 9) * 30),
}));

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative md:min-h-screen flex flex-col md:flex-row md:items-center md:justify-center md:gap-16"
    >
      <style>{`
        .hero-image-panel {
          width: clamp(280px, 74vw, 380px);
          aspect-ratio: 989 / 702;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .hero-image-panel {
            width: clamp(360px, 38vw, 520px);
            margin: 0;
            flex-shrink: 0;
          }
        }
      `}</style>

      {/* Left: text */}
      <div className="order-2 md:order-1 flex items-center justify-center md:justify-start px-6 sm:px-10 md:px-0 pt-10 pb-16 md:pb-0 md:pt-24">
        <div className="text-center md:text-left" style={{ maxWidth: "520px" }}>
          <h1
            className="neue-machina mb-5"
            style={{
              fontSize: "clamp(1.9rem, 3.8vw, 4.5rem)",
              lineHeight: 1.1,
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, #0055FF 70%, #00D4FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Building Products<br />that Makes an Impact
          </h1>

          <p
            className="font-semibold mb-8"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
              color: "rgba(255,255,255,0.80)",
              letterSpacing: "0.02em",
            }}
          >
            Empowering The Future Through Products
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <a
              href="#about-mds"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm uppercase transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'Neue Machina', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.03em",
                color: "#FFFFFF",
                background:
                  "linear-gradient(rgba(4,6,16,0.72), rgba(4,6,16,0.72)) padding-box, linear-gradient(135deg, #0055FF, #7B2FBE) border-box",
                border: "1.5px solid transparent",
                backdropFilter: "blur(18px) saturate(180%)",
                WebkitBackdropFilter: "blur(18px) saturate(180%)",
                boxShadow: "0 0 22px rgba(0,85,255,0.32), 0 0 48px rgba(123,47,190,0.16)",
              }}
            >
              <Compass className="size-4" strokeWidth={2.25} />
              Explore MDS
            </a>
            <a
              href="https://noorva.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm uppercase transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'Neue Machina', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.03em",
                color: "rgba(0,212,255,0.92)",
                background:
                  "linear-gradient(rgba(4,6,16,0.72), rgba(4,6,16,0.72)) padding-box, linear-gradient(135deg, #00D4FF, #0055FF) border-box",
                border: "1.5px solid transparent",
                backdropFilter: "blur(18px) saturate(180%)",
                WebkitBackdropFilter: "blur(18px) saturate(180%)",
                boxShadow: "0 0 22px rgba(0,212,255,0.28), 0 0 48px rgba(0,85,255,0.16)",
              }}
            >
              <ArrowUpRight className="size-4" strokeWidth={2.25} />
              Discover Noorva
            </a>
          </div>
        </div>
      </div>

      {/* Right: image */}
      <div className="hero-image-panel order-1 md:order-2 flex-shrink-0 pt-16 md:pt-0">
        <div className="relative w-full h-full overflow-visible">
          <div
            className="absolute inset-0"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
              WebkitMaskComposite: "source-in",
            } as CSSProperties}
          >
            <Image
              src="/rightimage.jpeg"
              alt="Hero side image"
              fill
              quality={100}
              priority
              sizes="(min-width: 768px) 400px, 300px"
              className="object-contain"
              style={{ filter: "contrast(1.1) saturate(1.18) brightness(1.04)" }}
            />
          </div>

          {/* Floating dots overlay — matches GlobalStars style */}
          {imageDots.map((dot, i) => (
            <span
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                opacity: dot.opacity,
                background: `rgba(${dot.color}, 1)`,
                boxShadow: `0 0 ${Math.max(4, dot.size * 4)}px rgba(${dot.color}, ${dot.opacity})`,
                animation: `starDrift ${dot.duration}s linear infinite, starTwinkle ${5 + (i % 6)}s ease-in-out infinite`,
                animationDelay: `${dot.delay}s, ${-(i % 7)}s`,
                "--star-dx": `${dot.dx}px`,
                "--star-dy": `${dot.dy}px`,
              } as CSSProperties}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
