"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBarkTexture } from "./barkTexture";
import { getLeafCardTexture } from "./leafTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Early in the route (camera starts at z=46) and on the left. Pulled
// in from x=-18 to x=-13 — much closer to the camera's own straight
// path down the road (x=0 the whole flight) — and made larger, at
// explicit request that this landmark be unmistakable: the other
// landmarks in this scene sit further out (x=16-27) and still read
// clearly, but this is the one the "make it exactly like this image"
// feedback kept coming back to, so it gets the closest, largest
// placement of any of them rather than sharing their more modest
// scale. Still well clear of every other landmark's own clearance zone
// — see landmarkClearance.ts, which also keeps CityScape's procedural
// buildings out of this whole area so the tree reads as an actual
// monument rather than something buried in the skyline.
const POSITION: [number, number, number] = [-13, 0, 20];
const TRUNK_HEIGHT = 8.5;
// Widened from 3.4 — a real broadleaf/oak-style "tree of life" spreads
// far wider than its own trunk, which a narrower canopy read as more
// like a conifer than the reference's wide, top-heavy crown. Raised
// again alongside the closer placement above for a landmark that
// dominates its stretch of the route the way the reference image's
// tree dominates its own frame.
const CANOPY_RADIUS = 5.2;
const CANOPY_Y = TRUNK_HEIGHT + 1.4;
const GLOW_BLUE = "#6fd6ff";
const CANOPY_GREENS = ["#3a7d44", "#4f9e5f", "#2f6b3a", "#5aa668", "#6fbf7a"];

/** Orients a Y-axis-aligned geometry (a cylinder's default long axis)
 * to run from `start` to `end` — returns the midpoint position and the
 * quaternion that rotates local +Y onto that direction, using three's
 * own `setFromUnitVectors` rather than hand-derived trig (the roots
 * below reuse a hand-verified flat-only version of this same problem;
 * branches need the general 3D case since they angle both outward and
 * upward). */
function segmentTransform(start: THREE.Vector3, end: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  dir.normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir
  );
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  return { position, quaternion, length };
}

/** A single monumental "tree of life" landmark — a direct 3D build of
 * a specific reference image (a huge braided, glowing-veined trunk;
 * thick luminous roots splaying into the ground; a large lush
 * many-lobed canopy studded with glowing crystal leaves; a few birds
 * circling) rather than the same treatment scaled down across the many
 * small roadside StreetTrees, which read as too subtle to register at
 * flythrough speed/distance. This is sized and detailed like this
 * scene's other landmarks (the MDS sphere, NoorvaTower, Biodome) so it
 * gets the same "impossible to miss" treatment. */
