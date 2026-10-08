"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STAR_BLAST_AT, STAR_DURATION } from "../introScene";
import { getRadialGlowTexture, getRayTexture } from "./glowTexture";

/** Where the star sits, dead ahead of the camera down -z. */
const STAR_POS = new THREE.Vector3(0, 0, -90);
const STAR_RADIUS = 0.6;
/** Camera dolly: from the origin to just short of the star, then — once it
 * detonates — a pull-back to a wide view so the whole cosmos can be seen
 * spreading, instead of staying buried inside the burst. */
const CAM_START_Z = 0;
const CAM_NEAR_Z = -76;
const CAM_END_Z = -34;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/* ───────────────────────── star surface shader ───────────────────────── */

const starVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vPos = normalize(position);
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const starFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;
  uniform float uFade;
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vV;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.1 + 3.7; a *= 0.5; }
    return s;
  }

  void main() {
    // A plain white sun. A little brightness variation across the face
    // (slow noise) keeps it from reading as a flat disc, nothing more.
    vec3 p = normalize(vPos);
    float n = noise(p * 3.0 + vec3(uTime * 0.2));
    float facing = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
    float v = 0.88 + 0.12 * n + uHeat * 0.12 + pow(1.0 - facing, 2.0) * 0.1;
    gl_FragColor = vec4(vec3(v) * uFade, 1.0);
  }
`;

/* ───────────────────────── blast particle shader ──────────────────────── */

const blastVertex = /* glsl */ `
  uniform float uAge;      // seconds since the blast
  uniform float uPx;       // pixel-ratio-scaled point size scale
  uniform float uLife;     // seconds before particles begin to fade
  attribute vec3 aDir;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aSwirl;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float age = max(uAge, 0.0);
    // Fast burst that eases off (drag): distance = v/k * (1 - e^(-k*age)).
    float k = 0.85;
    float dist = aSpeed / k * (1.0 - exp(-k * age));

    // Slow rotation about the vertical axis as it expands — the debris
    // winds into spiral arms instead of flying out as a plain sphere.
    float ang = aSwirl * (1.0 - exp(-0.7 * age));
    float c = cos(ang), s = sin(ang);
    vec3 d = vec3(aDir.x * c - aDir.z * s, aDir.y, aDir.x * s + aDir.z * c);

    vec3 pos = d * dist;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Size: perspective-scaled, but clamped so a mote passing the lens
    // never swells into a disc and far ones never vanish.
    float tw = 0.75 + 0.25 * sin(uAge * (2.0 + aSeed * 5.0) + aSeed * 40.0);
    float px = aSize * uPx * (260.0 / max(-mv.z, 0.5)) * tw;
    gl_PointSize = clamp(px, 1.5, 22.0 * uPx);

    // Born with the flash, hold, then fade out slowly as they scatter.
    float born = smoothstep(0.0, 0.10, uAge);
    float fade = 1.0 - smoothstep(uLife, uLife + 1.6, uAge) * 0.55;
    // Hot at birth, cooling to their own colour.
    vec3 hotCol = aColor;
    vColor = hotCol;
    vAlpha = born * fade;
  }
`;

const blastFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d = length(q);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a *= a;
    gl_FragColor = vec4(vColor * 1.6, a * vAlpha);
  }
`;

