"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STAR_BLAST_AT, STAR_DURATION, STAR_HANDOFF_AT } from "../introScene";
import { getRadialGlowTexture, getRayTexture } from "./glowTexture";

/** Where the star sits, dead ahead of the camera down -z. */
const STAR_POS = new THREE.Vector3(0, 0, -90);
/** Camera dive: the camera flies straight at the star, accelerating, and
 * passes through its surface into the middle of it (z = star centre) at the
 * moment of detonation, where the lens is filled with white. Under that
 * white-out it cuts to a wide view of the burst from outside, which then
 * drifts back slowly while the cosmos spreads — from inside the burst the
 * particles just stream past the lens and you can't see it as a cosmos. */
const CAM_START_Z = 0;
const CAM_CENTRE_Z = STAR_POS.z;
const CAM_WIDE_Z = STAR_POS.z + 58;
/** Seconds after the blast at which the cut to the wide view happens (the
 * white-out is at full strength from just before the blast to ~0.1s after). */
const CUT_AT = 0.05;
/** After the burst has spread, the camera dives into the turning cloud: it
 * starts at DIVE_START seconds after the blast and reaches the middle of the
 * cloud at DIVE_END, where the closing white takes over for the hero. */
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

/* ───────────────────────── blast particles ───────────────────────────── */

// The blast is drawn with plain three.js points (PointsMaterial) whose motion
// is computed in JavaScript each frame, not with a custom shader. A custom
// GPU shader here rendered as huge blurry red/green/blue/cyan/magenta/yellow
// blobs on iPhones (attribute/precision mishandling in iOS Safari). Standard
// points are the path three.js has already proven on iOS — the same kind the
// background star dust uses.
const BLAST_BUCKETS = [
  { max: 0.8, size: 0.55 },
  { max: 1.4, size: 1.0 },
  { max: 99, size: 1.7 },
] as const;

