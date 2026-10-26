"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/* The homepage is a scroll-driven journey: the page stays still while the
   camera flies through a line of full-screen panels (see JourneyController).
   This provider decides when that is on — the homepage only, and not for
   visitors who ask their system for reduced motion, who get the ordinary
   stacked page — and sets the `jmode` class on <html>, which all the journey
   layout CSS hangs off. It runs on phones and desktops alike. */
const JourneyContext = createContext(false);

/** Master switch. Off = the homepage is an ordinary vertically-scrolling page (the
 * journey code stays in place, dormant). */
const JOURNEY_ENABLED = false;

export function useJourney() {
  return useContext(JourneyContext);
}

export function JourneyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [journey, setJourney] = useState(false);

  // Layout effect so the class is on <html> before any child's passive
  // effect reads the layout, and before the first paint.
  useLayoutEffect(() => {
    if (!JOURNEY_ENABLED || pathname !== "/") {
      setJourney(false);
      return;
    }
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setJourney(!mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [pathname]);

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("jmode", journey);
    return () => html.classList.remove("jmode");
  }, [journey]);

  return <JourneyContext.Provider value={journey}>{children}</JourneyContext.Provider>;
}
