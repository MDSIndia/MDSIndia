"use client";

import { useCallback, useEffect, useState } from "react";

export type IntroPhase = "checking" | "gate" | "cinematic" | "transitioning" | "done";

// Holds at full brightness (~0.5s) then a slow, layered light-dissolve
// (~1.7s) — the glow itself is the transition, not a quick fade before it.
const TRANSITION_MS = 2200;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Once the user has sat through the cinematic, a later remount of the
// homepage via client-side routing (e.g. clicking "Back to Home" from
// /about-mds, which the App Router swaps without a real page load)
// should land them straight on the page instead of replaying an 11s
// intro they've already seen in this same JS runtime.
//
// This is deliberately an in-memory flag, not sessionStorage: it needs
// to survive a client-side route change (same JS runtime, module state
// untouched) but reset on an actual browser reload — sessionStorage
// survives reloads too, which meant refreshing the page never showed
// the intro again after the first time, which isn't what's wanted here.
let hasPlayedThisRuntime = false;

function hasSeenIntro() {
  return hasPlayedThisRuntime;
}

function markIntroSeen() {
  hasPlayedThisRuntime = true;
}

/**
 * Drives the cinematic intro's state machine and its side effects
 * (scroll lock). Plays in full on the first homepage mount of a
 * session; later remounts (nav back to "/") skip straight to "done".
 * Skipped entirely when the user has requested reduced motion.
 */
export function useIntro() {
  const [phase, setPhase] = useState<IntroPhase>("checking");

  useEffect(() => {
    if (prefersReducedMotion() || hasSeenIntro()) {
      setPhase("done");
    } else {
      setPhase("gate");
    }
  }, []);

  useEffect(() => {
    const locked = phase !== "checking" && phase !== "done";
    if (!locked) return;
    const html = document.documentElement;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [phase]);

  const start = useCallback(() => {
    setPhase("cinematic");
  }, []);

  const finishCinematic = useCallback(() => {
    setPhase("transitioning");
    window.setTimeout(() => {
      markIntroSeen();
      setPhase("done");
    }, TRANSITION_MS);
  }, []);

  return { phase, start, finishCinematic, transitionMs: TRANSITION_MS };
}
