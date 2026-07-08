"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageChrome } from "@/components/layout/PageChrome";
import { AboutMDSFullContent } from "@/components/sections/WhyWeExistSection";
import { StorySection } from "@/components/sections/StorySection";

export default function AboutMDSPage() {
  return (
    <PageChrome>
      <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
        <div className="scene-top-fade" />
        <div className="scene-bottom-fade" />

        <div className="relative max-w-6xl mx-auto mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase transition-all duration-300 hover:scale-105"
            style={{
              fontFamily: "var(--font-space-grotesk), Inter, sans-serif",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.80)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.16)",
              backdropFilter: "blur(16px) saturate(150%)",
              WebkitBackdropFilter: "blur(16px) saturate(150%)",
            }}
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            Back to Home
          </Link>
        </div>

        <AboutMDSFullContent />
      </section>

      <StorySection />
    </PageChrome>
  );
}
