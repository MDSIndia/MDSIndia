"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

export { gsap, ScrollTrigger };

export const EASES = {
  smooth: "power3.out",
  bouncy: "back.out(1.7)",
  elastic: "elastic.out(1, 0.3)",
  cinematic: "expo.out",
};

export function createScrollReveal(
  element: string | Element,
  options: gsap.TweenVars = {}
) {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 60, ...options.from },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: EASES.smooth,
      ...options,
    }
  );
}
