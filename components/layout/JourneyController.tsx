"use client";

import { useEffect } from "react";
import { useJourney } from "@/hooks/useJourney";
import { getLenis } from "@/lib/lenis";
import { journey, setJourneyAnchors, setJourneyArmed, setJourneyGoTo } from "@/lib/journey";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const IN_OUT_CUBIC = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Camera travel between two milestones: gentle away from one, quicker through
// the middle, gentle into the next — but never stopping dead, so the climb
// stays continuous.
const travel = (f: number) => f - (0.7 * Math.sin(2 * Math.PI * f)) / (2 * Math.PI);

/** How far the camera keeps moving in while a section is being read (fraction of
 * the way to the next one) — it never quite stands still. */
const CREEP = 0.03;
/** Size of each section relative to the one it sits inside (the zoom per step is 1/DEPTH). */
const DEPTH = 0.2;
/** The point every section opens from: dead centre, so each one stands in the
 * middle of the screen and the camera simply goes in to it. */
const FOCUS: [number, number][] = [[0, 0]];
/** Max tilt (degrees) the stage leans into the direction of travel. */
const LEAN = 0.7;
/** Scroll distance before a tall milestone's content starts to move (fraction of screen height). */
const READ0 = 0.18;
/** How far the camera dollies into the hero artwork before it hands over to the next section. */
const ZOOM = 7;
/** How long the single-scroll dive into (and back out of) the hero takes. */
const FLY_SECONDS = 2.6;

type Panel = {
  el: HTMLElement;
  /** The first leaf's content block (measured), and every leaf's (all transformed). */
  inner: HTMLElement | null;
  inners: HTMLElement[];
  /** The door leaves: [left, right?]. */
  halves: HTMLElement[];
  /** Opens by flying the camera into its artwork instead of splitting (data-zoom). */
  zoom: boolean;
  /** How far it dives (the data-zoom value, else ZOOM). */
  zoomTo: number;
  zoomEl: HTMLElement | null;
  fadeEls: HTMLElement[];
  label: string;
  id: string;
  /** Natural content height. */
  h: number;
  /** Scale that fits the content to the screen (1 on phones — they scroll instead). */
  k: number;
  /** Extra distance (px) the content has to scroll when it is taller than the screen. */
  L: number;
  /** Scroll position where the camera arrives at this milestone. */
  a: number;
  /** Scroll distance spent at this milestone before the climb to the next. */
  hold: number;
  /** Scroll position where this milestone's content has been read to the end. */
  end: number;
  shown: boolean;
};

/* The homepage "journey": every section opens like a pair of doors onto the next.

   The page itself never moves. The section you are reading stands in the middle
   of the screen with the next one waiting behind it. The document's scroll
   distance is the timeline, and every frame the scroll position decides how far
   the doors have opened: the section splits down the middle, its left half
   sliding out to the left edge and its right half out to the right edge onto the
   open cosmos — and only then, after a breath of empty space, does the next
   section appear in the middle, a little way off, and come forward until it
   fills the screen and its own doors are waiting. The same, section after section, to the
   end. Flat 2D only. Sections taller than the screen (phones) are read by
   scrolling their content before the doors open.

   It also provides keyboard control, glides in-page links to their section, eases
   onto the nearest one if scrolling stops mid-way, and tells the navbar which
   section is on screen. Renders nothing. */
