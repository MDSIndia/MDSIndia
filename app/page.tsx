"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { StorySection } from "@/components/sections/StorySection";
import { WhyWeExistSection } from "@/components/sections/WhyWeExistSection";
import { VisionSection } from "@/components/sections/VisionSection";
import { NoorvaSection } from "@/components/sections/NoorvaSection";
import { HowNoorvaWorksSection } from "@/components/sections/HowNoorvaWorksSection";
import { FutureAISection } from "@/components/sections/FutureAISection";
import { InvestorSection } from "@/components/sections/InvestorSection";
import { TeamSection } from "@/components/sections/TeamSection";
import { ContactSection } from "@/components/sections/ContactSection";

const CustomCursor = dynamic(
  () => import("@/components/shared/CustomCursor").then((m) => ({ default: m.CustomCursor })),
  { ssr: false }
);

const SceneCanvas = dynamic(
  () => import("@/components/three/SceneCanvas").then((m) => ({ default: m.SceneCanvas })),
  { ssr: false }
);

/* Animated dot grid — fixed behind everything */
const seeded = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const starPalette = ["255,255,255", "220,235,255", "200,220,255", "255,255,255"];

const GlobalStars = dynamic(
  () => Promise.resolve(() => {
    const stars = Array.from({ length: 90 }, (_, index) => {
      const size = 1.6 + seeded(index, 3) * 2.8;
      const color = starPalette[Math.floor(seeded(index, 4) * starPalette.length)];
      return {
        x: seeded(index, 1) * 100,
        y: seeded(index, 2) * 100,
        size,
        color,
        opacity: 0.28 + seeded(index, 5) * 0.42,
        duration: 12 + seeded(index, 6) * 18,
        delay: -seeded(index, 7) * 28,
        dx: (seeded(index, 8) - 0.5) * 72,
        dy: -18 - seeded(index, 9) * 38,
      };
    });
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden>
        {stars.map((star, index) => (
          <span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              background: `rgba(${star.color}, 1)`,
              boxShadow: `0 0 ${Math.max(5, star.size * 5)}px rgba(${star.color}, ${star.opacity})`,
              animation: `starDrift ${star.duration}s linear infinite, starTwinkle ${5 + (index % 6)}s ease-in-out infinite`,
              animationDelay: `${star.delay}s, ${-(index % 7)}s`,
              "--star-dx": `${star.dx}px`,
              "--star-dy": `${star.dy}px`,
            } as CSSProperties}
          />
        ))}
      </div>
    );
  }),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <CustomCursor />
      <GlobalStars />
      <SceneCanvas />

      <div className="relative min-h-screen" style={{ zIndex: 1 }}>
        <Navbar />
        <main>
          <HeroSection />
          <WhyWeExistSection />
          <StorySection />
          <VisionSection />
          <NoorvaSection />
          <HowNoorvaWorksSection />
          <FutureAISection />
          <InvestorSection />
          <TeamSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
