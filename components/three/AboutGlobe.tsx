"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// One full turn every 18s.
const SPIN_SECONDS = 18;
// Clouds drift a little faster than the ground beneath them.
const CLOUD_EXTRA = 1.18;

// Ground comes from NASA's Blue Marble map (public domain, public/earth-map.jpg),
// wrapped onto the sphere by longitude/latitude, so continents are the
// real shapes in the real places. Clouds are still generated in the
// shader from 3D noise (no seam or pole pinching) and drift on their
// own layer.
const noiseGLSL = /* glsl */ `
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
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * noise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.3);
      a *= 0.5;
    }
    return s;
  }
`;

const vertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vPos = normalize(position);
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

// Sun sits up-left and slightly toward the viewer, in view space, so the
// terminator stays put while the continents turn through it.
const lightGLSL = /* glsl */ `
  const vec3 LIGHT = normalize(vec3(-0.55, 0.45, 0.7));
`;

const planetFragment = /* glsl */ `
  uniform sampler2D map;
  varying vec3 vPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  ${noiseGLSL}
  ${lightGLSL}
  const float PI = 3.14159265359;
  void main() {
    vec3 p = normalize(vPos);

    // Longitude 0 faces the camera at rest (u = 0.5); east is +x, so the
    // map reads the right way round and spins west → east like Earth.
    vec2 uv = vec2(atan(p.x, p.z) / (2.0 * PI) + 0.5, asin(clamp(p.y, -1.0, 1.0)) / PI + 0.5);
    vec3 tex = texture2D(map, uv).rgb;

    // The map's ocean is a flat navy; tell it apart from land by how
    // blue-dominant it is, then repaint it with depth variation.
    float oceanness = smoothstep(0.03, 0.10, tex.b - max(tex.r, tex.g));
    float depthN = fbm(p * 3.0 + 2.0);
    vec3 deep = vec3(0.010, 0.075, 0.26);
    vec3 shallow = vec3(0.035, 0.27, 0.58);
    vec3 ocean = mix(deep, shallow, smoothstep(0.30, 0.70, depthN));

    // Land: the satellite colours, lifted a touch so they read at this size.
    vec3 landCol = pow(tex, vec3(0.9)) * 1.18;
    float ice = smoothstep(0.62, 0.8, min(tex.r, min(tex.g, tex.b)));
    vec3 surface = mix(landCol, ocean, oceanness);

    vec3 N = normalize(vNormalV);
    vec3 V = normalize(vViewDir);
    float ndl = dot(N, LIGHT);

    // Day/night: soft terminator, dark side keeps a hint of blue.
    float day = smoothstep(-0.18, 0.55, ndl);
    vec3 lit = surface * mix(0.10, 1.12, day);

    // Sun glint on open water.
    float spec = pow(max(dot(reflect(-LIGHT, N), V), 0.0), 70.0);
    lit += vec3(0.75, 0.88, 1.0) * spec * 0.5 * oceanness * (1.0 - ice) * day;

    // Atmosphere: blue haze toward the limb, strongest on the sunlit side.
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.4);
    lit += vec3(0.25, 0.55, 1.0) * fres * (0.30 + 0.75 * day);

    gl_FragColor = vec4(lit, 1.0);
  }
`;

const cloudFragment = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  ${noiseGLSL}
  ${lightGLSL}
  void main() {
    vec3 p = normalize(vPos);
    vec3 warp = vec3(noise(p * 3.0), noise(p * 3.0 + 7.0), noise(p * 3.0 + 13.0));
    float c = fbm(p * 2.6 + 0.6 * warp + 40.0);
    float density = smoothstep(0.54, 0.74, c);

    vec3 N = normalize(vNormalV);
    float day = smoothstep(-0.2, 0.5, dot(N, LIGHT));
    vec3 col = vec3(1.0) * mix(0.08, 1.0, day);
    // Cloud tops catch a little blue from the sky on the lit limb.
    col += vec3(0.05, 0.1, 0.2) * pow(1.0 - clamp(dot(N, normalize(vViewDir)), 0.0, 1.0), 2.0);

    gl_FragColor = vec4(col, density * 0.8);
  }
`;

function useEarthMap() {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tex: THREE.Texture | null = null;
    new THREE.TextureLoader().load("/earth-map.jpg", (t) => {
      if (cancelled) {
        t.dispose();
        return;
      }
      // No mipmaps: with them, the longitude wrap (atan jumps from 1 to 0)
      // makes the GPU pick the blurriest level along a one-pixel seam line.
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      // Left as NoColorSpace on purpose: the shader outputs sampled values
      // untouched, so the map's colours come through as authored.
      tex = t;
      setMap(t);
    });
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, []);

  return map;
}

function Planet({ map }: { map: THREE.Texture }) {
  const ground = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);

  // Positive Y rotation carries the front face toward +X: left → right.
  useFrame((_, delta) => {
    const step = (delta * Math.PI * 2) / SPIN_SECONDS;
    if (ground.current) ground.current.rotation.y += step;
    if (clouds.current) clouds.current.rotation.y += step * CLOUD_EXTRA;
  });

  return (
    <group rotation={[0.2, 0, -0.06]}>
      <mesh ref={ground}>
        <sphereGeometry args={[1, 96, 72]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={planetFragment}
          uniforms={{ map: { value: map } }}
        />
      </mesh>
      <mesh ref={clouds} scale={1.014} renderOrder={1}>
        <sphereGeometry args={[1, 96, 72]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={cloudFragment}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * A real 3D, Earth-like planet spinning about its vertical axis. Fills
 * its parent (which should be square) edge to edge, and stops rendering
 * while scrolled out of view.
 */
export default function AboutGlobe() {
  const map = useEarthMap();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "100px",
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Camera distance 6 → silhouette half-angle asin(1/6); a fov of exactly
  // twice that makes the sphere touch the canvas edges, so the canvas
  // lines up with the ball's disc in the artwork. The clouds sit 1.4%
  // above the surface, so their outermost sliver is clipped by the
  // page's circular wrapper — preferable to a gap at the planet's edge.
  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        flat
        frameloop={inView ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 19.19, near: 0.1, far: 20 }}
        gl={{ alpha: true, antialias: true, powerPreference: "default" }}
        style={{ background: "transparent" }}
      >
        {map && <Planet map={map} />}
      </Canvas>
    </div>
  );
}
