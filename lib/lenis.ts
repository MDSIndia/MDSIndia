"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;
let tick: ((time: number) => void) | null = null;

export function getLenis() {
  return lenisInstance;
}

export function initLenis() {
  if (typeof window === "undefined") return null;

  const lenis = new Lenis({
    // Smooth, responsive glide: no fixed duration/easing, so every wheel notch
    // pulls the scroll position along by exponential damping (lerp) and it
    // eases to a stop. Lower lerp = floatier but laggier; 0.1 keeps it snappy.
    lerp: 0.085,
    smoothWheel: true,
    touchMultiplier: 2,
  });

  lenisInstance = lenis;

  // Sync with GSAP ScrollTrigger
  lenis.on("scroll", ScrollTrigger.update);
  tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyLenis() {
  if (tick) {
    gsap.ticker.remove(tick);
    tick = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
