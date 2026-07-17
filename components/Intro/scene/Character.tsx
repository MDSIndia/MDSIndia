"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Trail, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { getRadialGlowTexture } from "./glowTexture";

// Exported for reuse by other features that need the same rigged
// human asset (e.g. the About-MDS portal-transition character) without
// re-declaring the URL/target height or risking them drifting apart.
export const MODEL_URL = "/models/character.glb";
// Real-world adult male height in meters (~5'11") — the source rig's
// own units aren't trustworthy, so the model is measured and rescaled
// to this on load rather than assumed.
export const TARGET_HEIGHT = 1.8;

useGLTF.preload(MODEL_URL);

export type Bones = Record<string, THREE.Bone>;

/** Per-frame placement/intensity signals handed off from RiderTrail via
 * a plain ref — these change every animation frame and must never flow
 * through React props/state (that would re-render on every frame). */
export interface RiderMotionState {
  appear: number;
  speedFactor: number;
  finalPush: number;
}

/** Additive local-space Euler offsets (radians) layered on top of each
 * bone's bind pose to sculpt a streamlined "flying glide" silhouette —
 * arms swept back, legs trailing, chest into the dive — instead of the
 * source rig's authored standing/walking pose. This model ships with
 * only a walk cycle, which reads as "running in the air" if played
 * directly (explicitly what this scene must avoid), so the walk
 * animation is never played; the pose is fully hand-authored here. */
const FLY_POSE: Record<string, [number, number, number]> = {
  Skeleton_torso_joint_1: [-0.15, 0, 0],
  torso_joint_3: [-0.26, 0, 0],
  Skeleton_neck_joint_1: [0.22, 0, 0],
  Skeleton_arm_joint_R: [0.08, 0, -0.15],
  Skeleton_arm_joint_R__2_: [0.15, 0, 0],
  "Skeleton_arm_joint_L__4_": [0.08, 0, 0.15],
  "Skeleton_arm_joint_L__3_": [0.15, 0, 0],
  leg_joint_R_1: [0.55, 0, 0],
  leg_joint_R_2: [0.4, 0, 0],
  leg_joint_L_1: [0.55, 0, 0],
  leg_joint_L_2: [0.4, 0, 0],
};

const tmpV1 = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();

/** Which of the four body materials (skin / jacket / pants / shoes —
 * see BODY_MATERIAL_INDEX) each bone belongs to, keyed by bone name.
 * Used to split the single-material source mesh into region-painted
 * groups so the character reads as a dressed person rather than a
 * uniformly-colored suit. */
const BODY_MATERIAL_INDEX = { skin: 0, jacket: 1, pants: 2, shoes: 3 } as const;

function categorizeBone(name: string): number {
  if (name.includes("neck")) return BODY_MATERIAL_INDEX.skin;
  if (name === "Skeleton_arm_joint_R__3_" || name === "Skeleton_arm_joint_L__2_")
    return BODY_MATERIAL_INDEX.skin; // hands
  if (name.includes("leg_joint")) {
    // ...R_1/L_1 = thigh, ...R_2/L_2 = knee/shin -> pants.
    // ...R_3/L_3 = ankle, ...R_5/L_5 = toe -> shoes.
    return name.endsWith("_1") || name.endsWith("_2")
      ? BODY_MATERIAL_INDEX.pants
      : BODY_MATERIAL_INDEX.shoes;
  }
  return BODY_MATERIAL_INDEX.jacket; // torso + upper arms/forearms
}

// How far (in the source mesh's own raw units — roughly 1 unit ≈ the
// scale applied on load, see TARGET_HEIGHT) the jacket/pants surface is
// pushed outward along its own vertex normals, over the fitted body
// beneath. A tailored suit reads as *fitted*, not baggy — this is just
// enough to keep the jacket/trousers from looking painted directly
// onto the skin (a little shoulder structure, a little drape), nowhere
// near the volume an oversized streetwear silhouette would use.
const OVERSIZE_INFLATE: Partial<Record<string, number>> = {
  Skeleton_torso_joint_1: 0.018,
  Skeleton_torso_joint_2: 0.022,
  torso_joint_3: 0.026,
  Skeleton_arm_joint_R: 0.02,
  "Skeleton_arm_joint_L__4_": 0.02,
  Skeleton_arm_joint_R__2_: 0.014,
  "Skeleton_arm_joint_L__3_": 0.014,
  leg_joint_R_1: 0.016,
  leg_joint_L_1: 0.016,
  leg_joint_R_2: 0.012,
  leg_joint_L_2: 0.012,
};

