"use client";

import { useEffect, useRef } from "react";
import { initLenis, destroyLenis } from "@/lib/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = initLenis();
    return () => {
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
