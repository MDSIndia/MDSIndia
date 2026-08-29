"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const POSITION: [number, number, number] = [16, 0, -38];
const PLINTH_HEIGHT = 1.4;
const PLINTH_RADIUS = 1.6;
const HALO_Y = PLINTH_HEIGHT + 4.5;

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** A fourth kind of futuristic "place" alongside the MDS sphere,
 * NoorvaTower, Biodome, and SkyPlaza: a projected holographic monument
 * rising off a plinth — an abstract rotating sculpture built from
 * nested wireframe rings and a floating particle halo rather than a
 * physical statue, the literal "Holographic Monuments" a genuinely
 * futuristic streetscape would have in place of bronze civic statuary.
 * Every layer animates (independent rotation speeds, a slow vertical
 * drift, a scanline sweep) so it reads as a live projection rather
 * than a static prop, echoing the same hologram language HoloAds
 * already uses for signage. */
export function HolographicMonument() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const scanMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleGeometry = useMemo(() => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = seeded(i, 611) * Math.PI * 2;
      const radius = 0.9 + seeded(i, 612) * 1.3;
      const height = (seeded(i, 613) - 0.5) * 3.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.4;
    if (ring2Ref.current) ring2Ref.current.rotation.y = t * -0.3;
    if (ring3Ref.current) ring3Ref.current.rotation.x = t * 0.5;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.6;
      const s = 1 + Math.sin(t * 1.2) * 0.06;
      coreRef.current.scale.setScalar(s);
    }
    if (particlesRef.current) particlesRef.current.rotation.y = t * 0.15;
    if (scanRef.current && scanMatRef.current) {
      const cycle = ((t * 0.3) % (Math.PI * 2)) / (Math.PI * 2);
      scanRef.current.position.y = HALO_Y + (0.5 - cycle) * 3.2;
      scanMatRef.current.opacity = 0.3;
    }
  });

  return (
    <group position={POSITION}>
      {/* Plinth the projector sits on. */}
      <mesh position={[0, PLINTH_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[PLINTH_RADIUS * 0.6, PLINTH_RADIUS, PLINTH_HEIGHT, 8]} />
        <meshPhongMaterial color="#14161c" specular="#4a5a70" shininess={40} fog />
      </mesh>
      <mesh position={[0, PLINTH_HEIGHT + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PLINTH_RADIUS * 0.58, 8]} />
        <meshBasicMaterial
          color="#7fe0ff"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <group position={[0, HALO_Y, 0]}>
        {/* Faceted wireframe core — the "sculpture" itself. */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial
            color="#8fe0ff"
            wireframe
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>

        {/* Three independently-tilted, independently-spinning rings —
            reads as an abstract orbital sculpture rather than a plain
            halo. */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[1.6, 0.02, 8, 48]} />
          <meshBasicMaterial color="#6fc3f0" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[0.4, 0, Math.PI / 2.6]}>
          <torusGeometry args={[2.0, 0.018, 8, 48]} />
          <meshBasicMaterial color="#b98bff" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
        <mesh ref={ring3Ref} rotation={[1.1, 0.6, 0]}>
          <torusGeometry args={[1.3, 0.015, 8, 48]} />
          <meshBasicMaterial color="#ffcf8f" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>

        {/* Drifting particle halo — the projected-light "dust" cue that
            separates this from a solid physical sculpture. */}
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial
            color="#bfe8ff"
            size={0.05}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </points>

        {/* Scanline sweep, same cue HoloAds uses for its own signage —
            ties this monument into the same "projected hologram"
            visual language rather than reading as a one-off effect. */}
        <mesh ref={scanRef} scale={[2.6, 0.06, 2.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 24]} />
          <meshBasicMaterial
            ref={scanMatRef}
            color="#eaf6ff"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Ground contact shadow. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PLINTH_RADIUS * 1.4, 20]} />
        <meshBasicMaterial color="#0f1a24" transparent opacity={0.5} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
