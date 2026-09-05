"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { BRAND_LOGO } from "./adImages";
import {
  getWindowGridTexture,
  getWindowEmissiveTexture,
  getWindowNormalTexture,
  getPortalGridTexture,
} from "./glowTexture";

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

useTexture.preload(BRAND_LOGO);

// Same brand cyan/blue the navbar logo glow and the MDS sphere
// landmark (Landmark.tsx) use, rather than Noorva's own blue-violet
// product gradient — this building is the company's own headquarters,
// not a product, so it carries MDS's plain two-tone identity.
const MDS_CYAN = "#00D4FF";
const MDS_BLUE = "#0055FF";

const PODIUM_WIDTH = 9;
const PODIUM_DEPTH = 7;
const PODIUM_HEIGHT = 4;
const TOWER_WIDTH = 6.4;
const TOWER_DEPTH = 5;
const TOWER_HEIGHT = 34;
const PLAZA_RADIUS = 14;
const RING_RADIUS = TOWER_WIDTH * 1.15;
const RING_Y_GAP = 3.4;
const DECK_Y = PODIUM_HEIGHT + TOWER_HEIGHT * 0.62;
const DECK_REACH = TOWER_WIDTH * 1.4;

// Gap left on the road's left side between NoorvaTower's own clearance
// zone (-27 +/- 8, ending at z=-19) and TreeOfLife's (20 +/- 18,
// starting at z=2) — see landmarkClearance.ts, which now carries this
// tower's own entry so CityScape's procedural buildings and StreetTrees
// don't land on top of it. x matches the other landmarks' rough
// distance from the road (NoorvaTower -21, Waterfall -27, SkyPlaza -19).
const POSITION: [number, number, number] = [-22, 0, -8];

let cachedWordmark: THREE.Texture | null = null;

/** A wide, horizontal "MDS" wordmark for the tower's own sign band —
 * unlike NOORVA's vertical treatment (a long product name needs the
 * tower's full height to read), three letters read best as a normal
 * horizontal sign spanning the band's width, the way a real corporate
 * HQ mounts its name near the roofline. Hand-drawn onto a canvas and
 * cached, same approach every other in-scene wordmark/logo uses since
 * there's no pre-made "MDS" wordmark asset in /public — only the
 * circular brand mark (BRAND_LOGO) does, which is mounted separately at
 * the lobby entrance below. */
function getMDSWordmarkTexture(): THREE.Texture {
  if (cachedWordmark) return cachedWordmark;
  const w = 1024;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, MDS_CYAN);
  grad.addColorStop(1, MDS_BLUE);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 168px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = grad;
  ctx.shadowColor = MDS_CYAN;
  ctx.shadowBlur = 34;
  ctx.fillText("MDS", w / 2, h / 2 - 10);

  ctx.font = "400 30px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(210, 240, 255, 0.85)";
  ctx.shadowBlur = 0;
  ctx.fillText("GLOBAL HEADQUARTERS", w / 2, h / 2 + 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedWordmark = texture;
  return texture;
}

let cachedHelipad: THREE.Texture | null = null;

/** A rooftop helipad marking — the one distinctly "functional office
 * building" detail that separates this from a sculptural landmark like
 * the MDS sphere: a real corporate HQ tower has a helipad, not just a
 * glowing cap. */