/** Reassigns every triangle of a single-material skinned mesh to one
 * of four material slots (skin/jacket/pants/shoes) based on which bone
 * most influences its vertices — the source asset has no clothing
 * geometry or texture regions of its own, so this is what makes it
 * read as a dressed person instead of a flat-colored mannequin. Pure
 * geometry-group bookkeeping (reordering the index buffer so each
 * material's triangles are contiguous); no vertices are moved.
 *
 * Also inflates the jacket/pants vertices outward along their own
 * normals (skin and shoes are left untouched) — this is what gives
 * the clothing an oversized, baggy silhouette rather than reading as
 * a second layer of skin-tight paint on the same fitted body. */
export function splitBodyMaterials(mesh: THREE.SkinnedMesh) {
  const bones = mesh.skeleton.bones;
  const boneCategories = bones.map((b) => categorizeBone(b.name));
  const boneInflate = bones.map((b) => OVERSIZE_INFLATE[b.name] ?? 0);
  const geometry = mesh.geometry;
  const skinIndexAttr = geometry.getAttribute("skinIndex");
  const skinWeightAttr = geometry.getAttribute("skinWeight");
  const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const normalAttr = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const vertexCount = skinIndexAttr.count;
  const vertexCategory = new Uint8Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    let bestWeight = -1;
    let bestBone = 0;
    for (let k = 0; k < 4; k++) {
      const w = skinWeightAttr.getComponent(i, k);
      if (w > bestWeight) {
        bestWeight = w;
        bestBone = skinIndexAttr.getComponent(i, k);
      }
    }
    vertexCategory[i] = boneCategories[bestBone] ?? BODY_MATERIAL_INDEX.jacket;

    const inflate = boneInflate[bestBone] ?? 0;
    if (inflate > 0) {
      positionAttr.setXYZ(
        i,
        positionAttr.getX(i) + normalAttr.getX(i) * inflate,
        positionAttr.getY(i) + normalAttr.getY(i) * inflate,
        positionAttr.getZ(i) + normalAttr.getZ(i) * inflate
      );
    }
  }
  positionAttr.needsUpdate = true;

  const index = geometry.index;
  if (!index) return;
  const src = index.array;
  const buckets: number[][] = [[], [], [], []];
  for (let t = 0; t < src.length; t += 3) {
    const a = src[t];
    const b = src[t + 1];
    const c = src[t + 2];
    const counts = [0, 0, 0, 0];
    counts[vertexCategory[a]]++;
    counts[vertexCategory[b]]++;
    counts[vertexCategory[c]]++;
    let cat = 0;
    let best = -1;
    for (let k = 0; k < 4; k++) {
      if (counts[k] > best) {
        best = counts[k];
        cat = k;
      }
    }
    buckets[cat].push(a, b, c);
  }

  const newIndices: number[] = [];
  geometry.clearGroups();
  for (let cat = 0; cat < 4; cat++) {
    const start = newIndices.length;
    newIndices.push(...buckets[cat]);
    const count = newIndices.length - start;
    if (count > 0) geometry.addGroup(start, count, cat);
  }
  const IndexType = newIndices.length > 65535 ? Uint32Array : Uint16Array;
  geometry.setIndex(new THREE.BufferAttribute(new IndexType(newIndices), 1));
}

/** The four region materials (skin/jacket/pants/shoes), factored out
 * so other consumers of this rig (e.g. the portal-transition's own
 * walking character) get the identical suit styling without
 * re-declaring — and risking drifting from — the same color/roughness
 * values. Each call returns fresh material instances (safe to dispose
 * independently per consumer). */