export function TreeOfLife() {
  const barkTexture = useMemo(() => getBarkTexture(), []);
  const leafTexture = useMemo(() => getLeafCardTexture(), []);
  const veinMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const crystalGroupRefs = useRef<(THREE.Mesh | null)[]>([]);
  const birdGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const canopyLobeRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Three intertwined strands winding up the trunk — a cheap stand-in
  // for a real braided/twisted trunk mesh: three helixes of small
  // overlapping capsule-ish segments spiraling around the trunk's own
  // central axis.
  const braidSegments = useMemo(() => {
    const segs: { y: number; angle: number; strand: number }[] = [];
    const perStrand = 14;
    for (let strand = 0; strand < 3; strand++) {
      for (let s = 0; s < perStrand; s++) {
        const t = s / (perStrand - 1);
        segs.push({
          y: t * TRUNK_HEIGHT * 0.92,
          angle: t * Math.PI * 3.2 + (strand / 3) * Math.PI * 2,
          strand,
        });
      }
    }
    return segs;
  }, []);

  // Seven thick branches radiating from the top of the trunk out into
  // the canopy — real geometry connecting trunk to crown, which the
  // previous version was missing entirely (the canopy just floated
  // above the trunk with nothing structural between them).
  const branches = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 7) * Math.PI * 2 + seeded(i, 660) * 0.5;
        const startR = 0.55 + seeded(i, 661) * 0.2;
        const start = new THREE.Vector3(
          Math.cos(angle) * startR,
          TRUNK_HEIGHT * (0.82 + seeded(i, 662) * 0.1),
          Math.sin(angle) * startR
        );
        const reach = CANOPY_RADIUS * (0.55 + seeded(i, 663) * 0.35);
        const end = new THREE.Vector3(
          Math.cos(angle) * reach,
          CANOPY_Y - 0.4 + seeded(i, 664) * 1.2,
          Math.sin(angle) * reach
        );
        return { ...segmentTransform(start, end), baseRadius: 0.22 + seeded(i, 665) * 0.1 };
      }),
    []
  );

  // Raised from 12 fairly large lobes to 30 smaller, denser ones,
  // spread across the wider canopy above — a few big geometric blobs
  // read as abstract; a lot of small overlapping clusters is what
  // actually reads as real, dense foliage texture at any distance
  // close enough to see individual lobes at all.
  const canopyLobes = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const angle = seeded(i, 601) * Math.PI * 2;
        const dist = CANOPY_RADIUS * (i === 0 ? 0 : 0.25 + seeded(i, 602) * 0.72);
        return {
          x: Math.cos(angle) * (i === 0 ? 0 : dist),
          z: Math.sin(angle) * (i === 0 ? 0 : dist),
          y: i === 0 ? 0.2 : (seeded(i, 603) - 0.35) * CANOPY_RADIUS * 0.6,
          scale: i === 0 ? 0.75 : 0.22 + seeded(i, 604) * 0.2,
          color: CANOPY_GREENS[i % CANOPY_GREENS.length],
          // Full 3D rotation, not just around Y — a plane card needs to
          // face many different directions for the cluster to read as
          // volumetric from any angle rather than a fan of flat cards
          // all edge-on to the camera at once.
          rotX: seeded(i, 605) * Math.PI,
          rotY: seeded(i, 606) * Math.PI,
          rotZ: seeded(i, 607) * Math.PI,
          // Own wind-sway phase/speed per lobe — see the useFrame loop
          // below. Deliberately not shared across lobes (let alone with
          // StreetTrees' own trees) so this landmark's crown doesn't
          // flutter in the same synchronized-clock way the antenna
          // beacons used to blink.
          swayPhase: seeded(i, 608) * Math.PI * 2,
          swaySpeed: 0.6 + seeded(i, 609) * 0.5,
          swayAmplitude: 0.04 + seeded(i, 610) * 0.05,
        };
      }),
    []
  );

  const crystals = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = seeded(i, 611) * Math.PI * 2;
        const dist = CANOPY_RADIUS * (0.25 + seeded(i, 612) * 0.85);
        return {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          y: (seeded(i, 613) - 0.25) * CANOPY_RADIUS * 0.9,
          scale: 0.14 + seeded(i, 614) * 0.12,
          phase: seeded(i, 615) * Math.PI * 2,
        };
      }),
    []
  );

  const roots = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + seeded(i, 621) * 0.5;
        const len = 3.3 + seeded(i, 622) * 2.0;
        return { angle, len };
      }),
    []
  );

  const tendrils = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = seeded(i, 631) * Math.PI * 2;
        const dist = CANOPY_RADIUS * (0.2 + seeded(i, 632) * 0.6);
        return {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          len: 1.2 + seeded(i, 633) * 2.2,
          phase: seeded(i, 634) * Math.PI * 2,
        };
      }),
    []
  );

  const birds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        radius: 5.8 + seeded(i, 641) * 2.5,
        height: CANOPY_Y + 1 + seeded(i, 642) * 3,
        speed: 0.15 + seeded(i, 643) * 0.15,
        phase: seeded(i, 644) * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const veinPulse = 0.7 + Math.sin(t * 0.8) * 0.25;
    if (veinMatRef.current) veinMatRef.current.opacity = veinPulse;

    crystalGroupRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * 1.1 + crystals[i].phase) * 0.25;
    });

    // Gentle wind sway on the canopy leaf cards — this landmark's
    // crown was otherwise perfectly rigid, which reads as a static prop
    // no matter how organic the leaf-card silhouette is. Same treatment
    // as StreetTrees' own canopy, sized for this tree's larger scale.
    canopyLobeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const lobe = canopyLobes[i];
      const sway = Math.sin(t * lobe.swaySpeed + lobe.swayPhase) * lobe.swayAmplitude;
      mesh.rotation.x = lobe.rotX + sway;
      mesh.rotation.z = lobe.rotZ + sway * 0.6;
    });

    birdGroupRefs.current.forEach((group, i) => {
      if (!group) return;
      const b = birds[i];
      const angle = t * b.speed + b.phase;
      group.position.set(Math.cos(angle) * b.radius, b.height + Math.sin(t * 0.6 + b.phase) * 0.4, Math.sin(angle) * b.radius);
      group.rotation.y = -angle + Math.PI / 2;
      const wingFlap = Math.sin(t * 8 + b.phase) * 0.5;
      group.children.forEach((child, wi) => {
        child.rotation.z = wi === 0 ? wingFlap : -wingFlap;
      });
    });
  });

  return (
    <group position={POSITION}>
      {/* Core trunk — textured bark rather than a flat solid color
          (see barkTexture.ts). */}
      <mesh position={[0, TRUNK_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.85, 1.35, TRUNK_HEIGHT, 10]} />
        <meshLambertMaterial map={barkTexture} color="#4a3a26" fog />
      </mesh>

      {/* Braided strands winding up the trunk. */}
      {braidSegments.map((seg, i) => {
        const r = 1.3 - (seg.y / TRUNK_HEIGHT) * 0.5;
        return (
          <mesh
            key={i}
            position={[Math.cos(seg.angle) * r, seg.y + 0.3, Math.sin(seg.angle) * r]}
            rotation={[0, -seg.angle, Math.PI / 2.3]}
          >
            <capsuleGeometry args={[0.13, 0.55, 3, 6]} />
            <meshLambertMaterial map={barkTexture} color="#4a3a26" fog />
          </mesh>
        );
      })}

      {/* Glowing veins tracing the same spiral, one thin line per
          strand, so the braid reads as lit circuitry rather than plain
          bark rope. */}
      {[0, 1, 2].map((strand) => {
        const points: THREE.Vector3[] = [];
        for (let s = 0; s <= 40; s++) {
          const t = s / 40;
          const y = t * TRUNK_HEIGHT * 0.92 + 0.2;
          const angle = t * Math.PI * 3.2 + (strand / 3) * Math.PI * 2;
          const r = 1.34 - t * 0.52;
          points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        return (
          <mesh key={strand}>
            <tubeGeometry args={[curve, 60, 0.035, 5, false]} />
            <meshBasicMaterial
              ref={strand === 0 ? veinMatRef : undefined}
              color={GLOW_BLUE}
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        );
      })}

      {/* Thick branches connecting the trunk to the canopy — real
          structural geometry rather than the crown floating above the
          trunk with nothing between them. */}
      {branches.map((b, i) => (
        <mesh key={i} position={b.position} quaternion={b.quaternion}>
          <cylinderGeometry args={[b.baseRadius * 0.4, b.baseRadius, b.length, 6]} />
          <meshLambertMaterial map={barkTexture} color="#4a3a26" fog />
        </mesh>
      ))}

      {/* Thick glowing roots splaying from the base into the ground. */}
      {roots.map((root, i) => {
        const midX = Math.cos(root.angle) * root.len * 0.5;
        const midZ = Math.sin(root.angle) * root.len * 0.5;
        return (
          <group key={i}>
            <mesh
              position={[midX, 0.14, midZ]}
              // Same verified formula StreetTrees' own roots use: lays
              // the cylinder flat and points it along
              // (cos(angle), 0, sin(angle)).
              rotation={[-Math.PI / 2, -(Math.PI / 2 + root.angle), 0]}
            >
              <cylinderGeometry args={[0.14, 0.4, root.len, 6]} />
              <meshPhongMaterial color="#241a10" emissive={GLOW_BLUE} emissiveIntensity={0.4} specular="#3a4048" shininess={20} fog />
            </mesh>
            <mesh
              position={[Math.cos(root.angle) * root.len, 0.02, Math.sin(root.angle) * root.len]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.35, 12]} />
              <meshBasicMaterial color={GLOW_BLUE} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {/* Broad glow pool beneath the whole root mass. */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.4, 24]} />
        <meshBasicMaterial color={GLOW_BLUE} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Large lush multi-lobe canopy — textured alpha-cutout leaf
          cards rather than solid icosahedron lobes. Raising subdivision
          only made the lobes smoother spheres; a shape built from
          polygons still reads as geometric no matter how round it is.
          A painted, irregular leaf-cluster silhouette (leafTexture.ts)
          cut out with alphaTest gives the crown a non-geometric edge
          instead — the same fix applied to StreetTrees. */}
      <group position={[0, CANOPY_Y, 0]}>
        {canopyLobes.map((lobe, i) => (
          <mesh
            key={i}
            ref={(el) => {
              canopyLobeRefs.current[i] = el;
            }}
            position={[lobe.x, lobe.y, lobe.z]}
            rotation={[lobe.rotX, lobe.rotY, lobe.rotZ]}
            scale={CANOPY_RADIUS * lobe.scale * 2.2}
          >
            <planeGeometry args={[1, 1]} />
            <meshLambertMaterial map={leafTexture} color={lobe.color} alphaTest={0.45} side={THREE.DoubleSide} fog />
          </mesh>
        ))}

        {/* Glowing crystal-leaf accents scattered through the crown. */}
        {crystals.map((c, i) => (
          <mesh
            key={i}
            position={[c.x, c.y, c.z]}
            scale={c.scale}
            rotation={[seeded(i, 651) * Math.PI, seeded(i, 652) * Math.PI, 0]}
            ref={(el) => {
              crystalGroupRefs.current[i] = el;
            }}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial
              color={GLOW_BLUE}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Thin hanging glowing tendrils drooping from the canopy. */}
        {tendrils.map((tendril, i) => (
          <mesh key={i} position={[tendril.x, -tendril.len / 2, tendril.z]}>
            <cylinderGeometry args={[0.012, 0.02, tendril.len, 4]} />
            <meshBasicMaterial color={GLOW_BLUE} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* A few birds circling the crown. */}
      {birds.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            birdGroupRefs.current[i] = el;
          }}
        >
          <mesh position={[-0.09, 0, 0]}>
            <boxGeometry args={[0.16, 0.015, 0.05]} />
            <meshBasicMaterial color="#0a0a0c" toneMapped={false} fog={false} />
          </mesh>
          <mesh position={[0.09, 0, 0]}>
            <boxGeometry args={[0.16, 0.015, 0.05]} />
            <meshBasicMaterial color="#0a0a0c" toneMapped={false} fog={false} />
          </mesh>
        </group>
      ))}

      {/* Ground contact shadow. */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.4, 24]} />
        <meshBasicMaterial color="#0f1a14" transparent opacity={0.45} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
