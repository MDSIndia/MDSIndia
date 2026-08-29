"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Same brand palette NoorvaSection's own orb/gradient uses (see
// components/sections/NoorvaSection.tsx) — blue -> cyan -> violet, so
// this in-world tower reads as the same product identity rather than
// a reskinned generic building.
const NOORVA_BLUE = "#0055FF";
const NOORVA_CYAN = "#00D4FF";
const NOORVA_VIOLET = "#A855F7";

const RADIUS = 2.5;
const HEIGHT = 30;
// Left side of the road, well before the MDS sphere landmark
// (Landmark.tsx sits at x=+24, z=-52) — opposite side and earlier in
// the flight, so the two brand landmarks read as two distinct beats
// rather than competing in the same shot.
const POSITION: [number, number, number] = [-21, 0, -27];
const ORB_Y = HEIGHT + 3.2;
const ORB_RADIUS = 2.1;

let cachedWordmark: THREE.Texture | null = null;

/** A tall vertical "NOORVA" wordmark, drawn once onto a canvas and
 * cached — the same hand-authored-canvas-texture approach the rest of
 * this scene uses (see glowTexture.ts) rather than a static image
 * asset, since no NOORVA-branded image exists in /public. Reads
 * top-to-bottom along the tower's face, gradient-tinted through the
 * same blue -> violet the product's own orb uses. */
function getNoorvaWordmarkTexture(): THREE.Texture {
  if (cachedWordmark) return cachedWordmark;
  const w = 256;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, NOORVA_CYAN);
  grad.addColorStop(0.5, NOORVA_BLUE);
  grad.addColorStop(1, NOORVA_VIOLET);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 168px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = grad;
  ctx.shadowColor = NOORVA_CYAN;
  ctx.shadowBlur = 28;
  ctx.fillText("NOORVA", 0, 0);
  ctx.restore();

  // A thin tagline beneath, same treatment the reference image's
  // NOORVA tower carries under its wordmark.
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "400 34px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(191, 232, 255, 0.85)";
  ctx.fillText("YOUR COMPANION FROM THE FUTURE", 0, 118);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedWordmark = texture;
  return texture;
}

/** The skyline's second brand landmark, alongside the MDS sphere (see
 * Landmark.tsx): a tall dark spire carrying the vertical NOORVA
 * wordmark on its road-facing wall, capped with a small glowing orb
 * echoing NoorvaSection's own product orb — tilted rings, a blue-to-
 * violet gradient core, and a soft halo bloom. Static geometry aside
 * from the orb's slow spin/pulse and the ring's rotation, same as the
 * MDS landmark — the camera's own approach carries the reveal. */
export function NoorvaTower() {
  const wordmarkTexture = useMemo(() => getNoorvaWordmarkTexture(), []);
  const orbWireRef = useRef<THREE.Mesh>(null);
  const orbHaloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const ring2GroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbWireRef.current) orbWireRef.current.rotation.y = t * 0.35;
    if (orbHaloMatRef.current) {
      orbHaloMatRef.current.opacity = 0.3 + Math.sin(t * 1.1) * 0.08;
    }
    if (ringGroupRef.current) ringGroupRef.current.rotation.z = t * 0.5;
    if (ring2GroupRef.current) ring2GroupRef.current.rotation.z = -t * 0.32;
  });

  return (
    <group position={POSITION}>
      {/* Tapered dark-glass spire body. */}
      <mesh position={[0, HEIGHT / 2, 0]}>
        <cylinderGeometry args={[RADIUS * 0.62, RADIUS, HEIGHT, 8, 1]} />
        <meshPhongMaterial
          color="#0a0f22"
          specular="#5a7fd6"
          shininess={65}
          fog
        />
      </mesh>

      {/* Vertical accent ribs, catching the rig light so the spire
          reads as faceted structure rather than a flat cylinder. */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * RADIUS * 0.85, HEIGHT / 2, Math.sin(angle) * RADIUS * 0.85]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.08, HEIGHT * 0.98, 0.18]} />
            <meshBasicMaterial color={NOORVA_CYAN} transparent opacity={0.35} toneMapped={false} fog={false} />
          </mesh>
        );
      })}

      {/* The wordmark, mounted flat on the face pointed back down the
          highway toward the approaching camera (camera travels toward
          -z, this tower sits at z=-27, so the readable face points
          toward +z). */}
      <mesh position={[0, HEIGHT * 0.52, RADIUS * 0.82]}>
        <planeGeometry args={[RADIUS * 1.15, HEIGHT * 0.62]} />
        <meshBasicMaterial
          map={wordmarkTexture}
          transparent
          toneMapped={false}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Product orb, capping the spire. */}
      <group position={[0, ORB_Y, 0]}>
        <mesh>
          <sphereGeometry args={[ORB_RADIUS, 24, 24]} />
          <meshPhongMaterial
            color="#1a1440"
            specular={NOORVA_CYAN}
            shininess={80}
            emissive={NOORVA_BLUE}
            emissiveIntensity={0.55}
            fog
          />
        </mesh>

        <mesh ref={orbWireRef}>
          <icosahedronGeometry args={[ORB_RADIUS * 1.04, 1]} />
          <meshBasicMaterial
            color={NOORVA_CYAN}
            wireframe
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>

        <mesh>
          <sphereGeometry args={[ORB_RADIUS * 1.35, 20, 20]} />
          <meshBasicMaterial
            ref={orbHaloMatRef}
            color={NOORVA_VIOLET}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Two tilted orbital rings, mirroring NoorvaSection's own
            NoorvaOrb — the same "product identity" cue carried from
            the marketing section into the intro's skyline. */}
        <group rotation={[Math.PI / 2.4, 0.3, 0]}>
          <group ref={ringGroupRef}>
            <mesh>
              <torusGeometry args={[ORB_RADIUS * 1.55, ORB_RADIUS * 0.03, 8, 48]} />
              <meshBasicMaterial color={NOORVA_CYAN} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
            </mesh>
          </group>
        </group>
        <group rotation={[Math.PI / 1.9, -0.35, 0.2]}>
          <group ref={ring2GroupRef}>
            <mesh>
              <torusGeometry args={[ORB_RADIUS * 1.8, ORB_RADIUS * 0.025, 8, 48]} />
              <meshBasicMaterial color={NOORVA_VIOLET} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Ground contact shadow, same treatment every structure in this
          scene gets (see CityScape/Landmark). */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RADIUS * 1.6, 20]} />
        <meshBasicMaterial color="#2a1a4a" transparent opacity={0.5} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
