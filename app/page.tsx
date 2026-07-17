"use client";

import { startTransition, useEffect, useState } from "react";
import { PageChrome } from "@/components/layout/PageChrome";
import { IntroOverlay } from "@/components/Intro/IntroOverlay";
import { useIntro } from "@/hooks/useIntro";
import { getLenis } from "@/lib/lenis";
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
  const [showChrome, setShowChrome] = useState(false);

  // The homepage — Navbar, Footer, nine sections, its own Three.js
  // scene — mounts right as the light-veil starts clearing, so Hero's
  // entrance animation plays in sync with the reveal instead of having
  // already finished off-screen. That's a large synchronous commit
  // though, and doing it as a normal urgent update caused a visible
  // stutter right when the reveal became visible. Wrapping it in
  // startTransition marks it as interruptible: React can yield to the
  // browser mid-mount instead of blocking a frame for the whole tree,
  // which is the actual fix — moving *when* it mounts (tried first)
  // just relocated the same blocking cost onto the cinematic instead.
  useEffect(() => {
    if (phase === "transitioning" || phase === "done") {
      startTransition(() => setShowChrome(true));
    }
  }, [phase]);

  // Landing here with a URL hash (e.g. "Back to Home" from /about-mds
  // linking to "/#about-mds") needs an explicit scroll: the browser's
  // own automatic hash-scroll fires on navigation, well before
  // PageChrome (and the section it's targeting) has actually mounted
  // — deliberately deferred above via startTransition — so it finds
  // nothing and silently gives up. Once the real content exists, hand
  // off to Lenis so this scroll matches the smoothing/easing of every
  // other scroll on the site instead of a native instant jump.
  useEffect(() => {
    if (!showChrome) return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el);
      else el.scrollIntoView({ behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [showChrome]);

  const showOverlay = phase !== "done";

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
