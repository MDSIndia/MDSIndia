"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A real night sky behind the city. Before this the gaps between
 * towers were pure #020208 — an empty void with nothing at the horizon
 * — which is a large part of why the whole shot read as a model on a
 * black stage rather than a place. Now there's a graded sky (deep zenith
 * to a hazy horizon), the warm/magenta light-pollution glow a lit city
 * throws onto the air above it, a few slowly drifting cloud banks that
 * catch that glow from below, and a scatter of faint twinkling stars.
 *
 * Cost: one mesh, one cheap fragment shader. It's drawn *after* the
 * opaque scene (renderOrder) with depth testing on, so every pixel
 * covered by a building/road/prop fails the depth test before the
 * shader runs — only the actual visible sky slivers are ever shaded.
 * No postprocessing, no per-frame buffer work beyond two uniforms and
 * following the camera. */

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpace;
  varying vec3 vDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p = p * 2.07 + vec2(5.2, 1.3);
      a *= 0.5;
    }
    return s;
  }

  // Deep space: no horizon, no glow — pure black with white stars.
  vec4 spaceColor(vec3 d) {
    // True black. Only white stars, in two layers (many faint, a few
    // brighter), twinkling gently.
    vec3 col = vec3(0.0);
    vec3 g1 = d * 260.0;
    float r1 = hash31(floor(g1));
    float s1 = step(0.982, r1) * smoothstep(0.34, 0.0, length(fract(g1) - 0.5));
    vec3 g2 = d * 120.0;
    float r2 = hash31(floor(g2) + 11.0);
    float s2 = step(0.990, r2) * smoothstep(0.30, 0.0, length(fract(g2) - 0.5));
    float tw1 = 0.6 + 0.4 * sin(uTime * (1.2 + r1 * 5.0) + r1 * 50.0);
    float tw2 = 0.7 + 0.3 * sin(uTime * (0.8 + r2 * 3.0) + r2 * 40.0);
    col += vec3(1.0) * s1 * tw1 * 0.8;
    col += vec3(1.0) * s2 * tw2 * 1.2;
    return vec4(col, 1.0);
  }

  void main() {
    vec3 d = normalize(vDir);
    if (uSpace > 0.5) {
      gl_FragColor = spaceColor(d);
      return;
    }
    float elev = d.y;

    // Gradient: hazy blue-grey at the horizon, falling to near-black overhead.
    vec3 horizon = vec3(0.060, 0.100, 0.190);
    vec3 mid     = vec3(0.020, 0.038, 0.094);
    vec3 zenith  = vec3(0.004, 0.008, 0.026);
    float up = clamp(elev, 0.0, 1.0);
    vec3 col = mix(horizon, mid, smoothstep(0.0, 0.32, up));
    col = mix(col, zenith, smoothstep(0.22, 0.85, up));

    // City light-pollution glow hugging the horizon: warm amber low down,
    // shading to magenta higher, uneven along the horizon like real skyline glow.
    float az = atan(d.x, -d.z);
    float unevenness = 0.65 + 0.35 * vnoise(vec2(az * 2.2, 3.0));
    float glow = exp(-abs(elev) * 7.5) * unevenness;
    vec3 glowCol = mix(vec3(0.32, 0.17, 0.12), vec3(0.24, 0.10, 0.30), smoothstep(0.0, 0.22, up));
    col += glowCol * glow * 0.55;

    // Cloud banks: projected onto a flat layer so they thin toward the
    // horizon in perspective, drifting very slowly, lit from below by the glow.
    if (elev > 0.015) {
      vec2 cuv = d.xz / (elev + 0.18) * 0.9 + vec2(uTime * 0.012, uTime * 0.004);
      float c = fbm(cuv);
      float cover = smoothstep(0.50, 0.78, c) * smoothstep(0.015, 0.20, elev);
      float lowLit = exp(-elev * 4.5);
      vec3 cloudCol = mix(vec3(0.030, 0.050, 0.100), glowCol * 1.4 + vec3(0.04, 0.05, 0.09), lowLit);
      col = mix(col, cloudCol, cover * 0.62);
    }

    // Stars: tiny round dots on a 3D grid, faint near the horizon haze and
    // hidden behind clouds' coverage only loosely (they're small).
    vec3 g = d * 210.0;
    vec3 cell = floor(g);
    float r = hash31(cell);
    vec3 local = fract(g) - 0.5;
    float dist = length(local);
    float star = step(0.9935, r) * smoothstep(0.30, 0.0, dist);
    float tw = 0.65 + 0.35 * sin(uTime * (1.4 + r * 6.0) + r * 60.0);
    float starFade = smoothstep(0.10, 0.45, elev);
    col += vec3(0.75, 0.85, 1.0) * star * tw * starFade * 0.9;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SkyDome({ variant = "city" }: { variant?: "city" | "space" }) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSpace: { value: variant === "space" ? 1 : 0 } }),
    [variant]
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    // Sky is infinitely far: glue it to the camera so it never parallaxes.
    if (mesh.current) mesh.current.position.copy(state.camera.position);
  });

  return (
    <mesh ref={mesh} renderOrder={999} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