function getHelipadTexture(): THREE.Texture {
  if (cachedHelipad) return cachedHelipad;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(c, c, c - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 130px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", c, c + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedHelipad = texture;
  return texture;
}

/** The company's own headquarters building — distinct from both the MDS
 * sphere (Landmark.tsx, an abstract brand monument) and NoorvaTower (a
 * product spire): a real office tower, podium-and-shaft massing, with a
 * proper entrance plaza, a lit sign band carrying the MDS wordmark, the
 * actual brand mark mounted at the lobby, and a rooftop helipad — the
 * "this is a functioning building people work in," not a sculpture,
 * counterpart to this scene's other, more abstract landmarks. Built
 * from the exact same window-grid/emissive/normal texture set CityScape
 * uses for its own box towers so the facade material matches the rest
 * of the skyline, just at hero scale and detail.
 *
 * Pushed further into "full-on futuristic" at explicit request on top
 * of that grounded office-tower base: glowing energy conduits spiraling
 * up the facade, floating holographic data panels (sharing the finale
 * portal's own hologram-grid texture, tying the two together visually),
 * a cantilevered sky-deck held on visible struts, a hovering tech ring
 * suspended above the roofline on nothing but four thin struts, and a
 * drift of light particles around the whole structure — the same
 * "clearly a real building, but generating its own visible energy" look
 * used everywhere else this scene wants to read as sci-fi rather than
 * just modern. */
export function MDSOfficeTower() {
  const logoTexture = useTexture(BRAND_LOGO) as THREE.Texture;
  const wordmarkTexture = useMemo(() => getMDSWordmarkTexture(), []);
  const helipadTexture = useMemo(() => getHelipadTexture(), []);
  const hologramTexture = useMemo(() => getPortalGridTexture(), []);
  const signMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const beaconMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const deckGlowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const hologramRefs = useRef<(THREE.Mesh | null)[]>([]);
  const conduitMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  // Glowing energy conduits climbing the tower's facade in a loose
  // spiral — the same "this building runs on visible power" language
  // TreeOfLife's bark veins use, borrowed here for a structure rather
  // than a living thing, which is exactly what pushes a plain glass
  // tower toward "full-on futuristic" instead of a normal office block.
  const conduitCurves = useMemo(
    () =>
      Array.from({ length: 3 }, (_, c) => {
        const points: THREE.Vector3[] = [];
        const turns = 1.4 + seeded(c, 71) * 0.5;
        const baseAngle = (c / 3) * Math.PI * 2;
        for (let s = 0; s <= 24; s++) {
          const t = s / 24;
          const y = PODIUM_HEIGHT + t * TOWER_HEIGHT * 0.94;
          const angle = baseAngle + t * Math.PI * 2 * turns;
          const rx = TOWER_WIDTH / 2 + 0.04;
          const rz = TOWER_DEPTH / 2 + 0.04;
          points.push(new THREE.Vector3(Math.cos(angle) * rx, y, Math.sin(angle) * rz));
        }
        return new THREE.CatmullRomCurve3(points);
      }),
    []
  );

  // A handful of floating holographic data panels at staggered heights
  // around the tower — projected screens rather than more glass, the
  // single strongest "this is a sci-fi corporate HQ" cue a building can
  // carry short of an actual animated display.
  const hologramPanels = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const angle = seeded(i, 81) * Math.PI * 2;
        const radius = TOWER_WIDTH * (0.95 + seeded(i, 82) * 0.4);
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y: PODIUM_HEIGHT + TOWER_HEIGHT * (0.25 + seeded(i, 83) * 0.5),
          rotY: angle + Math.PI / 2,
          scale: 1.1 + seeded(i, 84) * 0.6,
          phase: seeded(i, 85) * Math.PI * 2,
        };
      }),
    []
  );

  const towerWindowMaps = useMemo(() => {
    const map = getWindowGridTexture(4).clone();
    map.repeat.set(2.5, 2.8);
    map.needsUpdate = true;
    const emissiveMap = getWindowEmissiveTexture(4).clone();
    emissiveMap.repeat.set(2.5, 2.8);
    emissiveMap.needsUpdate = true;
    const normalMap = getWindowNormalTexture().clone();
    normalMap.repeat.set(2.5, 2.8);
    normalMap.needsUpdate = true;
    return { map, emissiveMap, normalMap };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (signMatRef.current) signMatRef.current.opacity = 0.85 + Math.sin(t * 0.7) * 0.12;
    if (beaconMatRef.current) {
      const blink = Math.sin(t * 1.4 + 2.7) > 0.85 ? 1 : 0.08;
      beaconMatRef.current.opacity = blink;
    }
    if (ringGroupRef.current) ringGroupRef.current.rotation.y = t * 0.12;
    if (ringMatRef.current) ringMatRef.current.opacity = 0.6 + Math.sin(t * 0.9) * 0.15;
    if (deckGlowMatRef.current) deckGlowMatRef.current.opacity = 0.5 + Math.sin(t * 1.2 + 1) * 0.15;
    conduitMatRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = 0.55 + Math.sin(t * (1.1 + i * 0.3) + i * 2) * 0.3;
    });
    hologramRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const panel = hologramPanels[i];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 0.8 + panel.phase) * 0.15;
      mesh.position.y = panel.y + Math.sin(t * 0.5 + panel.phase) * 0.15;
    });
  });

  return (
    <group position={POSITION}>
      {/* Entrance plaza — a raised paved forecourt wider than the
          building's own footprint, the "real HQ has an approach, not
          just a door" cue, matching the paving language Sidewalk.tsx
          established for the street. */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PLAZA_RADIUS, 28]} />
        <meshLambertMaterial color="#3a4148" fog />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PLAZA_RADIUS * 0.55, PLAZA_RADIUS * 0.58, 40]} />
        <meshBasicMaterial color={MDS_CYAN} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Podium — a wider, lower base the tower rises from, the classic
          real-office-tower massing (a taller lobby/amenity volume under
          a narrower tower) rather than one uniform extrusion. */}
      <mesh position={[0, PODIUM_HEIGHT / 2, 0]}>
        <boxGeometry args={[PODIUM_WIDTH, PODIUM_HEIGHT, PODIUM_DEPTH]} />
        <meshPhongMaterial color="#12161e" specular="#5a7fd6" shininess={55} fog />
      </mesh>
      {/* Lobby glass band, lit warm, at ground level. */}
      <mesh position={[0, PODIUM_HEIGHT * 0.42, PODIUM_DEPTH / 2 + 0.02]}>
        <planeGeometry args={[PODIUM_WIDTH * 0.86, PODIUM_HEIGHT * 0.6]} />
        <meshBasicMaterial color="#ffdca8" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {/* The actual brand mark, mounted at the lobby entrance — a real
          HQ's illuminated logo sign above the door. */}
      <mesh position={[0, PODIUM_HEIGHT * 0.62, PODIUM_DEPTH / 2 + 0.05]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshBasicMaterial map={logoTexture} transparent toneMapped={false} depthWrite={false} fog={false} />
      </mesh>

      {/* Tower shaft, rising from the podium — same window-grid/
          emissive/normal texture set CityScape's own box towers use,
          so the facade material reads as the same city rather than an
          imported asset. */}
      <mesh position={[0, PODIUM_HEIGHT + TOWER_HEIGHT / 2, 0]}>
        <boxGeometry args={[TOWER_WIDTH, TOWER_HEIGHT, TOWER_DEPTH]} />
        {/* toneMapped={false} removed — same washed-out-facade bug
            fixed in CityScape (see its own comment there): applied to
            the whole lit shaft rather than just an additive glow layer,
            it bypassed ACES tone mapping entirely and let bright pixels
            hard-clip to flat white instead of compressing gracefully. */}
        <meshPhongMaterial
          map={towerWindowMaps.map}
          normalMap={towerWindowMaps.normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          emissiveMap={towerWindowMaps.emissiveMap}
          emissive="#bfe4ff"
          emissiveIntensity={0.9}
          specular="#3a4a66"
          shininess={22}
          color="#1a2434"
          fog
        />
      </mesh>

      {/* Vertical corner accent strips — the same "glowing edge" cue
          CityScape's own premium towers carry. */}
      {[
        [TOWER_WIDTH / 2, TOWER_DEPTH / 2],
        [-TOWER_WIDTH / 2, TOWER_DEPTH / 2],
        [TOWER_WIDTH / 2, -TOWER_DEPTH / 2],
        [-TOWER_WIDTH / 2, -TOWER_DEPTH / 2],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, PODIUM_HEIGHT + TOWER_HEIGHT / 2, cz]}>
          <boxGeometry args={[0.1, TOWER_HEIGHT * 0.97, 0.1]} />
          <meshBasicMaterial color={MDS_CYAN} transparent opacity={0.4} toneMapped={false} fog={false} />
        </mesh>
      ))}

      {/* Illuminated MDS sign band, mounted on the tower's road-facing
          wall near the top — the "reads as headquarters from a
          distance" cue every real corporate tower carries. Enlarged at
          explicit "bolder landmark signage" request — the previous
          size read as a normal building sign; this is meant to be
          unmissable the way the reference's own building-scale
          branding is. */}
      <mesh position={[0, PODIUM_HEIGHT + TOWER_HEIGHT * 0.85, TOWER_DEPTH / 2 + 0.03]}>
        <planeGeometry args={[TOWER_WIDTH * 1.35, TOWER_WIDTH * 0.34]} />
        <meshBasicMaterial
          ref={signMatRef}
          map={wordmarkTexture}
          transparent
          opacity={0.9}
          toneMapped={false}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* A second, much larger version of the same mark wrapping the
          tower's road-facing SIDE wall — since the tower sits beside
          the road rather than at its end, this is the face the camera
          actually spends the most time looking at during the flyby
          (an angled/side view, not head-on), so this is where a bold,
          building-scale mural actually pays off, echoing the reference
          image's own huge facade-wrapping branding rather than staying
          a modest rooftop sign. */}
      <mesh
        position={[TOWER_WIDTH / 2 + 0.03, PODIUM_HEIGHT + TOWER_HEIGHT * 0.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[TOWER_DEPTH * 3.4, TOWER_DEPTH * 0.85]} />
        <meshBasicMaterial
          map={wordmarkTexture}
          transparent
          opacity={0.85}
          toneMapped={false}
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rooftop helipad — the functional detail that reads as a real
          working headquarters rather than a sculptural landmark. */}
      <mesh position={[0, PODIUM_HEIGHT + TOWER_HEIGHT + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TOWER_WIDTH * 0.42, 28]} />
        <meshBasicMaterial color="#1a1e26" fog={false} />
      </mesh>
      <mesh position={[0, PODIUM_HEIGHT + TOWER_HEIGHT + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TOWER_WIDTH * 0.8, TOWER_WIDTH * 0.8]} />
        <meshBasicMaterial map={helipadTexture} transparent toneMapped={false} depthWrite={false} fog={false} />
      </mesh>
      {/* Slim antenna mast carrying a slow-blinking rooftop aviation
          beacon, same real-skyscraper cue CityScape's own tall towers
          carry, own independent phase so it doesn't blink in lockstep
          with the rest of the skyline. */}
      <mesh position={[0, PODIUM_HEIGHT + TOWER_HEIGHT + 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
        <meshBasicMaterial color="#0a0a12" fog={false} />
      </mesh>
      <mesh position={[0, PODIUM_HEIGHT + TOWER_HEIGHT + 0.9, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial ref={beaconMatRef} color="#ff3b30" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>

      {/* Glowing energy conduits spiraling up the facade. */}
      {conduitCurves.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 60, 0.035, 5, false]} />
          <meshBasicMaterial
            ref={(el) => {
              conduitMatRefs.current[i] = el;
            }}
            color={MDS_CYAN}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Floating holographic data panels ringing the tower — a
          projected screen rather than more glass, mounted on the
          hologram-grid texture the finale portal (Star.tsx) also uses,
          so the same "hologram" visual language ties the skyline's
          most futuristic structure to the route's own ending. */}
      {hologramPanels.map((panel, i) => (
        <mesh
          key={i}
          ref={(el) => {
            hologramRefs.current[i] = el;
          }}
          position={[panel.x, panel.y, panel.z]}
          rotation={[0, panel.rotY, 0]}
          scale={panel.scale}
        >
          <planeGeometry args={[1, 1.4]} />
          <meshBasicMaterial
            map={hologramTexture}
            color={MDS_CYAN}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Cantilevered sky-deck — a floating observation platform
          jutting out from the tower partway up, held on visible struts
          rather than sitting flush against the wall, the same dramatic-
          overhang cue CityScape's own cantilevered crowns use, at hero
          scale. */}
      <group position={[0, DECK_Y, 0]}>
        <mesh position={[DECK_REACH / 2, 0, 0]}>
          <boxGeometry args={[DECK_REACH, 0.18, TOWER_DEPTH * 0.9]} />
          <meshPhongMaterial color="#1c2430" specular="#8fc4e8" shininess={60} fog />
        </mesh>
        <mesh position={[DECK_REACH / 2, 0.1, 0]}>
          <boxGeometry args={[DECK_REACH * 0.97, 0.02, TOWER_DEPTH * 0.02]} />
          <meshBasicMaterial
            ref={deckGlowMatRef}
            color={MDS_CYAN}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
        {[0.15, 0.5, 0.85].map((f, i) => (
          <mesh key={i} position={[DECK_REACH * f, -0.5, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1, 5]} />
            <meshBasicMaterial color="#3a4048" fog={false} />
          </mesh>
        ))}
      </group>

      {/* Hovering tech ring above the roofline — a smaller, hero-scale
          echo of the finale portal's own spinning-ring language
          (Star.tsx), the clearest "full-on futuristic" silhouette this
          building carries: a real structure with nothing solid holding
          it up but four thin struts. */}
      <group ref={ringGroupRef} position={[0, PODIUM_HEIGHT + TOWER_HEIGHT + RING_Y_GAP, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING_RADIUS, 0.05, 8, 48]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color={MDS_CYAN}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      {[0, 1, 2, 3].map((s) => {
        const angle = (s / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh
            key={s}
            position={[
              Math.cos(angle) * RING_RADIUS * 0.9,
              PODIUM_HEIGHT + TOWER_HEIGHT + RING_Y_GAP / 2,
              Math.sin(angle) * RING_RADIUS * 0.9,
            ]}
          >
            <cylinderGeometry args={[0.03, 0.03, RING_Y_GAP, 5]} />
            <meshBasicMaterial color={MDS_CYAN} transparent opacity={0.3} toneMapped={false} fog={false} />
          </mesh>
        );
      })}

      {/* A drift of fine light particles around the tower — cheap
          atmosphere that sells "this structure is generating energy"
          without any extra geometry. */}
      <Sparkles count={40} scale={[TOWER_WIDTH * 3, TOWER_HEIGHT * 1.1, TOWER_WIDTH * 3]} position={[0, PODIUM_HEIGHT + TOWER_HEIGHT / 2, 0]} size={2} speed={0.3} color={MDS_CYAN} />

      {/* Ground contact shadow. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PODIUM_WIDTH * 1.3, 24]} />
        <meshBasicMaterial color="#0a1420" transparent opacity={0.5} blending={THREE.MultiplyBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
