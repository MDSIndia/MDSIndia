"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

export function EarthGlobe() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = state.clock.elapsedTime * 0.07;
    }
  });

  return (
    <group>
      <Stars radius={40} depth={20} count={300} factor={2} fade speed={0.25} />

      <Sphere ref={earthRef} args={[2, 48, 48]}>
        <meshPhongMaterial
          color="#0a1628"
          emissive="#0066FF"
          emissiveIntensity={0.12}
          shininess={20}
        />
      </Sphere>

      {/* Atmospheric layers */}
      <Sphere args={[2.07, 24, 24]}>
        <meshBasicMaterial color="#0066FF" transparent opacity={0.055} side={THREE.BackSide} />
      </Sphere>
      <Sphere args={[2.14, 24, 24]}>
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.025} side={THREE.BackSide} />
      </Sphere>

      <ambientLight intensity={0.2} />
      <pointLight position={[5, 3, 5]} color="#ffffff" intensity={1.2} />
      <pointLight position={[-4, -2, -3]} color="#0066FF" intensity={0.35} />
    </group>
  );
}
