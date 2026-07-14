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
 * until an instant swap at the very end.
 *
 * The cinematic canvas is mounted as soon as the gate screen shows —
 * not just once the user clicks — so its WebGL shaders compile while
 * they're reading the quote (dead time already being spent) rather
 * than as a stutter right when they enter. It stays fully invisible
 * and inert (`active={false}`) during the gate; see IntroCinematic for
 * how it resets its own timeline to zero the instant `active` flips
 * true, so this warm-up never shifts the story's actual timing. */
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
      {(phase === "gate" || phase === "cinematic" || phase === "transitioning") && (
        <IntroCinematic
          active={phase !== "gate"}
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
