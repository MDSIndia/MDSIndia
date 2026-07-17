"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalTransitionOverlay } from "./PortalTransitionOverlay";
import { NAVIGATE_AT_MS, TRANSITION_MS, type PortalPhase } from "./constants";

export type { PortalPhase };

interface PortalTransitionContextValue {
  phase: PortalPhase;
  trigger: (href: string) => void;
}

const PortalTransitionContext = createContext<PortalTransitionContextValue | null>(null);

export function usePortalTransition() {
  const ctx = useContext(PortalTransitionContext);
  if (!ctx) {
    throw new Error("usePortalTransition must be used within PortalTransitionProvider");
  }
  return ctx;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A short veil transition for navigating to /about-mds — intercepts
 * the click, covers the screen just long enough to hide the route
 * swap, then dissolves to reveal the destination (already loaded
 * underneath). Lives in the root layout (not a single page) since it
 * has to survive the actual navigation.
 */
export function PortalTransitionProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<PortalPhase>("idle");
  const router = useRouter();
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const trigger = useCallback(
    (href: string) => {
      if (phase !== "idle") return; // a transition is already playing
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }
      clearTimers();
      setPhase("transitioning");
      timers.current.push(
        window.setTimeout(() => router.push(href), NAVIGATE_AT_MS)
      );
      timers.current.push(
        window.setTimeout(() => setPhase("idle"), TRANSITION_MS)
      );
    },
    [phase, router, clearTimers]
  );

  useEffect(() => {
    const locked = phase !== "idle";
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    if (locked) {
      document.body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [phase]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <PortalTransitionContext.Provider value={{ phase, trigger }}>
      {children}
      {phase !== "idle" && <PortalTransitionOverlay />}
    </PortalTransitionContext.Provider>
  );
}
