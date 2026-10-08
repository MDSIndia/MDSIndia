"use client";

import { PageChrome } from "@/components/layout/PageChrome";
import { MarketOpportunityFullContent } from "@/components/sections/InvestorSection";

export default function MarketOpportunityPage() {
  return (
    <PageChrome>
      <section className="section-padding relative overflow-hidden" style={{ paddingTop: "8rem" }}>
        <div className="scene-top-fade" />
        <div className="scene-bottom-fade" />

        <MarketOpportunityFullContent />
      </section>
    </PageChrome>
  );
}
