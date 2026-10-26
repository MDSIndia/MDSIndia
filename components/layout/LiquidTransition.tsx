"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";

const COLS = 36;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* Liquid page change. A curtain of liquid rises from the bottom of the screen
   with a rippling surface, covers the page, the route changes underneath it, and
   the liquid then drains away off the top to reveal the new page.

   Internal links are intercepted in the capture phase (so Next's own <Link>
   handler never fires), the curtain is played, then router.push runs once the
   screen is covered. Hash-only links on the same page, new-tab clicks, external
   links and reduced-motion visitors are left alone. Renders one fixed SVG. */
export function LiquidTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const state = useRef({ t: 0, busy: false, pending: false, fallback: 0 });
  const pathnameRef = useRef(pathname);

  // Draw the curtain for progress t: 0 = nothing, 1 = fully covering, 2 = gone.
  // Phase 1 raises the top edge, phase 2 raises the bottom edge; the edge being
  // moved always carries a travelling ripple that is strongest mid-way.
  const draw = (t: number) => {
    const path = pathRef.current;
    const svg = svgRef.current;
    if (!path || !svg) return;
    const rising = t <= 1;
    const p = easeInOut(clamp01(rising ? t : t - 1));
    const edge = 112 - p * 124; // 112 (below the screen) → -12 (above it)
    const amp = 9 * Math.sin(Math.PI * p);
    const phase = t * 7;
    const wave = (i: number) => {
      const x = i / COLS;
      return edge + amp * (Math.sin(x * 6.2 + phase) * 0.65 + Math.sin(x * 13 - phase * 1.4) * 0.35);
    };
    let d = "";
    if (rising) {
      d = `M0,112 L0,${wave(0).toFixed(2)}`;
      for (let i = 1; i <= COLS; i++) d += ` L${((i / COLS) * 100).toFixed(2)},${wave(i).toFixed(2)}`;
      d += " L100,112 Z";
    } else {
      d = `M0,-12 L0,${wave(0).toFixed(2)}`;
      for (let i = 1; i <= COLS; i++) d += ` L${((i / COLS) * 100).toFixed(2)},${wave(i).toFixed(2)}`;
      d += " L100,-12 Z";
    }
    path.setAttribute("d", d);
    svg.style.visibility = t <= 0 || t >= 2 ? "hidden" : "visible";
  };

  const play = (from: number, to: number, duration: number, onDone?: () => void) => {
    const s = state.current;
    s.t = from;
    gsap.to(s, {
      t: to,
      duration,
      ease: "none", // draw() applies its own easing
      onUpdate: () => draw(s.t),
      onComplete: onDone,
    });
  };

  const reveal = () => {
    const s = state.current;
    if (!s.pending) return;
    s.pending = false;
    window.clearTimeout(s.fallback);
    // let the new page mount and paint behind the curtain first
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      play(1, 2, 0.85, () => {
        s.busy = false;
        draw(0);
      });
    }, 160);
  };

  // The route has changed: drain the curtain.
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    draw(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

      const s = state.current;
      e.preventDefault();
      e.stopPropagation();
      if (s.busy) return;
      s.busy = true;
      s.pending = true;
      play(0, 1, 0.75, () => {
        router.push(url.pathname + url.search + url.hash);
        // if the route never changes, don't leave the screen covered
        s.fallback = window.setTimeout(reveal, 2500);
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 10000, pointerEvents: "none", visibility: "hidden" }}
    >
      <defs>
        <linearGradient id="liquid-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#050521" />
          <stop offset="0.55" stopColor="#13104a" />
          <stop offset="1" stopColor="#0a2a6b" />
        </linearGradient>
      </defs>
      <path ref={pathRef} fill="url(#liquid-fill)" />
    </svg>
  );
}
