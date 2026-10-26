"use client";

import { useEffect, useRef } from "react";
import { CITY } from "./heroCityData";

/* A quiet layer of life over the hero artwork: the clouds in the sky drift,
   the city's warm windows and street lights twinkle, a few cars travel along its
   roads, and the setting sun glows and sends out rays. One small 2D canvas, drawn at ~30fps with additive light sprites; it
   sleeps whenever the hero isn't on screen (or the tab is hidden), and shows a
   single still frame for visitors who prefer reduced motion.

   The artwork's light and road positions (heroCityData.ts) are in the image's own
   pixels, so they are mapped onto the screen with the same `object-fit: cover` crop
   the <Image> gets — pass the same `position` you gave it. */

type Variant = "desktop" | "mobile";

const SUN: Record<Variant, [number, number]> = { desktop: [843, 412], mobile: [571, 742] };

/* Patches of open sky (image pixels) whose real clouds drift. Each is a rectangle of
   the artwork with no building poking into it; its own pixels are slid sideways
   (wrapping through a mirrored copy of themselves, so there is never a seam) and
   feathered back into the still picture around it. Buildings are untouched. */
type SkyRegion = { x: number; y: number; w: number; h: number; feather: { l: number; r: number; b: number }; speed: number };
const SKY_REGIONS: Record<Variant, SkyRegion[]> = {
  desktop: [
    { x: 300, y: 0, w: 640, h: 258, feather: { l: 70, r: 70, b: 60 }, speed: 9 },
    { x: 0, y: 0, w: 196, h: 272, feather: { l: 0, r: 40, b: 60 }, speed: 6 },
  ],
  mobile: [{ x: 0, y: 0, w: 640, h: 385, feather: { l: 0, r: 70, b: 70 }, speed: 7 }],
};
const HD_SRC: Record<Variant, string> = {
  desktop: "/images/hero/hero_desktop_hd.webp",
  mobile: "/images/hero/hero_mobile_hd.webp",
};
const RAYS = 18;
// Each patch is drawn as three overlapping depth layers that blend into one another
// with no visible seam. They share one steady drift but each sways a little around it
// on its own slow cycle, so the sky shears gently like real cloud decks instead of
// sliding as a flat sheet (kept small and bounded, or the layers would smear).
// [share of the patch's height it is centred on, sway in image px, sway period in s]
const DEPTH_LAYERS: [number, number, number][] = [[0, 12, 23], [0.5, 9, 31], [1, 14, 41]];

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

    // real sky patches (see SKY_REGIONS): a tile of each, a feather mask and a scratch buffer
    type Patch = { r: SkyRegion; tile: HTMLCanvasElement | null; masks: HTMLCanvasElement[]; buf: HTMLCanvasElement | null; tmp: HTMLCanvasElement | null; edge: HTMLCanvasElement | null };
    const patches: Patch[] = SKY_REGIONS[variant].map((r) => ({ r, tile: null, masks: [], buf: null, tmp: null, edge: null }));
    let artwork: HTMLImageElement | null = null;
    let ix = 1; // artwork pixels per data pixel
    let cancelled = false;
    const rays = Array.from({ length: RAYS }, (_, i) => ({
      angle: -Math.PI * (0.04 + 0.92 * ((i + seeded(i, 21) * 0.6) / RAYS)), // fan over the upper half
      len: 0.55 + seeded(i, 22) * 0.6,
      width: 0.012 + seeded(i, 23) * 0.03,
      speed: 0.25 + seeded(i, 24) * 0.5,
      phase: seeded(i, 25) * Math.PI * 2,
      base: 0.11 + seeded(i, 26) * 0.12,
    }));

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
    // tile = the region + its mirror image side by side (periodic, so it wraps seamlessly)
    const buildTiles = () => {
      if (!artwork) return;
      ix = artwork.naturalWidth / data.w;
      for (const p of patches) {
        const { x, y, w, h } = p.r;
        const tile = document.createElement("canvas");
        tile.width = Math.round(w * ix * 2);
        tile.height = Math.round(h * ix);
        const g = tile.getContext("2d")!;
        g.drawImage(artwork, x * ix, y * ix, w * ix, h * ix, 0, 0, w * ix, h * ix);
        g.save();
        g.translate(w * ix * 2, 0);
        g.scale(-1, 1);
        g.drawImage(artwork, x * ix, y * ix, w * ix, h * ix, 0, 0, w * ix, h * ix);
        g.restore();
        p.tile = tile;
      }
    };
    // masks and buffers depend on the on-screen size, so rebuild them on resize
    const buildMasks = () => {
      if (!W) return;
      for (const p of patches) {
        const pw = Math.max(2, Math.round(p.r.w * k * dpr));
        const ph = Math.max(2, Math.round(p.r.h * k * dpr));
        const mk = () => {
          const c = document.createElement("canvas");
          c.width = pw;
          c.height = ph;
          return c;
        };
        // edge feather (left / right / bottom), shared by the whole patch
        const edge = mk();
        const m = edge.getContext("2d")!;
        m.fillStyle = "#fff";
        m.fillRect(0, 0, pw, ph);
        m.globalCompositeOperation = "destination-in";
        const fade = (x0: number, y0: number, x1: number, y1: number) => {
          const gr = m.createLinearGradient(x0, y0, x1, y1);
          gr.addColorStop(0, "rgba(0,0,0,0)");
          gr.addColorStop(1, "rgba(0,0,0,1)");
          m.fillStyle = gr;
          m.fillRect(0, 0, pw, ph);
        };
        const { l, r, b } = p.r.feather;
        if (l) fade(0, 0, l * k * dpr, 0);
        if (r) fade(pw, 0, pw - r * k * dpr, 0);
        if (b) fade(0, ph, 0, ph - b * k * dpr);
        p.edge = edge;
        // one vertical window per depth layer; together they sum to 1 everywhere
        p.masks = DEPTH_LAYERS.map(([centre]) => {
          const c = mk();
          const g = c.getContext("2d")!;
          const gr = g.createLinearGradient(0, 0, 0, ph);
          DEPTH_LAYERS.forEach(([at]) => gr.addColorStop(at, `rgba(0,0,0,${at === centre ? 1 : 0})`));
          g.fillStyle = gr;
          g.fillRect(0, 0, pw, ph);
          return c;
        });
        p.buf = mk();
        p.tmp = mk();
      }
    };
    resize();
    buildMasks();
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      artwork = img;
      buildTiles();
    };
    img.src = HD_SRC[variant];
    const ro = new ResizeObserver(() => {
      resize();
      buildMasks();
    });
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

      // the real clouds drifting: each patch of open sky slides sideways, as three
      // depth layers moving at slightly different speeds, with a slow breathing in
      // the pace so the drift never looks mechanical
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const tt = reducedMotion ? 0 : t;
      for (const p of patches) {
        if (!p.tile || !p.buf || !p.tmp || !p.edge || p.masks.length !== DEPTH_LAYERS.length) continue;
        const b = p.buf.getContext("2d")!;
        const tg = p.tmp.getContext("2d")!;
        const pw = p.buf.width;
        const ph = p.buf.height;
        const tw = p.tile.width;
        const th = p.tile.height;
        const sw = tw / 2;
        b.globalCompositeOperation = "source-over";
        b.clearRect(0, 0, pw, ph);
        DEPTH_LAYERS.forEach(([, sway, period], li) => {
          const travel = tt * p.r.speed + sway * Math.sin((tt / period) * Math.PI * 2 + li * 2.1);
          const shift = (((travel * ix) % tw) + tw) % tw;
          tg.globalCompositeOperation = "source-over";
          tg.clearRect(0, 0, pw, ph);
          if (shift + sw <= tw) {
            tg.drawImage(p.tile!, shift, 0, sw, th, 0, 0, pw, ph);
          } else {
            const a = tw - shift;
            const da = pw * (a / sw);
            tg.drawImage(p.tile!, shift, 0, a, th, 0, 0, da, ph);
            tg.drawImage(p.tile!, 0, 0, sw - a, th, da, 0, pw - da, ph);
          }
          tg.globalCompositeOperation = "destination-in";
          tg.drawImage(p.masks[li], 0, 0);
          b.globalCompositeOperation = "lighter";
          b.drawImage(p.tmp!, 0, 0);
        });
        b.globalCompositeOperation = "destination-in";
        b.drawImage(p.edge, 0, 0);
        ctx.drawImage(p.buf, offX + p.r.x * k, offY + p.r.y * k, p.r.w * k, p.r.h * k);
      }
      ctx.globalCompositeOperation = "lighter";

      // the setting sun: a breathing glow and shafts of light fanning up from it
      const [sx, sy] = SUN[variant];
      const px = offX + sx * k;
      const py = offY + sy * k;
      glow(sunSprite, px, py, 820 * k, 0.4 + 0.12 * Math.sin(t * 0.5));
      glow(white, px, py, 190 * k, 0.65 + 0.2 * Math.sin(t * 0.8 + 1));
      const sway = Math.sin(t * 0.18) * 0.045;
      for (const r of rays) {
        const len = r.len * Math.max(W, H) * 0.9;
        const a = r.base * (0.45 + 0.55 * Math.sin(t * r.speed + r.phase) * 0.5 + 0.275);
        const grad = ctx.createLinearGradient(0, 0, len, 0);
        grad.addColorStop(0, `rgba(255,214,150,${a.toFixed(3)})`);
        grad.addColorStop(1, "rgba(255,170,100,0)");
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(r.angle + sway);
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len, -len * r.width);
        ctx.lineTo(len, len * r.width);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

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
      // (a still frame; the artwork may still be loading, so draw again when it has)
      draw(2);
      img.addEventListener("load", () => draw(2));
      return () => {
        cancelled = true;
        ro.disconnect();
      };
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
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant, position, reducedMotion]);

  return <canvas ref={ref} aria-hidden className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
}
