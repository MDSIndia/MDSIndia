"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getLeafCardTexture } from "./leafTexture";
import { getBarkTexture } from "./barkTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Left side of the road, in the gap between NoorvaTower's own
// clearance zone (z=-27, ±8) and Waterfall's (z=-72, ±10) — see
// landmarkClearance.ts, which keeps CityScape's procedural buildings
// out of this whole z-band on this side so the park reads as an actual
// open gap in the skyline rather than squeezed between towers.
const PARK_POSITION: [number, number, number] = [-16, 0, -48];
const PARK_RADIUS = 12;
const TREE_COUNT = 9;
const CANOPY_COLORS = ["#3fae7a", "#4fd6a0", "#2f8a5a", "#5fd6c0"];
const BUSH_GREENS = ["#2f6b3a", "#3a7d44", "#4f9e5f"];
const FLOWER_COLORS = ["#ff9ecb", "#c98bff", "#ffd88f", "#8fe0ff"];
// Same lit mid-tone clothing/skin palette Pedestrians.tsx/BusStop.tsx
// use — a near-black figure reads as invisible against a night scene,
// see those files' own comments for why.
const CLOTHING_COLORS = ["#5a6b85", "#7a6a58", "#4a5a4a", "#6a5868", "#5a7080", "#8a7860"];
const SKIN_TONES = ["#c9a888", "#8a6248", "#e0b898", "#6a4a38"];

let cachedGrassTexture: THREE.Texture | null = null;

/** A blotchy multi-tone grass fill with a single hand-drawn winding
 * path baked in — real grass isn't a flat color, and a winding path
 * reads as an actual place someone walks rather than the perfect
 * concentric rings this used to have. Drawn once onto a canvas rather
 * than built from real path geometry — cheap, and a painted path
 * curve can be as organic as a brush stroke where real spline geometry
 * would take real work to match. */
function getGrassTexture(): THREE.Texture {
  if (cachedGrassTexture) return cachedGrassTexture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1c3524";
  ctx.fillRect(0, 0, size, size);

  // Blotchy tonal variation — real turf is patchy, not a flat fill.
  for (let i = 0; i < 220; i++) {
    const x = seeded(i, 901) * size;
    const y = seeded(i, 902) * size;
    const r = 14 + seeded(i, 903) * 46;
    const tone = seeded(i, 904);
    const shade =
      tone > 0.6 ? "rgba(79,214,160,0.05)" : tone > 0.3 ? "rgba(24,58,38,0.12)" : "rgba(58,125,68,0.07)";
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A single winding path from one edge, curving through the middle,
  // out to another edge — a real place to walk, not a geometric ring.
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.strokeStyle = "rgba(120,150,130,0.9)";
  ctx.lineWidth = 30;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-size * 0.46, size * 0.1);
  ctx.bezierCurveTo(-size * 0.2, size * 0.32, -size * 0.1, -size * 0.05, size * 0.05, -size * 0.12);
  ctx.bezierCurveTo(size * 0.22, -size * 0.2, size * 0.18, size * 0.22, size * 0.44, size * 0.28);
  ctx.stroke();

  // Glowing centerline over the path.
  ctx.strokeStyle = "rgba(140,230,200,0.55)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-size * 0.46, size * 0.1);
  ctx.bezierCurveTo(-size * 0.2, size * 0.32, -size * 0.1, -size * 0.05, size * 0.05, -size * 0.12);
  ctx.bezierCurveTo(size * 0.22, -size * 0.2, size * 0.18, size * 0.22, size * 0.44, size * 0.28);
  ctx.stroke();

  // A short spur branching off toward the fountain at center.
  ctx.strokeStyle = "rgba(120,150,130,0.9)";
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(size * 0.05, -size * 0.12);
  ctx.quadraticCurveTo(size * 0.02, -size * 0.02, 0, 0);
  ctx.stroke();
  ctx.strokeStyle = "rgba(140,230,200,0.5)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(size * 0.05, -size * 0.12);
  ctx.quadraticCurveTo(size * 0.02, -size * 0.02, 0, 0);
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedGrassTexture = texture;
  return texture;
}