export function JourneyController() {
  const active = useJourney();

  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const stage = document.querySelector<HTMLElement>(".hscroll");
    const spacer = document.getElementById("journey-spacer");
    if (!stage || !spacer) return;

    let panels: Panel[] = [];
    let travelLen = 0;
    let raf = 0;
    let remeasure = 0;
    let idleTimer: number | undefined;
    let dir = 1;
    let lastY = window.scrollY;
    let lockUntil = 0;
    let prevC = 0;
    let prevT = performance.now();
    let scrollEndTimer: number | undefined;
    let lean = 0;
    let leanV = 0;
    let sectionId = "";
    let armed: string | null = null;

    const collect = () => {
      panels = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]")).map((el) => ({
        el,
        inner: el.querySelector<HTMLElement>(".hslide-inner, .hfooter-inner"),
        inners: [],
        halves: [],
        zoom: el.hasAttribute("data-zoom"),
        zoomTo: parseFloat(el.dataset.zoom ?? "") || ZOOM,
        zoomEl: null,
        fadeEls: [],
        label: el.dataset.label ?? "",
        id: el.closest<HTMLElement>("section[id]")?.id ?? "contact",
        h: 0,
        k: 1,
        L: 0,
        a: 0,
        hold: 0,
        end: 0,
        shown: true,
      }));
    };

    // The doors' leaves come and go (the second is only mounted for the panel on
    // stage), so look them up fresh whenever they are needed.
    const leaves = (p: Panel) => {
      p.halves = Array.from(p.el.querySelectorAll<HTMLElement>(":scope > .door-half"));
      p.inners = Array.from(p.el.querySelectorAll<HTMLElement>(".hslide-inner, .hfooter-inner"));
      if (p.zoom) {
        p.zoomEl = p.el.querySelector<HTMLElement>(".hero-city-zoom, [data-zoom-layer]");
        const fades = Array.from(p.el.querySelectorAll<HTMLElement>(".hero-fade"));
        p.fadeEls = fades.length ? fades : p.inners;
      }
    };

    const measure = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const phone = vw < 768;
      const padTop = phone ? 76 : 96;
      const padBottom = phone ? 28 : 44;
      html.style.setProperty("--jtop", `${padTop}px`);
      html.style.setProperty("--jbot", `${padBottom}px`);
      const avail = vh - padTop - padBottom;
      const minK = phone ? 1 : 0.78;
      travelLen = vh * (phone ? 1.2 : 1.45);

      let a = 0;
      const anchors: Record<string, number> = {};
      panels.forEach((p) => {
        p.el.style.display = ""; // must be laid out to be measured
        p.h = p.inner ? p.inner.offsetHeight : avail;
        p.k = p.inner ? clamp(avail / p.h, minK, 1) : 1;
        p.L = p.inner ? Math.max(0, p.h * p.k - avail) : 0;
        leaves(p);
        p.inners.forEach((n) => (n.style.transformOrigin = p.L > 0 ? "50% 0" : "50% 50%"));
        const reading = p.L > 0 ? p.L + READ0 * vh : 0;
        p.hold = reading + 0.32 * vh;
        p.a = a;
        p.end = a + reading;
        if (!(p.id in anchors)) anchors[p.id] = a;
        a += p.hold + travelLen;
        // put it back as it was before any frame is painted
        p.el.style.display = p.shown ? "" : "none";
      });
      const last = panels[panels.length - 1];
      const total = last ? last.a + last.hold + vh : vh;
      spacer.style.height = `${Math.ceil(total)}px`;
      setJourneyAnchors(anchors);
    };

    const frame = () => {
      raf = 0;
      if (!panels.length) return;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Lenis's own fractional position (window.scrollY is rounded to whole pixels, which jitters).
      const lenisNow = getLenis();
      const s = lenisNow ? lenisNow.animatedScroll : window.scrollY;

      // Which milestone's stretch of the timeline are we in?
      let i = 0;
      for (let j = panels.length - 1; j >= 0; j--) {
        if (s >= panels[j].a - 0.5) {
          i = j;
          break;
        }
      }
      const P = panels[i];
      const within = s - P.a;
      const isLast = i === panels.length - 1;

      // c = where the camera is on the path, in milestones (2.0 = at the third).
      let c: number;
      let readI = 0; // how far milestone i's content has scrolled (0..1)
      if (within <= P.hold || isLast) {
        const t = clamp(within / P.hold, 0, 1);
        c = i + CREEP * t;
        if (P.L > 0) readI = clamp((within - READ0 * vh) / P.L, 0, 1);
      } else {
        const f = clamp((within - P.hold) / travelLen, 0, 1);
        c = i + CREEP + (1 - CREEP) * travel(f);
        readI = 1;
      }

      // Only the section the camera is in and the one behind its doors are on
      // stage. t = how far along the move into the next one (0..1).
      const t = clamp(c - i, 0, 1);
      // The doors are shut while you read, and swing open between t = 0.04 and
      // 0.46 onto the empty cosmos.
      const zoomPanel = P.zoom && !isLast;
      const door = t > 0.04 && !isLast && !zoomPanel;
      const open = smooth(0.04, 0.46, t);
      // Only once they are open does the next section appear, standing in the
      // middle a little way off, and come forward to meet you.
      // (After a zoom the next section comes up out of the picture as it fades.)
      const appear = zoomPanel ? smooth(0.58, 0.9, t) : smooth(0.5, 0.78, t);
      const approach = smooth(0.5, 1, t);

      // The panel on stage gets its second door leaf.
      const armLabel = isLast || zoomPanel ? null : P.label;
      if (armLabel !== armed) {
        armed = armLabel;
        setJourneyArmed(armLabel);
      }

      panels.forEach((p, j) => {
        const live = j === i || (j === i + 1 && t > 0);
        if (!live) {
          if (p.shown) {
            p.el.style.display = "none";
            p.shown = false;
          }
          return;
        }
        if (!p.shown) {
          p.el.style.display = "";
          p.shown = true;
        }
        leaves(p);

        if (j === i && p.zoom && !isLast) {
          // The camera flies into the artwork: it pushes in toward the horizon,
          // faster and faster, the copy lifts away, and the picture dissolves into
          // the next section as we pass through it.
          const phone = vw < 768;
          const zt = smooth(0.02, 0.82, t);
          const fade = smooth(0.6, 0.92, t);
          const copy = smooth(0, 0.22, t);
          p.halves.forEach((h) => {
            h.style.transform = "";
            h.style.clipPath = "";
          });
          if (p.zoomEl) {
            // (a layer that names its own focal point — the globe — keeps it)
            if (!p.zoomEl.hasAttribute("data-keep-origin")) p.zoomEl.style.transformOrigin = phone ? "56% 47%" : "52% 49%";
            // (a layer can soften as it magnifies, so a close-up of low-res artwork reads smooth, not pixelated)
            const blur = parseFloat(p.zoomEl.dataset.zoomBlur ?? "") || 0;
            p.zoomEl.style.filter = blur && zt > 0.3 ? `blur(${(blur * zt * zt).toFixed(2)}px)` : "";
            p.zoomEl.style.transform = zt > 0.0005 ? `scale(${Math.exp(Math.log(p.zoomTo) * zt).toFixed(4)})` : "";
          }
          p.fadeEls.forEach((e) => {
            e.style.opacity = copy > 0.001 ? (1 - copy).toFixed(3) : "";
            // (panels whose copy is laid out by the journey, not a .hero-fade, only fade)
            if (e.classList.contains("hero-fade")) e.style.transform = copy > 0.001 ? `translate3d(0, ${(-copy * 36).toFixed(1)}px, 0)` : "";
          });
          p.el.style.transform = "";
          p.el.style.opacity = fade > 0.001 ? (1 - fade).toFixed(3) : "";
          p.el.style.visibility = fade >= 0.999 ? "hidden" : "";
          p.el.style.pointerEvents = t > 0.02 ? "none" : "";
          p.el.style.zIndex = "2";
        } else if (j === i) {
          // The doors: the left half of the screen slides off to the left, the
          // right half to the right, each carrying its half of the section.
          const [left, right] = p.halves;
          const shift = open * (vw / 2 + 4);
          const closed = !door || !right;
          // The clip is constant (only the transform changes per frame), so the
          // leaves are never repainted while they slide — it stays on the GPU.
          if (left) {
            left.style.transform = closed ? "" : `translate3d(${(-shift).toFixed(1)}px, 0, 0)`;
            left.style.clipPath = closed ? "" : "inset(0 50% 0 0)";
          }
          if (right) {
            right.style.visibility = door ? "visible" : "hidden";
            right.style.transform = `translate3d(${shift.toFixed(1)}px, 0, 0)`;
            right.style.clipPath = "inset(0 0 0 50%)";
          }
          p.el.style.transform = "";
          p.el.style.opacity = "";
          p.el.style.visibility = open >= 0.999 ? "hidden" : "";
          p.el.style.pointerEvents = door ? "none" : "";
          p.el.style.zIndex = "2";
        } else {
          // Behind the doors: constant in the middle.
          p.halves.forEach((h) => {
            h.style.transform = "";
            h.style.clipPath = "";
          });
          p.el.style.transform = `scale(${(0.8 + 0.2 * approach).toFixed(4)})`;
          p.el.style.opacity = appear >= 0.999 ? "" : appear.toFixed(3);
          p.el.style.visibility = "";
          p.el.style.pointerEvents = t > 0.9 ? "" : "none";
          p.el.style.zIndex = "1";
        }
        const read = j < i ? 1 : j === i ? readI : 0;
        p.inners.forEach((n) => {
          n.style.transform = `translateY(${(-read * p.L).toFixed(1)}px) scale(${p.k.toFixed(4)})`;
        });
      });

      // Camera state, shared for anything that wants to follow it.
      const now = performance.now();
      const dt = Math.max(1, now - prevT) / 1000;
      // The stage leans a hair into the direction of travel and eases back
      // upright when you stop — the inertia that makes the motion feel fluid.
      leanV = lerp(leanV, (c - prevC) / dt, 0.2);
      lean = lerp(lean, clamp(leanV * 0.9, -1, 1) * LEAN, 0.18);
      stage.style.transform = Math.abs(lean) > 0.005 ? `skewY(${lean.toFixed(3)}deg)` : "";
      if (Math.abs(lean) > 0.005 || Math.abs(leanV) > 0.01) schedule();
      journey.v = lerp(journey.v, (c - prevC) / dt, 0.25);
      journey.c = c;
      prevC = c;
      prevT = now;

      // Tell the navbar which section we're in.
      const id = panels[clamp(Math.round(c), 0, panels.length - 1)].id;
      if (id !== sectionId) {
        sectionId = id;
        html.dataset.jsection = id;
        window.dispatchEvent(new CustomEvent("journey-section", { detail: id }));
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const scrollToY = (y: number, duration: number, easing = IN_OUT_CUBIC) => {
      lockUntil = performance.now() + duration * 1000 + 250;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration, easing });
      else window.scrollTo({ top: y, behavior: "smooth" });
    };

    const currentIndex = () => {
      const s = window.scrollY;
      for (let j = panels.length - 1; j >= 0; j--) if (s >= panels[j].a - 0.5) return j;
      return 0;
    };

    // When scrolling stops while the camera is between milestones, glide it
    // onto one (carry on up once it is a little way along, else settle back).
    const settle = () => {
      if (!panels.length) return;
      if (performance.now() < lockUntil) {
        idleTimer = window.setTimeout(settle, 200);
        return;
      }
      const i = currentIndex();
      const P = panels[i];
      if (i === panels.length - 1) return;
      const within = window.scrollY - P.a;
      if (within <= P.hold) return; // resting at a milestone — leave it
      const f = (within - P.hold) / travelLen;
      const target = dir > 0 ? (f > 0.14 ? panels[i + 1].a : P.end) : f < 0.86 ? P.end : panels[i + 1].a;
      if (Math.abs(target - window.scrollY) > 2) scrollToY(target, 1.1, (t) => 1 - Math.pow(1 - t, 3));
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      // While moving, background ornaments pause so the GPU is free for the scroll.
      if (!html.classList.contains("jscrolling")) html.classList.add("jscrolling");
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => html.classList.remove("jscrolling"), 160);
      if (!unsubscribe) schedule(); // with Lenis driving, frame() already ran this tick
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(settle, 240);
    };

    const rebuild = () => {
      if (remeasure) return;
      remeasure = requestAnimationFrame(() => {
        remeasure = 0;
        measure();
        frame();
      });
    };

    // One scroll flies the whole way: from the hero (data-zoom) a single wheel
    // notch, swipe or key press plays the entire dive into the city, rather than
    // the zoom following your scroll distance. The same gesture upward from the
    // top of the next section flies back out. Everything the gesture keeps
    // producing (trackpad momentum, a long swipe) is swallowed until it lands.
    let flyUntil = 0;
    // Resting on a zoom panel (about to dive into it)…
    const atZoomStart = () => {
      const i = currentIndex();
      return !!panels[i]?.zoom && i < panels.length - 1 && window.scrollY - panels[i].a <= panels[i].hold + 2;
    };
    // …or just past one (about to fly back out of the dive).
    const atAfterZoom = () => {
      const i = currentIndex();
      return i > 0 && panels[i - 1].zoom && window.scrollY - panels[i].a < 0.12 * window.innerHeight;
    };
    const fly = (dir: 1 | -1) => {
      const i = currentIndex();
      const to = panels[dir > 0 ? i + 1 : i - 1];
      if (!to) return false;
      flyUntil = performance.now() + FLY_SECONDS * 1000 + 450;
      scrollToY(to.a, FLY_SECONDS);
      return true;
    };
    const swallow = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || !panels.length) return;
      if (performance.now() < flyUntil) return swallow(e);
      if (e.deltaY > 4 && atZoomStart()) {
        swallow(e);
        fly(1);
      } else if (e.deltaY < -4 && atAfterZoom()) {
        swallow(e);
        fly(-1);
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!panels.length) return;
      if (performance.now() < flyUntil) return swallow(e);
      const dy = (e.touches[0]?.clientY ?? touchY) - touchY;
      if (dy < -14 && atZoomStart()) {
        swallow(e);
        fly(1);
      } else if (dy > 14 && atAfterZoom()) {
        swallow(e);
        fly(-1);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = currentIndex();
      const next = () => (atZoomStart() ? fly(1) : scrollToY(panels[Math.min(panels.length - 1, i + 1)].a, 2));
      const prev = () => (atAfterZoom() ? fly(-1) : scrollToY(window.scrollY - panels[i].a > 0.2 * window.innerHeight ? panels[i].a : panels[Math.max(0, i - 1)].a, 2));
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToY(0, 2.4);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToY(panels[panels.length - 1].a, 2.4);
      }
    };

    // In-page links ("/#team", "#invest"): climb there instead of jumping.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = panels.find((p) => p.id === id || p.el.id === id);
      if (!target) return;
      e.preventDefault();
      const first = panels.find((p) => p.id === target.id) ?? target;
      scrollToY(first.a, 2.6);
      history.replaceState(null, "", url.hash);
    };

    // A thicker, more liquid glide for the smooth-scroller while the journey runs
    // (lower lerp = the scroll lags further behind the wheel and settles slower).
    let savedLerp: number | undefined;
    const soften = () => {
      const l = getLenis();
      if (l && savedLerp === undefined) {
        savedLerp = l.options.lerp;
        l.options.lerp = 0.075;
      }
    };
    // Draw in the same tick Lenis moves the scroll. The window "scroll" event
    // arrives a frame later, which made the panels trail the glide and judder.
    let unsubscribe: (() => void) | undefined;
    const onLenis = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      frame();
    };
    const hook = () => {
      const l = getLenis();
      if (l && !unsubscribe) unsubscribe = l.on("scroll", onLenis);
    };
    soften();
    hook();
    const softenTimers = [50, 300, 1000].map((ms) =>
      window.setTimeout(() => {
        soften();
        hook();
      }, ms)
    );

    collect();
    measure();
    frame();
    setJourneyGoTo((y, duration = 2.4) => scrollToY(y, duration));
    const ro = new ResizeObserver(rebuild);
    panels.forEach((p) => p.inner && ro.observe(p.inner));
    const late = window.setTimeout(rebuild, 800);
    document.fonts?.ready.then(rebuild).catch(() => {});
    window.addEventListener("resize", rebuild);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    // capture + non-passive: these must reach us before Lenis / native scrolling do
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    document.addEventListener("click", onClick);

    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(late);
      if (raf) cancelAnimationFrame(raf);
      if (remeasure) cancelAnimationFrame(remeasure);
      ro.disconnect();
      window.removeEventListener("resize", rebuild);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      document.removeEventListener("click", onClick);
      setJourneyGoTo(null);
      softenTimers.forEach((t) => window.clearTimeout(t));
      unsubscribe?.();
      const l = getLenis();
      if (l && savedLerp !== undefined) l.options.lerp = savedLerp;
      window.clearTimeout(scrollEndTimer);
      html.classList.remove("jscrolling");
      stage.style.transform = "";
      html.style.removeProperty("--jtop");
      html.style.removeProperty("--jbot");
      delete html.dataset.jsection;
      setJourneyAnchors({});
      spacer.style.height = "";
      panels.forEach((p) => {
        p.el.style.display = "";
        p.el.style.transform = "";
        p.el.style.transformOrigin = "";
        p.el.style.opacity = "";
        p.el.style.pointerEvents = "";
        p.el.style.zIndex = "";
        p.el.style.visibility = "";
        p.halves.forEach((h) => {
          h.style.transform = "";
          h.style.clipPath = "";
          h.style.visibility = "";
        });
        if (p.zoomEl) {
          p.zoomEl.style.transform = "";
          p.zoomEl.style.filter = "";
          p.zoomEl.style.transformOrigin = "";
        }
        p.fadeEls.forEach((e) => {
          e.style.opacity = "";
          if (e.classList.contains("hero-fade")) e.style.transform = "";
        });
        p.inners.forEach((n) => {
          n.style.transform = "";
          n.style.transformOrigin = "";
        });
      });
      setJourneyArmed(null);
    };
  }, [active]);

  return null;
}
