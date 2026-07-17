"use client";

import { IntroTransition } from "@/components/Intro/IntroTransition";
import { TRANSITION_MS } from "./constants";

/** The transition itself: a fullscreen veil above all page content
 * (same fixed/high-z-index convention as the main intro's own
 * overlay), reusing the exact glow-dissolve technique from the site's
 * first-load intro hand-off (see IntroTransition) so this reads as the
 * same visual language, just much shorter — a quick "hold, then
 * dissolve" rather than a multi-second cinematic. */
export function PortalTransitionOverlay() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 100000 }}>
      <IntroTransition durationMs={TRANSITION_MS} />
    </div>
  );
}
