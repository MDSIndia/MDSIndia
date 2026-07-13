"use client";

import type { IntroPhase } from "@/hooks/useIntro";
import { IntroStart } from "./IntroStart";
import { IntroCinematic } from "./IntroCinematic";
import { IntroTransition } from "./IntroTransition";

/** Orchestrates the three intro stages (start prompt -> cinematic ->
 * light-transition hand-off) inside a single fullscreen layer that sits
 * above the homepage. No hardcoded opaque backdrop here: during
 * "gate"/"cinematic" the page body's own black background already
 * shows through (nothing else is mounted yet), and during
 * "transitioning" the cinematic itself fades to transparent — see
 * IntroCinematic — so the real homepage underneath can be gradually
 * revealed through the glow, rather than hidden behind an opaque frame
 * until an instant swap at the very end. */
export function IntroOverlay({
  phase,
  onStart,
  onCinematicComplete,
  transitionMs,
}: {
  phase: IntroPhase;
  onStart: () => void;
  onCinematicComplete: () => void;
  transitionMs: number;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 100000 }}>
      {phase === "gate" && <IntroStart onStart={onStart} visible />}
      {(phase === "cinematic" || phase === "transitioning") && (
        <IntroCinematic
          onComplete={onCinematicComplete}
          dissolveMs={transitionMs}
        />
      )}
      {phase === "transitioning" && (
        <IntroTransition durationMs={transitionMs} />
      )}
    </div>
  );
}
