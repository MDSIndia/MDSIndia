"use client";

import { useEffect, useRef } from "react";
import { STAR_BLAST_AT, STAR_DURATION, STAR_HANDOFF_AT } from "./introScene";

/** The star scene drawn with a plain 2D canvas — no WebGL. Used on iPhones and
 * iPads, where the WebGL version rendered the blast as huge blurry red / green
 * / blue / cyan / magenta / yellow blobs. A 2D canvas draws exactly what it is
 * told (white dots on black), so that class of GPU bug cannot happen.
 *
 * It replays the same story as SpaceStar: a dark sky and a stream of stars as
 * the camera flies forward, a flash at the blast, then ~3,000 particles
 * spiralling out of the blast point while the camera pulls back and then dives
 * at one star. The 3D maths (camera path, particle motion) is the same; each
 * particle is projected to the screen by hand. */

const STAR_Z = -90;
const CUT_AT = 0.05;
const DIVE_START = 1.0;
const DIVE_END = STAR_HANDOFF_AT - STAR_BLAST_AT + 0.3;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Pre-rendered white dot: bright pin-sharp core with a short soft halo. */
function makeDot(px: number) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const ctx = c.getContext("2d")!;
  const r = px / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.4)");
  g.addColorStop(0.6, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  return c;
}