const PALETTE = ["#ffffff", "#f4f7ff", "#e8edff", "#ffffff"];

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
  const coreRef = useRef<THREE.Mesh>(null);
  // Uniforms are written through the materials themselves: R3F gives a
  // <shaderMaterial> its own copy of the `uniforms` prop, so mutating the
  // original object (as an earlier version did) never reached the GPU and
  // the blast stayed frozen at its initial age.
  const starMatRef = useRef<THREE.ShaderMaterial>(null);
  const blastMatRef = useRef<THREE.ShaderMaterial>(null);
  const haloRefs = useRef<(THREE.Sprite | null)[]>([]);
  const coronaRef = useRef<THREE.Sprite>(null);
  const flashRef = useRef<THREE.Sprite>(null);
  const finalRef = useRef<THREE.Sprite>(null);
  const cloudARef = useRef<THREE.Sprite>(null);
  const cloudBRef = useRef<THREE.Sprite>(null);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  const glow = useMemo(() => getRadialGlowTexture(), []);
  const rays = useMemo(() => getRayTexture(), []);

  const count = isMobile ? 2400 : 5200;

  const starUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uHeat: { value: 0 }, uFade: { value: 1 } }),
    []
  );

  const { geometry, blastUniforms } = useMemo(() => {
    const dir = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const size = new Float32Array(count);
    const swirl = new Float32Array(count);
    const seed = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const tmp = new THREE.Color();

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
      tmp.set(PALETTE[Math.floor(seeded(i, 9) * PALETTE.length)]);
      color[i * 3] = tmp.r;
      color[i * 3 + 1] = tmp.g;
      color[i * 3 + 2] = tmp.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aSwirl", new THREE.BufferAttribute(swirl, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    // Particles move far from the origin; never cull the cloud.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    return {
      geometry: geo,
      blastUniforms: {
        uAge: { value: -1 },
        uPx: { value: 1 },
        uLife: { value: STAR_DURATION - STAR_BLAST_AT - 1.2 },
      },
    };
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

    /* ── camera: ease-in dolly toward the star, then drift into the cloud ── */
    const approach = clamp01(t / STAR_BLAST_AT);
    let z = CAM_START_Z + (CAM_NEAR_Z - CAM_START_Z) * Math.pow(approach, 2.6);
    if (tau > 0) z = CAM_NEAR_Z + (CAM_END_Z - CAM_NEAR_Z) * (1 - Math.exp(-tau * 0.8));
    const shake = heat * (tau < 0 ? 1 : Math.max(0, 1 - tau * 2.5)) * 0.07;
    camera.position.set(
      Math.sin(t * 0.37) * 0.12 + Math.sin(t * 41) * shake,
      Math.cos(t * 0.29) * 0.08 + Math.cos(t * 37) * shake,
      z
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(STAR_POS);
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = 46;
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
    const pulse = 1 + Math.sin(t * 19) * 0.025 * heat + Math.sin(t * 7.3) * 0.015 * heat;
    const blastSwell = tau > 0 ? 1 + smooth(0, 0.25, tau) * 0.9 : 1;
    const coreFade = tau > 0 ? 1 - smooth(0.05, 0.4, tau) : 1;
    if (coreRef.current) {
      coreRef.current.visible = coreFade > 0.002;
      coreRef.current.scale.setScalar(STAR_RADIUS * pulse * blastSwell * (0.15 + 0.85 * appear));
    }
    const su = starMatRef.current?.uniforms;
    if (su) {
      su.uTime.value = t;
      su.uHeat.value = heat;
      su.uFade.value = coreFade;
    }

    // Halo layers: the glow the eye reads as "a star". They brighten with
    // heat and wink out with the core.
    const haloScales = [3.4, 8, 18];
    const haloBase = [0.42, 0.12, 0.05];
    haloRefs.current.forEach((h, i) => {
      if (!h) return;
      h.scale.setScalar(haloScales[i] * (1 + heat * 0.25) * pulse);
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
    const bu = blastMatRef.current?.uniforms;
    if (bu) {
      bu.uAge.value = tau;
      bu.uPx.value = state.gl.getPixelRatio();
    }

    // Full-screen flash, parked just in front of the lens.
    if (flashRef.current) {
      flashRef.current.position.copy(camera.position).addScaledVector(fwd, 3);
      const m = flashRef.current.material as THREE.SpriteMaterial;
      m.opacity = tau > 0 ? smooth(0, 0.04, tau) * (1 - smooth(0.04, 0.6, tau)) * 0.9 : 0;
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

    // Closing glow: a soft white centre fading up in the last beat so
    // the final frame matches the veil the homepage dissolves out of.
    if (finalRef.current) {
      finalRef.current.position.copy(camera.position).addScaledVector(fwd, 3);
      const m = finalRef.current.material as THREE.SpriteMaterial;
      const k = smooth(STAR_DURATION - 1.1, STAR_DURATION - 0.15, t);
      // Swells past the frame and reaches full opacity, so the last canvas
      // frame is solid white — the same white the hand-off veil starts from.
      finalRef.current.scale.setScalar(14 + k * 110);
      m.opacity = k;
    }
  });

  return (
    <group>
      {/* The star: plasma sphere + stacked glow + faint rays. */}
      <mesh ref={coreRef} position={STAR_POS}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial
          ref={starMatRef}
          vertexShader={starVertex}
          fragmentShader={starFragment}
          uniforms={starUniforms}
        />
      </mesh>

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

      {/* The cosmos: one GPU-simulated point cloud. */}
      <points geometry={geometry} position={STAR_POS} frustumCulled={false}>
        <shaderMaterial
          ref={blastMatRef}
          vertexShader={blastVertex}
          fragmentShader={blastFragment}
          uniforms={blastUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

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

      {/* Screen-space flash and closing glow. */}
      <sprite ref={flashRef} scale={[34, 34, 1]} renderOrder={10}>
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