/** A white dot: bright pin-sharp core and a short soft halo. */
function makeDotTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.4)");
  g.addColorStop(0.6, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * Deep-space opening: a star hangs in the dark far ahead, the camera
 * falls toward it as it swells and starts to boil, then it detonates —
 * a white flash and thousands of particles bursting
 * outward and winding into spiral arms, spreading out like a young
 * cosmos around (and past) the camera. Ends in a soft central glow that
 * matches the CSS veil the homepage dissolves out of.
 *
 * Cost: the star is one sphere with one shader; the whole particle cloud
 * is one draw call simulated entirely on the GPU from a single `uAge`
 * uniform (no per-frame buffer writes); the rest is a handful of sprites.
 * Timing comes from introScene (STAR_BLAST_AT / STAR_DURATION).
 */
export function SpaceStar({ isMobile }: { isMobile: boolean }) {
  const { camera, scene } = useThree();
  // Uniforms are written through the materials themselves: R3F gives a
  // <shaderMaterial> its own copy of the `uniforms` prop, so mutating the
  // original object (as an earlier version did) never reached the GPU and
  // the blast stayed frozen at its initial age.
  const blastPointsRef = useRef<({ visible: boolean; material: THREE.Material | THREE.Material[] } | null)[]>([]);
  const haloRefs = useRef<(THREE.Sprite | null)[]>([]);
  const coronaRef = useRef<THREE.Sprite>(null);
  const flashRef = useRef<THREE.Sprite>(null);
  const finalRef = useRef<THREE.Sprite>(null);
  const cloudARef = useRef<THREE.Sprite>(null);
  const cloudBRef = useRef<THREE.Sprite>(null);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const targetGlowRef = useRef<THREE.Sprite>(null);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const lookAtV = useMemo(() => new THREE.Vector3(), []);
  const endPos = useMemo(() => new THREE.Vector3(), []);

  const glow = useMemo(() => getRadialGlowTexture(), []);
  const dotTex = useMemo(() => makeDotTexture(), []);
  const rays = useMemo(() => getRayTexture(), []);

  const count = isMobile ? 3200 : 9000;

  const { blast, target } = useMemo(() => {
    const dir = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const size = new Float32Array(count);
    const swirl = new Float32Array(count);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 62% of the debris is thrown into a tilted galactic disc (so the
      // cloud has a visible plane and arms), the rest in every direction.
      const inDisc = seeded(i, 1) < 0.62;
      const theta = seeded(i, 2) * Math.PI * 2;
      let x: number, y: number, z: number;
      if (inDisc) {
        const flat = (seeded(i, 3) - 0.5) * 0.22;
        x = Math.cos(theta);
        z = Math.sin(theta);
        y = flat;
        // tilt the disc ~28deg about the x axis so it reads in 3D
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

      // Mostly mid-speed with a long tail of fast ones.
      const sp = 5 + Math.pow(seeded(i, 5), 1.5) * 58;
      speed[i] = sp;
      size[i] = 0.45 + Math.pow(seeded(i, 6), 3) * 1.9;
      // Faster debris winds less; the disc winds more than the halo.
      swirl[i] = (inDisc ? 1.5 : 0.5) * (1.1 - sp / 90) * (seeded(i, 7) > 0.5 ? 1 : 0.8);
      seed[i] = seeded(i, 8);
    }

    // The one star the camera flies down to and the closing glow comes from:
    // a big, bright, mid-speed particle in the disc, so it sits near the middle
    // of the cloud. Its motion is replayed on the CPU (see targetAt) with the
    // same formulas as the vertex shader.
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
    const target = {
      dir: new THREE.Vector3(dir[best * 3], dir[best * 3 + 1], dir[best * 3 + 2]),
      speed: speed[best],
      swirl: swirl[best],
    };

    // Group particles into a few size buckets (PointsMaterial has one size per
    // draw), each with its own position/colour buffers updated every frame.
    const buckets = BLAST_BUCKETS.map((b, bi) => {
      const lo = bi === 0 ? -1 : BLAST_BUCKETS[bi - 1].max;
      const idx: number[] = [];
      for (let i = 0; i < count; i++) if (size[i] > lo && size[i] <= b.max) idx.push(i);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(idx.length * 3), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(idx.length * 3), 3));
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return { idx, geo, size: b.size, avg: Math.min(b.max, 2.4) * (bi === 0 ? 0.7 : bi === 1 ? 0.8 : 0.75) };
    });
    return { target, blast: { dir, speed, swirl, seed, buckets } };
  }, [count]);

  useEffect(() => {
    scene.background = new THREE.Color("#000000");
    return () => {
      scene.background = null;
    };
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const tau = t - STAR_BLAST_AT; // seconds since the blast (negative before)
    const heat = smooth(STAR_BLAST_AT - 1.0, STAR_BLAST_AT, t);

    /* ── camera: dive into the star, then out through the burst ── */
    const approach = clamp01(t / STAR_BLAST_AT);
    let z = CAM_START_Z + (CAM_CENTRE_Z - CAM_START_Z) * Math.pow(approach, 2.2);
    if (tau > CUT_AT) {
      // A phone is tall and narrow, so the same wide shot crops the cloud
      // sideways: stand further back there.
      const wideZ = CAM_WIDE_Z + (isMobile ? 34 : 0) + (Math.min(tau, DIVE_START) - CUT_AT) * 3.5;
      const d = clamp01((tau - DIVE_START) / (DIVE_END - DIVE_START));
      // Eases in: the camera gathers speed as it falls into the cloud.
      z = wideZ + (CAM_CENTRE_Z - wideZ) * d * d;
    }
    // Shudder builds as the star swallows the camera, then settles.
    const shake = heat * (tau < 0 ? 1.6 : 0) * 0.09;
    // Where the target star is right now (same maths as the vertex shader).
    {
      const age = Math.max(tau, 0);
      const dist = (target.speed / 0.85) * (1 - Math.exp(-0.85 * age));
      const ang = target.swirl * (1 - Math.exp(-0.7 * age)) + age * 0.22;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      tgt.set(
        STAR_POS.x + (target.dir.x * c - target.dir.z * sn) * dist,
        STAR_POS.y + target.dir.y * dist,
        STAR_POS.z + (target.dir.x * sn + target.dir.z * c) * dist
      );
    }
    camPos.set(
      Math.sin(t * 0.37) * 0.12 + Math.sin(t * 41) * shake,
      Math.cos(t * 0.29) * 0.08 + Math.cos(t * 37) * shake,
      z
    );
    let dive = 0;
    if (tau > CUT_AT) {
      dive = clamp01((tau - DIVE_START) / (DIVE_END - DIVE_START));
      if (dive > 0) {
        // Fly right into the chosen star: it stays a small point of light and only
        // grows through perspective as the camera gets close, ending with the
        // camera practically inside it.
        endPos.copy(tgt).sub(camPos).setLength(Math.max(0, camPos.distanceTo(tgt) - 0.3)).add(camPos);
        camPos.lerp(endPos, dive * dive);
      }
    }
    camera.position.copy(camPos);
    camera.up.set(0, 1, 0);
    // Straight down the flight line while diving at the star; at the wide view
    // of the burst look at the middle of it, easing onto the target star as the
    // camera starts to fall toward it.
    if (tau > CUT_AT) lookAtV.copy(STAR_POS).lerp(tgt, smooth(0, 0.5, dive));
    else lookAtV.set(0, 0, z - 100);
    camera.lookAt(lookAtV);
    if (camera instanceof THREE.PerspectiveCamera) {
      // Portrait screens get a much wider lens so the burst still fits across.
      const fov = isMobile ? 66 : 46;
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
    camera.getWorldDirection(fwd);

    /* ── the star ── */
    // The sky starts empty: the star fades up out of nothing over the first
    // ~1.4s, a barely-there pinprick, then grows as the camera closes in.
    const appear = smooth(0.15, 1.4, t);
    // (No star body: the star is only ever seen as the small glow sprite below,
    // so there is no sphere or custom shader for it any more.)
    const pulse = 1 + Math.sin(t * 19) * 0.025 * heat + Math.sin(t * 7.3) * 0.015 * heat;

    // Halo layers: the glow the eye reads as "a star". They brighten with
    // heat and wink out with the core.
    const haloScales = [3.4, 8, 18];
    const haloBase = [0.42, 0.12, 0.05];
    haloRefs.current.forEach((h, i) => {
      if (!h) return;
      h.scale.setScalar(haloScales[i] * (1 + heat * 0.25) * pulse);
      h.visible = false;
      (h.material as THREE.SpriteMaterial).opacity =
        haloBase[i] * appear * (0.8 + heat * 0.3) * (tau > 0 ? 1 - smooth(0.0, 0.6, tau) : 1);
    });
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(20 * (1 + heat * 0.3));
      const m = coronaRef.current.material as THREE.SpriteMaterial;
      m.rotation = t * 0.05;
      m.opacity = (0.35 + heat * 0.45) * (tau > 0 ? 1 - smooth(0.0, 0.5, tau) : 1);
    }

    /* ── the blast ── */
    if (tau > 0) {
      const age = tau;
      const life = STAR_DURATION - STAR_BLAST_AT - 1.2;
      const growDist = 1 - Math.exp(-0.85 * age);
      const swirlK = 1 - Math.exp(-0.7 * age);
      const born = smooth(0, 0.1, age);
      const fadeAll = 1 - smooth(life, life + 1.6, age) * 0.55;
      const pxPerUnit = state.size.height / 2;
      const maxPxDepth = blast.buckets.map((bk) => (bk.avg * 215) / 13);
      blast.buckets.forEach((bk, bi) => {
        const pts = blastPointsRef.current[bi];
        if (!pts) return;
        pts.visible = true;
        const pos = bk.geo.attributes.position as THREE.BufferAttribute;
        const col = bk.geo.attributes.color as THREE.BufferAttribute;
        const pa = pos.array as Float32Array;
        const ca = col.array as Float32Array;
        for (let j = 0; j < bk.idx.length; j++) {
          const i = bk.idx[j];
          const dist = (blast.speed[i] / 0.85) * growDist;
          const ang = blast.swirl[i] * swirlK + age * 0.22;
          const cs = Math.cos(ang);
          const sn = Math.sin(ang);
          const dx = blast.dir[i * 3];
          const dy = blast.dir[i * 3 + 1];
          const dz = blast.dir[i * 3 + 2];
          const px = STAR_POS.x + (dx * cs - dz * sn) * dist;
          const py = STAR_POS.y + dy * dist;
          const pz = STAR_POS.z + (dx * sn + dz * cs) * dist;
          pa[j * 3] = px;
          pa[j * 3 + 1] = py;
          pa[j * 3 + 2] = pz;
          // Brightness = colour (additive blending), so fading is just a darker
          // grey: born-in, twinkle, slow fade-out, and fade near the lens.
          const depth = (px - camera.position.x) * fwd.x + (py - camera.position.y) * fwd.y + (pz - camera.position.z) * fwd.z;
          const tw = 0.75 + 0.25 * Math.sin(age * (2 + blast.seed[i] * 5) + blast.seed[i] * 40);
          // PointsMaterial cannot cap point size the way the old shader did, so a
          // particle that would grow past ~14px (close to the lens) fades out
          // instead of swelling into a big soft disc.
          const v = born * fadeAll * tw * smooth(0.8, 9, depth) * smooth(maxPxDepth[bi] * 0.55, maxPxDepth[bi], depth);
          ca[j * 3] = v;
          ca[j * 3 + 1] = v;
          ca[j * 3 + 2] = v;
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        // Same on-screen size as before: avg particle size * 260 / depth px.
        (pts.material as THREE.PointsMaterial).size = (bk.avg * 215) / pxPerUnit;
      });
    } else {
      blastPointsRef.current.forEach((p) => {
        if (p) p.visible = false;
      });
    }

    // Full-screen flash, parked just in front of the lens.
    if (flashRef.current) {
      flashRef.current.position.copy(camera.position).addScaledVector(fwd, 3);
      const m = flashRef.current.material as THREE.SpriteMaterial;
      // The star's glow fills the lens as the camera dives in (full white at the
      // centre), then lifts to reveal the burst all around.
      // A short, softer pop rather than a long blown-out white screen: it only
      // needs to be strong for the instant of the cut (CUT_AT), then fades fast.
      m.opacity = tau >= 0 ? 0.8 * (1 - smooth(0.07, 0.42, tau)) : 0;
    }

    // Lingering colored nebula glow where the star was.
    [cloudARef.current, cloudBRef.current].forEach((c, i) => {
      if (!c) return;
      c.position.copy(STAR_POS);
      const p = clamp01(tau / 3.2);
      const e = 1 - Math.pow(1 - p, 2);
      c.scale.setScalar(6 + e * (i === 0 ? 70 : 55));
      (c.material as THREE.SpriteMaterial).opacity =
        smooth(0, 0.15, tau) * (i === 0 ? 0.1 : 0.06) * (1 - p * 0.6);
    });

    // The target star lights up as the camera closes on it: a bright core that
    // swells until the hand-off glow (IntroTransition) takes over from the same
    // spot (the camera is looking straight at it, so it is mid-screen).
    if (targetGlowRef.current) {
      targetGlowRef.current.position.copy(tgt);
      const near = smooth(0.1, 0.6, dive);
      // Fixed small size (the apparent growth is the camera closing in).
      targetGlowRef.current.scale.setScalar(0.45);
      (targetGlowRef.current.material as THREE.SpriteMaterial).opacity = near * 0.95;
    }

    // Closing glow: a soft white centre fading up in the last beat so
    // the final frame matches the veil the homepage dissolves out of.
    if (finalRef.current) {
      finalRef.current.position.copy(camera.position).addScaledVector(fwd, 3);
      const m = finalRef.current.material as THREE.SpriteMaterial;
      // Only a light wash at the very end (it used to climb to full white): the
      // hand-off holds at this same level, so there is no jump.
      // (No closing wash any more: the glow now starts from the centre in the
      // hand-off layer, IntroTransition, so the scene stays clear until then.)
      const k = 0;
      // Swells past the frame and reaches full opacity, so the last canvas
      // frame is solid white — the same white the hand-off veil starts from.
      finalRef.current.scale.setScalar(14);
      m.opacity = k;
    }
  });

  return (
    <group>
      {/* The star: stacked glow sprites. */}
      {[
        { color: "#ffffff" },
        { color: "#ffffff" },
        { color: "#ffffff" },
      ].map((h, i) => (
        <sprite
          key={i}
          ref={(el) => {
            haloRefs.current[i] = el;
          }}
          position={STAR_POS}
        >
          <spriteMaterial
            map={glow}
            color={h.color}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
      ))}

      <sprite ref={coronaRef} position={STAR_POS} visible={false}>
        <spriteMaterial
          map={rays}
          color="#ffffff"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {/* The cosmos: standard points, motion computed on the CPU (see above). */}
      {blast.buckets.map((bk, bi) => (
        <points
          key={bi}
          ref={(el) => {
            blastPointsRef.current[bi] = el;
          }}
          geometry={bk.geo}
          frustumCulled={false}
          visible={false}
        >
          <pointsMaterial
            map={dotTex}
            size={bk.size}
            sizeAttenuation
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </points>
      ))}

      {/* (Hidden: the lingering glow where the star died read as a grey haze
          behind the particles — the burst now sits on clean black.) */}
      <sprite ref={cloudARef} position={STAR_POS} visible={false}>
        <spriteMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <sprite ref={cloudBRef} position={STAR_POS} visible={false}>
        <spriteMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {/* The target star's own glow. */}
      <sprite ref={targetGlowRef} scale={[0.5, 0.5, 1]} renderOrder={9}>
        <spriteMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      {/* Screen-space flash and closing glow. */}
      <sprite ref={flashRef} scale={[26, 26, 1]} renderOrder={10}>
        <spriteMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <sprite ref={finalRef} scale={[14, 14, 1]} renderOrder={11}>
        <spriteMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