export function createSuitMaterials() {
  const bodyMaterials = [
    new THREE.MeshStandardMaterial({
      // skin — warm natural tone for the head/hands.
      color: "#c98a5e",
      roughness: 0.55,
      metalness: 0,
      transparent: true,
      opacity: 1,
    }),
    new THREE.MeshStandardMaterial({
      // jacket — charcoal suit fabric: dark, matte, barely-there sheen.
      color: "#23262e",
      roughness: 0.42,
      metalness: 0.06,
      transparent: true,
      opacity: 1,
    }),
    new THREE.MeshStandardMaterial({
      // trousers — matching charcoal, very slightly darker than the
      // jacket so the two pieces still read as distinct garments.
      color: "#1a1c22",
      roughness: 0.48,
      metalness: 0.04,
      transparent: true,
      opacity: 1,
    }),
    new THREE.MeshStandardMaterial({
      // dress shoes — polished black leather, with a low glow tying
      // into the thruster VFX so they read as tech before they ignite.
      color: "#0c0d10",
      roughness: 0.22,
      metalness: 0.35,
      emissive: "#00d4ff",
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 1,
    }),
  ];
  const tieMaterial = new THREE.MeshStandardMaterial({
    color: "#7a1f2b",
    roughness: 0.4,
    metalness: 0.15,
    transparent: true,
    opacity: 1,
  });
  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: "#eef0f2",
    roughness: 0.55,
    metalness: 0,
    transparent: true,
    opacity: 1,
  });
  return { bodyMaterials, tieMaterial, shirtMaterial };
}

export interface RigSetup {
  bones: Bones;
  bindWorldQuats: Record<string, THREE.Quaternion>;
  bindParentWorldQuats: Record<string, THREE.Quaternion>;
  scale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

/** Discovers bones, region-paints the suit materials onto the skinned
 * mesh, and measures the rig for a real-human-height rescale — the
 * one-time setup shared by every consumer of this asset. Returns data
 * rather than writing into refs directly so callers stay in control of
 * their own ref shapes/effect timing. */
export function setupCharacterRig(
  cloned: THREE.Object3D,
  bodyMaterials: THREE.Material[]
): RigSetup {
  const bones: Bones = {};
  let skinnedMesh: THREE.SkinnedMesh | null = null;
  cloned.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) bones[obj.name] = obj as THREE.Bone;
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
      const mesh = obj as THREE.SkinnedMesh;
      splitBodyMaterials(mesh);
      mesh.material = bodyMaterials;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      skinnedMesh = mesh;
    }
  });

  cloned.updateWorldMatrix(true, true);
  const bindWorldQuats: Record<string, THREE.Quaternion> = {};
  const bindParentWorldQuats: Record<string, THREE.Quaternion> = {};
  Object.entries(bones).forEach(([name, bone]) => {
    bindWorldQuats[name] = bone.getWorldQuaternion(new THREE.Quaternion());
    bindParentWorldQuats[name] = bone.parent
      ? bone.parent.getWorldQuaternion(new THREE.Quaternion())
      : new THREE.Quaternion();
  });

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let offsetZ = 0;
  const mesh = skinnedMesh as THREE.SkinnedMesh | null;
  if (mesh) {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox!;
    const height = box.max.y - box.min.y || 1;
    scale = TARGET_HEIGHT / height;
    offsetX = -((box.min.x + box.max.x) / 2) * scale;
    offsetY = -box.min.y * scale;
    offsetZ = -((box.min.z + box.max.z) / 2) * scale;
  }

  return { bones, bindWorldQuats, bindParentWorldQuats, scale, offsetX, offsetY, offsetZ };
}

/** The natural-looking replacement for the old capsule rider: a real
 * rigged/skinned human mesh (geometry + skeleton reused from a CC-BY
 * sample asset; its flat placeholder texture is discarded and instead
 * region-painted into skin/jacket/pants/shoe materials — see
 * splitBodyMaterials — since the source has no clothing geometry or
 * texture of its own), hand-posed into a streamlined flying glide,
 * lit by its own small rig-mounted light set, and wearing the
 * shoe-thruster VFX (the "flying shoes") at the actual animated
 * foot-bone positions instead of a fixed offset. */
