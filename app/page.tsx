"use client";

import { PageChrome } from "@/components/layout/PageChrome";
import { IntroOverlay } from "@/components/Intro/IntroOverlay";
import { useIntro } from "@/hooks/useIntro";
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
  const { phase, start, finishCinematic, transitionMs } = useIntro();

  // The homepage chrome mounts partway through the transition (under the
  // still-opaque bloom overlay) so it has time to paint before it's
  // revealed, and so Hero's own entrance animations play in sync with
  // the reveal rather than having already finished off-screen.
  const showOverlay = phase !== "done";
  const showChrome = phase === "transitioning" || phase === "done";

  return (
    <>
      {showOverlay && (
        <IntroOverlay
          phase={phase}
          onStart={start}
          onCinematicComplete={finishCinematic}
          transitionMs={transitionMs}
        />
      )}
      {showChrome && (
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
      )}
    </>
  );
}
