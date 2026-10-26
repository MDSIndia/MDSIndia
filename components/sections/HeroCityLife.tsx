"use client";

import { useEffect, useRef } from "react";
import { CITY } from "./heroCityData";

/* A quiet layer of life over the hero artwork: the city's warm windows and
   street lights twinkle, a few cars travel along its roads, and the setting sun
   breathes. One small 2D canvas, drawn at ~30fps with additive light sprites; it
   sleeps whenever the hero isn't on screen (or the tab is hidden), and shows a
   single still frame for visitors who prefer reduced motion.

   The artwork's light and road positions (heroCityData.ts) are in the image's own
   pixels, so they are mapped onto the screen with the same `object-fit: cover` crop
   the <Image> gets — pass the same `position` you gave it. */

type Variant = "desktop" | "mobile";

const SUN: Record<Variant, [number, number]> = { desktop: [828, 412], mobile: [533, 738] };

const seeded = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function makeSprite(rgb: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.45)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

type Car = { road: number; speed: number; offset: number; dir: 1 | -1; sprite: 0 | 1 | 2 };

export function HeroCityLife({
  variant,
  position,
  reducedMotion,
  className = "",
}: {
  variant: Variant;
  /** The image's object-position as fractions [x, y]. */
  position: [number, number];
  reducedMotion: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const data = CITY[variant];
    const warm = makeSprite("255,205,130");
    const white = makeSprite("255,244,225");
    const red = makeSprite("255,70,60");
    const sunSprite = makeSprite("255,170,80");
    const sprites = [white, warm, red];

    // road geometry: cumulative lengths so a car can be placed by distance
    const roads = data.roads.map((pts) => {
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, cum, len: cum[cum.length - 1] };
    });
    const at = (r: (typeof roads)[number], u: number): [number, number] => {
      const d = u * r.len;
      let i = 1;
      while (i < r.cum.length - 1 && r.cum[i] < d) i++;
      const f = (d - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1);
      return [r.pts[i - 1][0] + (r.pts[i][0] - r.pts[i - 1][0]) * f, r.pts[i - 1][1] + (r.pts[i][1] - r.pts[i - 1][1]) * f];
    };

    const cars: Car[] = [];
    roads.forEach((_, ri) => {
      const n = 4;
      for (let k = 0; k < n; k++) {
        const s = ri * 10 + k;
        const dir = k % 2 === 0 ? 1 : -1;
        cars.push({
          road: ri,
          dir,
          speed: 1 / (16 + seeded(s, 1) * 14), // end to end in 16–30s
          offset: seeded(s, 2),
          sprite: dir === 1 ? (seeded(s, 3) > 0.5 ? 0 : 1) : 2, // headlights one way, tail lights the other
        });
      }
    });

    const twinkle = data.lights.map((_, i) => ({
      speed: 0.5 + seeded(i, 4) * 1.6,
      phase: seeded(i, 5) * Math.PI * 2,
      depth: 0.35 + seeded(i, 6) * 0.65,
    }));

    let W = 0;
    let H = 0;
    let dpr = 1;
    let k = 1;
    let offX = 0;
    let offY = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, variant === "mobile" ? 1.5 : 1.5);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      k = Math.max(W / data.w, H / data.h);
      offX = (W - data.w * k) * position[0];
      offY = (H - data.h * k) * position[1];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const glow = (sprite: HTMLCanvasElement, x: number, y: number, size: number, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    };

    const draw = (t: number) => {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // the setting sun breathes
      const [sx, sy] = SUN[variant];
      glow(sunSprite, offX + sx * k, offY + sy * k, 260 * k, 0.1 + 0.05 * Math.sin(t * 0.35));

      // windows and street lights
      for (let i = 0; i < data.lights.length; i++) {
        const [x, y, s] = data.lights[i];
        const tw = twinkle[i];
        const on = 0.5 + 0.5 * Math.sin(t * tw.speed + tw.phase);
        const a = 0.12 + 0.5 * tw.depth * on;
        glow(warm, offX + x * k, offY + y * k, (5 + s * 0.8) * Math.max(0.9, k * 1.2), a);
      }

      // traffic
      for (const c of cars) {
        const r = roads[c.road];
        let u = (c.offset + t * c.speed) % 1;
        if (c.dir === -1) u = 1 - u;
        const edge = Math.min(1, Math.min(u, 1 - u) / 0.1); // fade in/out at the ends
        const [x, y] = at(r, u);
        const px = offX + x * k;
        const py = offY + y * k;
        const size = 9 * Math.max(0.9, k * 1.3);
        glow(sprites[c.sprite], px, py, size, 0.7 * edge);
        // a short trail behind it
        const [bx, by] = at(r, Math.max(0, Math.min(1, u - c.dir * 0.012)));
        glow(sprites[c.sprite], offX + bx * k, offY + by * k, size * 0.7, 0.35 * edge);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    if (reducedMotion) {
      draw(2);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = 0;
    let frames = 0;
    let visible = true;
    const html = document.documentElement;
    const start = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return; // ~30fps is plenty for ambient motion
      last = now;
      // every so often re-check that the hero is actually showing (the journey hides
      // panels with display/visibility, which an IntersectionObserver can't see)
      if (frames++ % 15 === 0) {
        visible = !document.hidden && (canvas.checkVisibility ? canvas.checkVisibility({ checkVisibilityCSS: true } as never) : canvas.offsetParent !== null);
      }
      if (!visible || html.classList.contains("jscrolling")) return;
      draw((now - start) / 1000);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant, position, reducedMotion]);

  return <canvas ref={ref} aria-hidden className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
}
