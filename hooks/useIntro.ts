"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
 * (scroll lock, synthesized cinematic audio). Plays in full on the
 * first homepage mount of a session; later remounts (nav back to "/")
 * skip straight to "done". Skipped entirely when the user has
 * requested reduced motion.
 */
export function useIntro() {
  const [phase, setPhase] = useState<IntroPhase>("checking");
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // Synthesized cinematic swell (riser + filtered wind noise) — no audio
  // asset required, and only ever created from within a user gesture so
  // it satisfies autoplay-unlock requirements. Fails silently if the
  // Web Audio API is unavailable or blocked.
  const playCinematicAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioCtxRef.current ?? new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const duration = 9.2;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.16, now + 0.6);
      master.gain.linearRampToValueAtTime(0.2, now + duration - 1);
      master.gain.linearRampToValueAtTime(0, now + duration);
      master.connect(ctx.destination);

      const riser = ctx.createOscillator();
      riser.type = "sawtooth";
      riser.frequency.setValueAtTime(55, now);
      riser.frequency.exponentialRampToValueAtTime(210, now + duration - 0.8);
      const riserGain = ctx.createGain();
      riserGain.gain.value = 0.5;
      riser.connect(riserGain).connect(master);

      const noiseBuffer = ctx.createBuffer(
        1,
        ctx.sampleRate * 2,
        ctx.sampleRate
      );
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + duration - 0.8);
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.3;
      noise.connect(filter).connect(noiseGain).connect(master);

      riser.start(now);
      riser.stop(now + duration);
      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Audio is a nice-to-have; silently continue without it.
    }
  }, []);

  const start = useCallback(() => {
    playCinematicAudio();
    setPhase("cinematic");
  }, [playCinematicAudio]);

  const finishCinematic = useCallback(() => {
    setPhase("transitioning");
    window.setTimeout(() => {
      markIntroSeen();
      setPhase("done");
    }, TRANSITION_MS);
  }, []);

  return { phase, start, finishCinematic, transitionMs: TRANSITION_MS };
}
