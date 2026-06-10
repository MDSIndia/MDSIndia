"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface Props {
  scrollProgress?: number;
}

export function NoorvaOrb({ scrollProgress = 0 }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.18;
      meshRef.current.rotation.z = Math.sin(t * 0.35) * 0.06;
    }
    if (shellRef.current) {
      shellRef.current.rotation.y = -t * 0.08;
    }
  });

  const color = new THREE.Color().lerpColors(
    new THREE.Color("#3b0080"),
    new THREE.Color("#00E5FF"),
    scrollProgress
  );

  return (
    <group>
      <Sphere ref={meshRef} args={[2.2, 48, 48]}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25 + scrollProgress * 0.7}
          distort={0.25 + scrollProgress * 0.12}
          speed={1.8}
          roughness={0.15}
          metalness={0.75}
          transparent
          opacity={0.6 + scrollProgress * 0.15}
        />
      </Sphere>

      <Sphere ref={shellRef} args={[2.35, 24, 24]}>
        <meshBasicMaterial
          color="#00E5FF"
          wireframe
          transparent
          opacity={0.03 + scrollProgress * 0.06}
        />
      </Sphere>

      <pointLight color="#00E5FF" intensity={0.8 + scrollProgress * 1.5} distance={12} />
      <pointLight color="#7B2FBE" intensity={0.4} distance={8} position={[-3, 2, 0]} />
      <ambientLight intensity={0.08} />
    </group>
  );
}
