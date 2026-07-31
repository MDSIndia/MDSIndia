"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageChrome } from "@/components/layout/PageChrome";
import { MarketOpportunityFullContent } from "@/components/sections/InvestorSection";

export default function MarketOpportunityPage() {
  return (
    <PageChrome>
      <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
        <div className="scene-top-fade" />
        <div className="scene-bottom-fade" />

        <div className="relative max-w-6xl mx-auto mb-10">
          <Link href="/#invest" className="btn-secondary group text-sm">
            <ArrowLeft
              className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
              strokeWidth={2.25}
            />
            Back to Home
          </Link>
        </div>

        <MarketOpportunityFullContent />
      </section>
    </PageChrome>
  );
}