/** A street-level public park — the one genuinely open, green,
 * low-density space this skyline was otherwise missing among its
 * packed towers and elevated set-pieces. A textured lawn with a real
 * winding path (not a geometric ring), bioluminescent trees of two
 * different silhouettes, shrubs and flower beds for ground-level
 * detail, a lit pond rather than a floating hologram, and a couple of
 * benches/rocks — balancing "actual park" against the same "everything
 * has an accent light" futuristic language the rest of the scene uses.
 * Landmark-clearance-registered (see landmarkClearance.ts) so
 * CityScape's procedural buildings leave this whole area alone. */
export function FuturisticPark() {
  const pondRef = useRef<THREE.Mesh>(null);
  const rippleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mistRef = useRef<THREE.InstancedMesh>(null);
  const canopyGlowRefs = useRef<(THREE.Mesh | null)[]>([]);

  const grassTexture = useMemo(() => getGrassTexture(), []);
  const leafTexture = useMemo(() => getLeafCardTexture(), []);
  const barkTexture = useMemo(() => getBarkTexture(), []);

  const trees = useMemo(
    () =>
      Array.from({ length: TREE_COUNT }, (_, i) => {
        const angle = seeded(i, 801) * Math.PI * 2;
        const radius = PARK_RADIUS * (0.4 + seeded(i, 802) * 0.5);
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          trunkHeight: 1.3 + seeded(i, 803) * 1.1,
          trunkLean: (seeded(i, 806) - 0.5) * 0.14,
          canopyRadius: 0.65 + seeded(i, 804) * 0.5,
          conical: seeded(i, 807) > 0.55,
          color: CANOPY_COLORS[i % CANOPY_COLORS.length],
          phase: seeded(i, 805) * Math.PI * 2,
        };
      }),
    []
  );

  const bushes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = seeded(i, 821) * Math.PI * 2;
        const radius = PARK_RADIUS * (0.25 + seeded(i, 822) * 0.68);
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          scale: 0.28 + seeded(i, 823) * 0.22,
          color: BUSH_GREENS[i % BUSH_GREENS.length],
        };
      }),
    []
  );

  const flowerBeds = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const angle = seeded(i, 831) * Math.PI * 2;
        const radius = PARK_RADIUS * (0.3 + seeded(i, 832) * 0.55);
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          blooms: Array.from({ length: 6 }, (_, b) => ({
            dx: (seeded(i * 6 + b, 833) - 0.5) * 1.1,
            dz: (seeded(i * 6 + b, 834) - 0.5) * 1.1,
            color: FLOWER_COLORS[(i * 6 + b) % FLOWER_COLORS.length],
          })),
        };
      }),
    []
  );

  const rocks = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => {
        const angle = seeded(i, 841) * Math.PI * 2;
        const radius = PARK_RADIUS * (0.55 + seeded(i, 842) * 0.3);
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          scale: 0.3 + seeded(i, 843) * 0.25,
          rot: seeded(i, 844) * Math.PI,
        };
      }),
    []
  );

  const benches = useMemo(
    () => [
      { x: 2.4, z: -2.0, rot: 0.6 },
      { x: -3.0, z: 1.6, rot: -1.1 },
    ],
    []
  );

  // Café tables with stool seating — 3 tables, each with 3 chairs
  // around it, spaced apart from the trees/bushes/rocks/benches above
  // (own seed salts) so they land in genuinely open lawn.
  const tables = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => {
        const angle = seeded(i, 851) * Math.PI * 2;
        const radius = PARK_RADIUS * (0.32 + seeded(i, 852) * 0.28);
        const chairs = Array.from({ length: 3 }, (_, c) => {
          const chairAngle = (c / 3) * Math.PI * 2 + seeded(i * 3 + c, 853) * 0.3;
          return {
            dx: Math.cos(chairAngle) * 0.62,
            dz: Math.sin(chairAngle) * 0.62,
            angle: chairAngle,
            // Roughly a third of chairs have someone sitting in them —
            // a fully-occupied table at every seat reads as staged;
            // partial occupancy reads as a real place people happen to
            // be.
            occupied: seeded(i * 3 + c, 854) > 0.62,
            clothing: CLOTHING_COLORS[Math.floor(seeded(i * 3 + c, 855) * CLOTHING_COLORS.length)],
            skin: SKIN_TONES[Math.floor(seeded(i * 3 + c, 856) * SKIN_TONES.length)],
          };
        });
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          chairs,
        };
      }),
    []
  );

  // A few people strolling a short stretch of the path — a slow
  // back-and-forth drift between two anchor points rather than a full
  // recycle loop, the same "believable local motion" approach
  // Pedestrians.tsx uses for the sidewalk population, just contained
  // to the park's own footprint.
  const walkers = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => {
        const angle = seeded(i, 861) * Math.PI * 2;
        const radius = PARK_RADIUS * (0.35 + seeded(i, 862) * 0.4);
        const spread = 2.2 + seeded(i, 863) * 1.6;
        const dirAngle = seeded(i, 864) * Math.PI * 2;
        return {
          baseX: Math.cos(angle) * radius,
          baseZ: Math.sin(angle) * radius,
          dirX: Math.cos(dirAngle),
          dirZ: Math.sin(dirAngle),
          spread,
          walkFreq: 2.4 + seeded(i, 865) * 0.6,
          speed: 0.35 + seeded(i, 866) * 0.2,
          phase: seeded(i, 867) * Math.PI * 2,
          clothing: CLOTHING_COLORS[Math.floor(seeded(i, 868) * CLOTHING_COLORS.length)],
          skin: SKIN_TONES[Math.floor(seeded(i, 869) * SKIN_TONES.length)],
        };
      }),
    []
  );
  const walkerGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const walkerLegLRefs = useRef<(THREE.Mesh | null)[]>([]);
  const walkerLegRRefs = useRef<(THREE.Mesh | null)[]>([]);

  const lamps = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + 0.3;
        const radius = PARK_RADIUS * 0.72;
        return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
      }),
    []
  );

  const mistData = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: seeded(i, 811) * Math.PI * 2,
        radius: 0.3 + seeded(i, 812) * 0.9,
        speed: 0.3 + seeded(i, 813) * 0.4,
        phase: seeded(i, 814) * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pondRef.current) {
      const mat = pondRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 0.6) * 0.06;
    }
    rippleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const cycle = ((t * 0.25 + i * 0.5) % 2) / 2;
      const s = 0.5 + cycle * 1.6;
      mesh.scale.set(s, s, s);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 * (1 - cycle);
    });
    canopyGlowRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(t * 0.8 + trees[i].phase) * 0.06;
    });

    const mesh = mistRef.current;
    if (mesh) {
      const dummy = new THREE.Object3D();
      mistData.forEach((m, i) => {
        const cycle = ((t * m.speed + m.phase) % 2) / 2;
        const r = m.radius * (1 - cycle * 0.3);
        dummy.position.set(
          PARK_POSITION[0] + Math.cos(m.angle) * r,
          0.1 + cycle * 1.2,
          PARK_POSITION[2] + Math.sin(m.angle) * r
        );
        const s = 0.28 * (1 - cycle * 0.5);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    walkers.forEach((w, i) => {
      const group = walkerGroupRefs.current[i];
      if (!group) return;
      // Back-and-forth drift along the walker's own line rather than a
      // one-way crossing — a park stroll doesn't need to go anywhere in
      // particular.
      const cycle = Math.sin(t * w.speed + w.phase);
      group.position.set(
        w.baseX + w.dirX * cycle * w.spread,
        Math.abs(Math.sin(t * w.walkFreq + w.phase)) * 0.03,
        w.baseZ + w.dirZ * cycle * w.spread
      );
      // Face the direction of travel — flips at each end of the walk
      // as `cycle`'s own derivative changes sign.
      const facing = Math.cos(t * w.speed + w.phase) >= 0 ? 1 : -1;
      group.rotation.y = Math.atan2(w.dirX * facing, w.dirZ * facing);

      const swing = Math.sin(t * w.walkFreq + w.phase) * 0.14;
      const legL = walkerLegLRefs.current[i];
      const legR = walkerLegRRefs.current[i];
      if (legL) legL.position.z = swing;
      if (legR) legR.position.z = -swing;
    });
  });

  return (
    <group position={PARK_POSITION}>
      {/* Textured lawn with the winding path baked in — see
          getGrassTexture above. */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PARK_RADIUS, 40]} />
        <meshLambertMaterial map={grassTexture} fog />
      </mesh>

      {/* Lit pond — a soft glowing water disc with expanding ripple
          rings, standing in for a real reflective water surface rather
          than a floating hologram orb. */}
      <mesh ref={pondRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 28]} />
        <meshBasicMaterial
          color="#4fb8d6"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 28]} />
        <meshPhongMaterial color="#0a2a30" specular="#6fc3f0" shininess={80} transparent opacity={0.6} fog />
      </mesh>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          position={[0, 0.025, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          ref={(el) => {
            rippleRefs.current[i] = el;
          }}
        >
          <ringGeometry args={[1, 1.03, 32]} />
          <meshBasicMaterial
            color="#bfe8ff"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <instancedMesh ref={mistRef} args={[undefined, undefined, mistData.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color="#dff3ff"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Bioluminescent trees — round or conical canopies, a slight
          per-tree trunk lean, and a soft internal glow layer, so this
          reads as varied futuristic planting rather than a repeated
          asset. */}
      {trees.map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]} rotation={[0, 0, tree.trunkLean]}>
          <mesh position={[0, tree.trunkHeight / 2, 0]}>
            <cylinderGeometry args={[0.08, 0.14, tree.trunkHeight, 6]} />
            <meshLambertMaterial map={barkTexture} color="#2a3a2e" fog />
          </mesh>
          {tree.conical ? (
            <mesh position={[0, tree.trunkHeight + tree.canopyRadius * 0.9, 0]}>
              <coneGeometry args={[tree.canopyRadius * 0.85, tree.canopyRadius * 2.1, 9]} />
              <meshLambertMaterial color={tree.color} fog />
            </mesh>
          ) : (
            // Several overlapping textured leaf cards rather than solid
            // spheres — the same fix applied everywhere else in this
            // scene (StreetTrees/TreeOfLife/CityScape/SkyBridges/
            // Biodome) at explicit "well defined and futuristic"
            // request: this park's own broadleaf canopies were the one
            // place still using smooth geometric primitives, which
            // reads as artificial no matter how many lobes are
            // clustered. A painted, alpha-cutout leaf-cluster
            // silhouette gives an irregular, non-geometric edge
            // instead.
            [0, 1, 2, 3, 4].map((l) => {
              const isCore = l === 0;
              const angle = seeded(tree.x * 7 + tree.z * 3, l * 91 + 1) * Math.PI * 2;
              const dist = isCore ? 0 : tree.canopyRadius * (0.35 + seeded(l, tree.x * 3 + 401) * 0.4);
              const s = isCore ? 1.3 : 0.75 + seeded(l, tree.x * 3 + 402) * 0.5;
              return (
                <mesh
                  key={l}
                  position={[
                    Math.cos(angle) * dist,
                    tree.trunkHeight + tree.canopyRadius * 0.7 + (isCore ? 0 : -tree.canopyRadius * 0.15),
                    Math.sin(angle) * dist,
                  ]}
                  rotation={[
                    seeded(l, tree.x * 3 + 403) * Math.PI,
                    seeded(l, tree.x * 3 + 404) * Math.PI,
                    seeded(l, tree.x * 3 + 405) * Math.PI,
                  ]}
                  scale={tree.canopyRadius * s}
                >
                  <planeGeometry args={[1, 1]} />
                  <meshLambertMaterial
                    map={leafTexture}
                    color={isCore ? tree.color : new THREE.Color(tree.color).multiplyScalar(0.85)}
                    alphaTest={0.45}
                    side={THREE.DoubleSide}
                    fog
                  />
                </mesh>
              );
            })
          )}
          <mesh
            position={[0, tree.trunkHeight + tree.canopyRadius * 0.8, 0]}
            ref={(el) => {
              canopyGlowRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[tree.canopyRadius * 1.2, 10, 10]} />
            <meshBasicMaterial
              color={tree.color}
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
              side={THREE.BackSide}
            />
          </mesh>
          {/* A couple of small glowing crystal-leaf accents nested in
              the canopy — the same bioluminescent-tech detail
              StreetTrees/TreeOfLife carry, extended here so this park's
              own trees read as part of the same futuristic planting
              language rather than a plainer variant. */}
          {!tree.conical &&
            [0, 1].map((c) => {
              const angle = seeded(tree.x * 5 + tree.z * 2, c * 63 + 501) * Math.PI * 2;
              const dist = tree.canopyRadius * (0.3 + seeded(c, tree.x * 4 + 502) * 0.5);
              return (
                <mesh
                  key={c}
                  position={[
                    Math.cos(angle) * dist,
                    tree.trunkHeight + tree.canopyRadius * (0.6 + seeded(c, tree.x * 4 + 503) * 0.6),
                    Math.sin(angle) * dist,
                  ]}
                  rotation={[seeded(c, 504) * Math.PI, seeded(c, 505) * Math.PI, 0]}
                  scale={0.06 + seeded(c, tree.x * 4 + 506) * 0.04}
                >
                  <octahedronGeometry args={[1, 0]} />
                  <meshBasicMaterial
                    color="#6fd6ff"
                    transparent
                    opacity={0.75}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    fog={false}
                    toneMapped={false}
                  />
                </mesh>
              );
            })}
        </group>
      ))}

      {/* Shrubs — small clustered blobs scattered at ground level, the
          "actual undergrowth" a park needs beyond just trees. */}
      {bushes.map((bush, i) => (
        <group key={i} position={[bush.x, 0, bush.z]} scale={bush.scale}>
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshLambertMaterial color={bush.color} fog />
          </mesh>
          <mesh position={[0.28, 0.25, 0.1]}>
            <sphereGeometry args={[0.34, 7, 7]} />
            <meshLambertMaterial color={bush.color} fog />
          </mesh>
          <mesh position={[-0.24, 0.22, -0.15]}>
            <sphereGeometry args={[0.3, 7, 7]} />
            <meshLambertMaterial color={bush.color} fog />
          </mesh>
        </group>
      ))}

      {/* Flower beds — small clusters of colored blooms, the one
          non-green ground-level color this park otherwise lacks. */}
      {flowerBeds.map((bed, bi) => (
        <group key={bi} position={[bed.x, 0.1, bed.z]}>
          {bed.blooms.map((bloom, i) => (
            <mesh key={i} position={[bloom.dx, 0, bloom.dz]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshBasicMaterial color={bloom.color} toneMapped={false} fog={false} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Rocks/boulders for natural ground texture. */}
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={[rock.x, rock.scale * 0.35, rock.z]}
          rotation={[0.2, rock.rot, 0.1]}
          scale={rock.scale}
        >
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshLambertMaterial color="#3a3f45" fog />
        </mesh>
      ))}

      {/* Benches along the path. */}
      {benches.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[1.1, 0.06, 0.36]} />
            <meshLambertMaterial color="#4a3628" fog />
          </mesh>
          <mesh position={[0, 0.5, -0.15]}>
            <boxGeometry args={[1.1, 0.4, 0.05]} />
            <meshLambertMaterial color="#4a3628" fog />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.48, 0.14, 0]}>
              <boxGeometry args={[0.06, 0.28, 0.34]} />
              <meshLambertMaterial color="#1c1e22" fog />
            </mesh>
          ))}
        </group>
      ))}

      {/* Café tables — a round top on a central pedestal, a small
          warm glow standing in for a table lamp, and 3 stool seats
          around each, some occupied (see tables above). */}
      {tables.map((table, ti) => (
        <group key={ti} position={[table.x, 0, table.z]}>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.05, 16]} />
            <meshLambertMaterial color="#2a2d34" fog />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 0.68, 8]} />
            <meshLambertMaterial color="#1c1e22" fog />
          </mesh>
          <mesh position={[0, 0.76, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial
              color="#ffdca8"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>

          {table.chairs.map((chair, ci) => (
            <group key={ci} position={[chair.dx, 0, chair.dz]} rotation={[0, chair.angle + Math.PI, 0]}>
              <mesh position={[0, 0.42, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 10]} />
                <meshLambertMaterial color="#2a2d34" fog />
              </mesh>
              <mesh position={[0, 0.21, 0]}>
                <cylinderGeometry args={[0.03, 0.045, 0.4, 6]} />
                <meshLambertMaterial color="#1c1e22" fog />
              </mesh>

              {chair.occupied && (
                <group position={[0, 0.44, 0]}>
                  <mesh position={[0, 0.22, 0]}>
                    <boxGeometry args={[0.32, 0.4, 0.2]} />
                    <meshPhongMaterial color={chair.clothing} specular="#3a4048" shininess={18} fog />
                  </mesh>
                  <mesh position={[0, 0.5, 0]}>
                    <sphereGeometry args={[0.13, 10, 10]} />
                    <meshPhongMaterial color={chair.skin} specular="#4a4038" shininess={12} fog />
                  </mesh>
                </group>
              )}
            </group>
          ))}
        </group>
      ))}

      {/* A few people strolling the park's own path (see walkers
          above/the useFrame animation driving these groups). */}
      {walkers.map((w, i) => (
        <group
          key={i}
          ref={(el) => {
            walkerGroupRefs.current[i] = el;
          }}
        >
          <mesh position={[0, 1.19, 0]}>
            <boxGeometry args={[0.34, 0.58, 0.2]} />
            <meshPhongMaterial color={w.clothing} specular="#3a4048" shininess={18} fog />
          </mesh>
          <mesh position={[0, 1.635, 0]}>
            <sphereGeometry args={[0.155, 10, 10]} />
            <meshPhongMaterial color={w.skin} specular="#4a4038" shininess={12} fog />
          </mesh>
          <mesh position={[-0.09, 0.475, 0]} ref={(el) => (walkerLegLRefs.current[i] = el)}>
            <boxGeometry args={[0.11, 0.95, 0.11]} />
            <meshPhongMaterial color={w.clothing} specular="#2a3038" shininess={16} fog />
          </mesh>
          <mesh position={[0.09, 0.475, 0]} ref={(el) => (walkerLegRRefs.current[i] = el)}>
            <boxGeometry args={[0.11, 0.95, 0.11]} />
            <meshPhongMaterial color={w.clothing} specular="#2a3038" shininess={16} fog />
          </mesh>
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.4, 12]} />
            <meshBasicMaterial
              color="#eaf0f5"
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Lamp posts ringing the park. */}
      {lamps.map((lamp, i) => (
        <group key={i} position={[lamp.x, 0, lamp.z]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 2.2, 6]} />
            <meshLambertMaterial color="#1a1c22" fog />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshBasicMaterial
              color="#ffdca8"
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Ground contact shadow ring around the whole park, same
          treatment every structure in this scene gets. */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PARK_RADIUS * 0.97, PARK_RADIUS * 1.05, 32]} />
        <meshBasicMaterial color="#0f1a14" transparent opacity={0.4} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