export function Star2D({ active, isMobile }: { active: boolean; isMobile: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (active && startRef.current === null) startRef.current = performance.now();
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const dot = makeDot(64);

    /* ── particles: same recipe as SpaceStar ── */
    const count = isMobile ? 2600 : 5200;
    const dir = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const size = new Float32Array(count);
    const swirl = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const inDisc = seeded(i, 1) < 0.62;
      const theta = seeded(i, 2) * Math.PI * 2;
      let x: number, y: number, z: number;
      if (inDisc) {
        x = Math.cos(theta);
        z = Math.sin(theta);
        y = (seeded(i, 3) - 0.5) * 0.22;
        const tilt = 0.5;
        const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
        const tz = y * Math.sin(tilt) + z * Math.cos(tilt);
        y = ty;
        z = tz;
      } else {
        const phi = Math.acos(2 * seeded(i, 4) - 1);
        x = Math.sin(phi) * Math.cos(theta);
        y = Math.cos(phi);
        z = Math.sin(phi) * Math.sin(theta);
      }
      const len = Math.hypot(x, y, z) || 1;
      dir[i * 3] = x / len;
      dir[i * 3 + 1] = y / len;
      dir[i * 3 + 2] = z / len;
      const sp = 5 + Math.pow(seeded(i, 5), 1.5) * 58;
      speed[i] = sp;
      size[i] = 0.45 + Math.pow(seeded(i, 6), 3) * 1.9;
      swirl[i] = (inDisc ? 1.5 : 0.5) * (1.1 - sp / 90) * (seeded(i, 7) > 0.5 ? 1 : 0.8);
      seed[i] = seeded(i, 8);
    }
    // The star the camera dives at.
    let best = 0;
    let bestScore = Infinity;
    for (let i = 0; i < count; i++) {
      if (size[i] < 1.6) continue;
      const score = Math.abs(speed[i] - 14) - size[i] * 2 + Math.abs(dir[i * 3 + 1]) * 40;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }

    /* ── background: fixed twinkling sky stars + a stream of near dust ── */
    const sky = Array.from({ length: 220 }, (_, i) => ({
      x: seeded(i, 21),
      y: seeded(i, 22),
      r: 0.4 + seeded(i, 23) * 1.1,
      p: seeded(i, 24) * 6.28,
      s: 0.8 + seeded(i, 25) * 2.5,
    }));
    const dust = Array.from({ length: isMobile ? 160 : 320 }, (_, i) => {
      const a = seeded(i, 31) * Math.PI * 2;
      const r = 6 + Math.pow(seeded(i, 32), 1.6) * 30;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: 50 - seeded(i, 33) * 175 };
    });

    const tgt = [0, 0, 0];
    const cam = [0, 0, 0];
    const look = [0, 0, 0];
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const start = startRef.current;
      const t = start === null ? 0 : (performance.now() - start) / 1000;
      const tau = t - STAR_BLAST_AT;

      /* camera path (same as SpaceStar) */
      const approach = clamp01(t / STAR_BLAST_AT);
      let z = STAR_Z * Math.pow(approach, 2.2);
      if (tau > CUT_AT) {
        const wideZ = STAR_Z + 58 + (isMobile ? 34 : 0) + (Math.min(tau, DIVE_START) - CUT_AT) * 3.5;
        const d = clamp01((tau - DIVE_START) / (DIVE_END - DIVE_START));
        z = wideZ + (STAR_Z - wideZ) * d * d;
      }

      /* target star position now */
      {
        const age = Math.max(tau, 0);
        const dist = (speed[best] / 0.85) * (1 - Math.exp(-0.85 * age));
        const ang = swirl[best] * (1 - Math.exp(-0.7 * age)) + age * 0.22;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const dx = dir[best * 3];
        const dy = dir[best * 3 + 1];
        const dz = dir[best * 3 + 2];
        tgt[0] = (dx * c - dz * s) * dist;
        tgt[1] = dy * dist;
        tgt[2] = STAR_Z + (dx * s + dz * c) * dist;
      }

      cam[0] = Math.sin(t * 0.37) * 0.12;
      cam[1] = Math.cos(t * 0.29) * 0.08;
      cam[2] = z;
      let dive = 0;
      if (tau > CUT_AT) {
        dive = clamp01((tau - DIVE_START) / (DIVE_END - DIVE_START));
        if (dive > 0) {
          const vx = tgt[0] - cam[0];
          const vy = tgt[1] - cam[1];
          const vz = tgt[2] - cam[2];
          const L = Math.hypot(vx, vy, vz) || 1;
          const move = Math.max(0, L - 0.3) * (dive * dive);
          cam[0] += (vx / L) * move;
          cam[1] += (vy / L) * move;
          cam[2] += (vz / L) * move;
        }
      }
      if (tau > CUT_AT) {
        const k = smooth(0, 0.5, dive);
        look[0] = tgt[0] * k;
        look[1] = tgt[1] * k;
        look[2] = STAR_Z + (tgt[2] - STAR_Z) * k;
      } else {
        look[0] = 0;
        look[1] = 0;
        look[2] = z - 100;
      }

      /* camera basis (up = +y) */
      let fx = look[0] - cam[0];
      let fy = look[1] - cam[1];
      let fz = look[2] - cam[2];
      const fl = Math.hypot(fx, fy, fz) || 1;
      fx /= fl;
      fy /= fl;
      fz /= fl;
      // right = f x up
      let rx = -fz;
      let ry = 0;
      let rz = fx;
      const rl = Math.hypot(rx, ry, rz) || 1;
      rx /= rl;
      ry /= rl;
      rz /= rl;
      // up = r x f
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const fov = ((isMobile ? 66 : 46) * Math.PI) / 180;
      const focal = H / 2 / Math.tan(fov / 2);
      const cx = W / 2;
      const cy = H / 2;

      const project = (px: number, py: number, pz: number) => {
        const dx = px - cam[0];
        const dy = py - cam[1];
        const dz = pz - cam[2];
        const depth = dx * fx + dy * fy + dz * fz;
        if (depth < 0.05) return null;
        return {
          x: cx + ((dx * rx + dy * ry + dz * rz) / depth) * focal,
          y: cy - ((dx * ux + dy * uy + dz * uz) / depth) * focal,
          depth,
        };
      };

      /* sky stars */
      ctx.globalCompositeOperation = "lighter";
      for (const s of sky) {
        const a = (0.35 + 0.35 * Math.sin(t * s.s + s.p)) * 0.9;
        ctx.globalAlpha = a;
        ctx.drawImage(dot, s.x * W - s.r * 3, s.y * H - s.r * 3, s.r * 6, s.r * 6);
      }

      /* dust streaming past */
      for (const d of dust) {
        const p = project(d.x, d.y, d.z);
        if (!p || p.depth > 140) continue;
        const r = Math.min(7, 0.11 * focal / p.depth * 0.9 + 0.8);
        ctx.globalAlpha = 0.85 * smooth(1, 10, p.depth);
        ctx.drawImage(dot, p.x - r, p.y - r, r * 2, r * 2);
      }

      /* the blast */
      if (tau > 0) {
        const growDist = 1 - Math.exp(-0.85 * tau);
        const swirlK = 1 - Math.exp(-0.7 * tau);
        const born = smooth(0, 0.1, tau);
        const life = STAR_DURATION - STAR_BLAST_AT - 1.2;
        const fadeAll = 1 - smooth(life, life + 1.6, tau) * 0.55;
        for (let i = 0; i < count; i++) {
          const dist = (speed[i] / 0.85) * growDist;
          const ang = swirl[i] * swirlK + tau * 0.22;
          const c = Math.cos(ang);
          const s = Math.sin(ang);
          const dx = dir[i * 3];
          const dy = dir[i * 3 + 1];
          const dz = dir[i * 3 + 2];
          const p = project((dx * c - dz * s) * dist, dy * dist, STAR_Z + (dx * s + dz * c) * dist);
          if (!p) continue;
          if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
          const tw = 0.75 + 0.25 * Math.sin(tau * (2 + seed[i] * 5) + seed[i] * 40);
          let r = Math.min(7.5, Math.max(1.2, (size[i] * 260 * (H / 720)) / p.depth / 2));
          if (size[i] < 0.8) r = Math.max(1, r * 0.6);
          const a = born * fadeAll * tw * smooth(0.8, 9, p.depth);
          ctx.globalAlpha = Math.min(1, a);
          ctx.drawImage(dot, p.x - r * 1.6, p.y - r * 1.6, r * 3.2, r * 3.2);
        }

        /* the target star lights up as the camera closes on it */
        const near = smooth(0.1, 0.6, dive);
        if (near > 0.001) {
          const p = project(tgt[0], tgt[1], tgt[2]);
          if (p) {
            const r = Math.max(8, (0.45 * 3.2 * focal) / p.depth);
            ctx.globalAlpha = Math.min(1, near * 0.95);
            ctx.drawImage(dot, p.x - r, p.y - r, r * 2, r * 2);
          }
        }

        /* flash at the instant of the blast */
        const flash = 0.8 * (1 - smooth(0.07, 0.42, tau));
        if (flash > 0.002) {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = flash;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, W, H);
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [isMobile]);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", background: "#000" }}
    />
  );
}