export function Character({
  wrapperRef,
  motionRef,
}: {
  wrapperRef: React.RefObject<THREE.Group | null>;
  motionRef: React.RefObject<RiderMotionState>;
}) {
  const { scene: sourceScene } = useGLTF(MODEL_URL);
  const modelRef = useRef<THREE.Group>(null);
  const bonesRef = useRef<Bones>({});
  const bindWorldQuats = useRef<Record<string, THREE.Quaternion>>({});
  const bindParentWorldQuats = useRef<Record<string, THREE.Quaternion>>({});
  const shoeGroupL = useRef<THREE.Group>(null);
  const shoeGroupR = useRef<THREE.Group>(null);
  const shoeGlowL = useRef<THREE.Sprite>(null);
  const shoeGlowR = useRef<THREE.Sprite>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const tieRef = useRef<THREE.Mesh>(null);
  const collarRef = useRef<THREE.Mesh>(null);

  const glowTexture = useMemo(() => getRadialGlowTexture(), []);

  const cloned = useMemo(() => SkeletonUtils.clone(sourceScene), [sourceScene]);

  const { bodyMaterials, tieMaterial, shirtMaterial } = useMemo(
    () => createSuitMaterials(),
    []
  );

  // Discover bones, region-paint the suit materials, and rescale the
  // whole rig to a real human height — all once, right after clone.
  useEffect(() => {
    const rig = setupCharacterRig(cloned, bodyMaterials);
    bonesRef.current = rig.bones;
    bindWorldQuats.current = rig.bindWorldQuats;
    bindParentWorldQuats.current = rig.bindParentWorldQuats;
    if (modelRef.current) {
      modelRef.current.scale.setScalar(rig.scale);
      modelRef.current.position.set(rig.offsetX, rig.offsetY, rig.offsetZ);
    }
  }, [cloned, bodyMaterials]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const bones = bonesRef.current;
    const bindWorld = bindWorldQuats.current;
    const bindParentWorld = bindParentWorldQuats.current;
    const wrapper = wrapperRef.current;
    if (!wrapper || Object.keys(bones).length === 0) return;

    const { appear, speedFactor, finalPush } = motionRef.current;

    // Blend from a relaxed neutral pose into the full streamlined glide
    // as both the fade-in and speed ramp up — the character shouldn't
    // snap into a hard dive pose the instant it appears.
    const poseAmount = Math.min(1, appear * 0.6 + speedFactor * 0.4 + 0.35);

    Object.entries(FLY_POSE).forEach(([name, [ex, ey, ez]]) => {
      const bone = bones[name];
      const bw = bindWorld[name];
      const bpw = bindParentWorld[name];
      if (!bone || !bw || !bpw) return;
      // A little idle sway per-bone (unique phase per name so joints
      // don't move in lockstep) layered under the base fly pose — the
      // same multi-frequency-sine idiom used elsewhere in this scene
      // for organic rather than metronomic secondary motion.
      const phase = name.length;
      const sway = 1 + 0.08 * Math.sin(t * 1.6 + phase) + 0.04 * Math.sin(t * 4.1 + phase * 2);
      tmpEuler.set(ex * poseAmount * sway, ey * poseAmount * sway, ez * poseAmount * sway);
      tmpQuat.setFromEuler(tmpEuler);
      // Compose the desired offset in WORLD space on top of this
      // bone's bind-pose world orientation, then convert back into
      // local space via the (fixed, bind-time) parent world
      // orientation — bone.quaternion = parentWorld^-1 * offset *
      // boneBindWorld. This rig's bind rotations are arbitrary
      // per-joint twists, so a naive local-space offset bends every
      // joint around a different, unpredictable effective axis; this
      // makes "rotate around world X/Y/Z" mean exactly that,
      // consistently, for every bone regardless of its own bind twist.
      bone.quaternion
        .copy(bpw)
        .invert()
        .multiply(tmpQuat)
        .multiply(bw);
    });

    // Tie and shirt collar ride the chest/neck bones' live world
    // position, offset toward the front of the body (world-space,
    // camera-facing side — negative local Z on this rig) and down
    // slightly to sit on the chest/collarbone rather than embedded
    // inside the torso. Rotation is deliberately left at identity
    // (always hangs world-upright) rather than tracked off the bone's
    // own orientation — this rig's bind rotations are arbitrary
    // per-bone twists (see FLY_POSE's world-space composition above),
    // so naively copying a bone's world quaternion onto a decorative
    // mesh doesn't reliably mean "facing forward"; a tie/collar barely
    // needs to react to the subtle body lean anyway.
    const chest = bones["torso_joint_3"];
    if (chest && tieRef.current) {
      chest.getWorldPosition(tmpV1);
      wrapper.worldToLocal(tmpV1);
      tieRef.current.position.set(tmpV1.x, tmpV1.y - 0.1, tmpV1.z - 0.18);
    }
    const neck = bones["Skeleton_neck_joint_1"];
    if (neck && collarRef.current) {
      neck.getWorldPosition(tmpV1);
      wrapper.worldToLocal(tmpV1);
      collarRef.current.position.set(tmpV1.x, tmpV1.y - 0.06, tmpV1.z - 0.15);
    }

    // Shoe thrusters ride the actual toe-bone world position, so they
    // never drift from the feet regardless of pose or camera angle.
    const footR = bones["leg_joint_R_5"];
    const footL = bones["leg_joint_L_5"];
    if (footR && shoeGroupR.current) {
      footR.getWorldPosition(tmpV1);
      wrapper.worldToLocal(tmpV1);
      shoeGroupR.current.position.copy(tmpV1);
    }
    if (footL && shoeGroupL.current) {
      footL.getWorldPosition(tmpV1);
      wrapper.worldToLocal(tmpV1);
      shoeGroupL.current.position.copy(tmpV1);
    }
    const shoeOpacity = (0.5 + finalPush * 0.5) * appear;
    if (shoeGlowL.current)
      (shoeGlowL.current.material as THREE.SpriteMaterial).opacity =
        shoeOpacity * (0.8 + Math.sin(t * 14) * 0.2);
    if (shoeGlowR.current)
      (shoeGlowR.current.material as THREE.SpriteMaterial).opacity =
        shoeOpacity * (0.8 + Math.sin(t * 14 + 1.7) * 0.2);

    bodyMaterials.forEach((m) => {
      m.opacity = appear;
    });
    tieMaterial.opacity = appear;
    shirtMaterial.opacity = appear;
  });

  return (
    <>
      <group ref={modelRef}>
        <primitive object={cloned} />
      </group>

      {/* Shirt collar peeking above the jacket, and a tie down the
          chest — the two simplest, most legible "business suit" reads
          beyond color alone. Position/rotation tracked live off the
          neck/chest bones each frame (see useFrame above) rather than
          parented directly onto the skinned mesh, since these are
          plain (non-skinned) decorative meshes. */}
      <mesh ref={collarRef} material={shirtMaterial}>
        <boxGeometry args={[0.16, 0.03, 0.02]} />
      </mesh>
      <mesh ref={tieRef} material={tieMaterial}>
        <boxGeometry args={[0.045, 0.22, 0.015]} />
      </mesh>

      {/* Shoe thrusters — plasma glow, energy sparks, and trailing
          streaks all riding the live foot-bone position. */}
      <group ref={shoeGroupR}>
        <sprite ref={shoeGlowR} position={[0, -0.02, -0.02]} scale={[0.22, 0.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#00d4ff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
        <Trail width={2.4} length={9} color="#00d4ff" attenuation={(w) => w * w}>
          <mesh>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#00e5ff" fog={false} />
          </mesh>
        </Trail>
        <Sparkles count={20} scale={[0.3, 0.22, 0.35]} size={2.2} speed={1.3} color="#5fe8ff" />
      </group>
      <group ref={shoeGroupL}>
        <sprite ref={shoeGlowL} position={[0, -0.02, -0.02]} scale={[0.22, 0.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#00d4ff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
        <Trail width={2.4} length={9} color="#00d4ff" attenuation={(w) => w * w}>
          <mesh>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#00e5ff" fog={false} />
          </mesh>
        </Trail>
        <Sparkles count={20} scale={[0.3, 0.22, 0.35]} size={2.2} speed={1.3} color="#5fe8ff" />
      </group>

      {/* Small rig-mounted lights — scoped to this character only.
          Nothing else in the scene uses a lit material (everything
          else is MeshBasicMaterial/additive sprites), so these have
          zero effect anywhere else and cost nothing extra elsewhere.
          Point lights rather than directional: a DirectionalLight's
          direction is (position - target), and target defaults to
          world (0,0,0) unless separately parented — since this rig
          rides a group that flies far from the origin, that default
          would aim the light increasingly wrong as the flight
          progresses. A point light has no target; it just radiates
          from its own (correctly, group-relative) position. */}
      <pointLight
        ref={keyLightRef}
        position={[1.1, 1.8, 0.9]}
        intensity={30}
        distance={6}
        decay={2}
        color="#fff2e0"
      />
      <pointLight position={[-0.9, 1.1, -1.3]} intensity={16} distance={6} decay={2} color="#00b8ff" />
      <hemisphereLight args={["#5a5a68", "#05060c", 0.55]} />
    </>
  );
}
