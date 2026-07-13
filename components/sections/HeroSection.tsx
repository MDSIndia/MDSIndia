"use client";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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

/* Sparks radiating outward from the energy ball in the hero artwork */
const BALL_X = 50.9;
const BALL_Y = 48;
const ballSparks = Array.from({ length: 22 }, (_, i) => {
  const angle = seeded(i, 21) * Math.PI * 2;
  const dist = 60 + seeded(i, 22) * 110;
  return {
    dx: r4(Math.cos(angle) * dist),
    dy: r4(Math.sin(angle) * dist),
    size: r4(2 + seeded(i, 23) * 2.5),
    duration: r4(1.8 + seeded(i, 24) * 2),
    delay: r4(-seeded(i, 25) * 4),
  };
});

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
        @keyframes ballSpark {
          0% { transform: translate(-50%, -50%) translate(0, 0) scale(0.4); opacity: 0; }
          18% { opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--spark-dx), var(--spark-dy)) scale(1); opacity: 0; }
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

          <motion.div
            className="absolute inset-0"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
              WebkitMaskComposite: "source-in",
            } as CSSProperties}
            initial={{ opacity: 0, scale: 0.88, filter: "blur(16px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
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
          </motion.div>

          {/* Rotating energy ring over the ball — outer wrapper is a plain, never-animated
              div that only handles centering; framer-motion only ever touches the inner
              child, so the spin can never drift off that fixed anchor point. */}
          <div
            className="absolute pointer-events-none rounded-full overflow-hidden"
            style={{
              left: `${BALL_X}%`,
              top: `${BALL_Y}%`,
              width: "34%",
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
              maskImage: "radial-gradient(circle, transparent 58%, black 64%, black 90%, transparent 96%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 58%, black 64%, black 90%, transparent 96%)",
            }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(90,180,255,0.16) 0%, rgba(150,220,255,0.9) 8%, rgba(90,180,255,0.16) 20%, rgba(90,180,255,0.16) 50%, rgba(150,220,255,0.75) 58%, rgba(90,180,255,0.16) 70%, rgba(90,180,255,0.16) 100%)",
                mixBlendMode: "screen",
                filter: "blur(1px)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${BALL_X}%`,
              top: `${BALL_Y}%`,
              width: "22%",
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              style={{ border: "1px solid rgba(0,212,255,0.35)" }}
              animate={{ rotate: -360, scale: [1, 1.06, 1] }}
              transition={{
                rotate: { duration: 14, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          </div>

          {/* Sparks radiating outward from the ball */}
          {ballSparks.map((spark, i) => (
            <span
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${BALL_X}%`,
                top: `${BALL_Y}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                background: "#BFEFFF",
                boxShadow: `0 0 ${spark.size * 5}px rgba(140,220,255,0.9)`,
                animation: `ballSpark ${spark.duration}s ease-out infinite`,
                animationDelay: `${spark.delay}s`,
                "--spark-dx": `${spark.dx}px`,
                "--spark-dy": `${spark.dy}px`,
              } as CSSProperties}
            />
          ))}

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
