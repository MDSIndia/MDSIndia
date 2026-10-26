"use client";

import { useEffect, useRef } from "react";
import { initLenis, destroyLenis } from "@/lib/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Refreshing always starts from the top: switch off the browser's scroll
// restoration as soon as this module loads (before hydration, so the browser
// can't restore a position first).
if (typeof window !== "undefined") {
  history.scrollRestoration = "manual";
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    history.scrollRestoration = "manual";

    // A reload with a "#section" in the URL would fly to that section; drop it
    // so a refresh lands at the start.
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload" && window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);

    // Leave the page scrolled to the top so the browser has nothing to restore.
    const toTop = () => window.scrollTo(0, 0);
    window.addEventListener("beforeunload", toTop);
    window.addEventListener("pagehide", toTop);

    initLenis();
    return () => {
      window.removeEventListener("beforeunload", toTop);
      window.removeEventListener("pagehide", toTop);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
