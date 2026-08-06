"use client";

import { PageChrome } from "@/components/layout/PageChrome";
import { AboutMDSFullContent } from "@/components/sections/WhyWeExistSection";
import { StorySection } from "@/components/sections/StorySection";

export default function AboutMDSPage() {
  return (
    <PageChrome>
      <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
        <div className="scene-top-fade" />
        <div className="scene-bottom-fade" />

        <AboutMDSFullContent />
      </section>

      <StorySection />
    </PageChrome>
  );
}
