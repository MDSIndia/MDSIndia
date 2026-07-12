"use client";

import { PageChrome } from "@/components/layout/PageChrome";
import { HeroSection } from "@/components/sections/HeroSection";
import { WhyWeExistSection } from "@/components/sections/WhyWeExistSection";
import { VisionSection } from "@/components/sections/VisionSection";
import { NoorvaSection } from "@/components/sections/NoorvaSection";
import { HowNoorvaWorksSection } from "@/components/sections/HowNoorvaWorksSection";
import { FutureAISection } from "@/components/sections/FutureAISection";
import { InvestorSection } from "@/components/sections/InvestorSection";
import { TeamSection } from "@/components/sections/TeamSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <PageChrome>
      <HeroSection />
      <VisionSection />
      <WhyWeExistSection />
      <NoorvaSection />
      <HowNoorvaWorksSection />
      <FutureAISection />
      <InvestorSection />
      <TeamSection />
      <ContactSection />
    </PageChrome>
  );
}
