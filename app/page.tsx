"use client";

import dynamic from "next/dynamic";
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
import { CareersSection } from "@/components/sections/CareersSection";
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
function GlobalDots() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} aria-hidden>
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-80px",
          backgroundImage: "radial-gradient(circle, rgba(0,85,255,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "38px 38px",
          animation: "dotsFloat1 18s linear infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-80px",
          backgroundImage: "radial-gradient(circle, rgba(123,47,190,0.13) 2px, transparent 2px)",
          backgroundSize: "68px 68px",
          backgroundPosition: "19px 19px",
          animation: "dotsFloat2 26s linear infinite reverse",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-80px",
          backgroundImage: "radial-gradient(circle, rgba(0,212,255,0.10) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          backgroundPosition: "27px 0",
          animation: "dotsFloat3 22s linear infinite",
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <CustomCursor />
      <GlobalDots />
      <SceneCanvas />

      <div className="relative min-h-screen">
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
          <CareersSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
