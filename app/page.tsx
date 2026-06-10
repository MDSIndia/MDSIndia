"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { StorySection } from "@/components/sections/StorySection";
import { VisionSection } from "@/components/sections/VisionSection";
import { NoorvaSection } from "@/components/sections/NoorvaSection";
import { HowNoorvaWorksSection } from "@/components/sections/HowNoorvaWorksSection";
import { FutureAISection } from "@/components/sections/FutureAISection";
import { InvestorSection } from "@/components/sections/InvestorSection";
import { CareersSection } from "@/components/sections/CareersSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { FinalSection } from "@/components/sections/FinalSection";

const CustomCursor = dynamic(
  () => import("@/components/shared/CustomCursor").then((m) => ({ default: m.CustomCursor })),
  { ssr: false }
);

// Single Three.js canvas for the entire site
const SceneCanvas = dynamic(
  () => import("@/components/three/SceneCanvas").then((m) => ({ default: m.SceneCanvas })),
  { ssr: false }
);

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      <CustomCursor />

      {/* One global 3D canvas, fixed behind all content */}
      <SceneCanvas />

      <div
        className="relative min-h-screen"
        style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s ease" }}
      >
        <Navbar />
        <main>
          <HeroSection />
          <StorySection />
          <VisionSection />
          <NoorvaSection />
          <HowNoorvaWorksSection />
          <FutureAISection />
          <InvestorSection />
          <CareersSection />
          <ContactSection />
          <FinalSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
