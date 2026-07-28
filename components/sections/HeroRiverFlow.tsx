"use client";

/** Traces the glowing river visible in the hero's static background
 * images and overlays animated light traveling along it — the images
 * themselves are static, this is what makes the water read as moving.
 * Point coordinates were extracted by scanning each PNG's riverbed row
 * by row (not hand-guessed — the river braids into multiple strands of
 * comparable brightness, so both a hand-traced line and a naive
 * "brightest pixel per row" scan drifted off the visible glow; this
 * instead tracks the midpoint of the lit band around the previous
 * row's position, which follows the middle of the braid the way a
 * viewer's eye does). Coordinates are in each image's native pixel
 * space; the `viewBox` + `slice` preserveAspectRatio makes that space
 * line up with the image underneath even though both are stretched/
 * cropped identically by `object-cover` at any viewport size.
 *
 * The moving elements are small blurred streaks riding `animateMotion`
 * with `rotate="auto"` so they orient along the current's direction —
 * not a dashed stroke, which reads as a static "dotted line" sitting
 * on the image rather than light traveling through the water, and not
 * round dots, which read as isolated blinks rather than flow.
 * `keyPoints="1;0"` reverses travel to run from each path's end back
 * to its start (`rotate="auto"` still tracks the true direction of
 * motion, so the streaks keep facing the way they're actually moving). */

type Point = [number, number];

function smoothPath(points: Point[]): string {
  const d: string[] = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

// Native pixel dimensions of public/herodesktop.png / public/heromobile.png.
const DESKTOP_VIEWBOX = "0 0 1672 941";
const MOBILE_VIEWBOX = "0 0 941 1672";

// The river's distant tip fades in gradually in the source images —
// too faintly for the flow overlay to have any real glow to blend
// into up there. Without a matching fade, the overlay shows up as a
// bare mark against near-empty sky before the riverbed is actually
// bright enough to hide it in. These are the (y0, y1) bounds, in each
// viewBox's own pixel space, over which the overlay ramps from
// invisible to fully visible.
const DESKTOP_FADE: [number, number] = [260, 420];
const MOBILE_FADE: [number, number] = [560, 780];

const DESKTOP_PATH = smoothPath([
  [871, 260], [872, 280], [875, 300], [879, 320], [882, 340],
  [880, 360], [871, 380], [858, 400], [844, 420], [839, 440],
  [844, 460], [853, 480], [863, 500], [880, 520], [896, 540],
  [913, 560], [936, 580], [957, 600], [967, 620], [964, 640],
  [950, 660], [926, 680], [896, 700], [871, 720], [852, 740],
  [840, 760], [837, 780], [843, 800], [853, 820], [868, 840],
  [884, 860], [898, 880], [911, 900], [918, 920], [923, 940],
]);

const MOBILE_PATH = smoothPath([
  [507, 560], [506, 580], [504, 600], [502, 620], [500, 640],
  [497, 660], [491, 680], [484, 700], [476, 720], [469, 740],
  [468, 760], [475, 780], [484, 800], [489, 820], [486, 840],
  [476, 860], [462, 880], [455, 900], [459, 920], [475, 940],
  [499, 960], [525, 980], [543, 1000], [558, 1020], [561, 1040],
  [551, 1060], [533, 1080], [512, 1100], [482, 1120], [456, 1140],
  [434, 1160], [416, 1180], [405, 1200], [403, 1220], [405, 1240],
  [413, 1260], [421, 1280], [431, 1300], [441, 1320], [453, 1340],
  [465, 1360], [479, 1380], [494, 1400], [509, 1420], [519, 1440],
  [529, 1460], [538, 1480], [548, 1500], [559, 1520], [569, 1540],
  [578, 1560], [581, 1580], [580, 1600], [569, 1620], [564, 1640],
  [556, 1660],
]);

const SPARK_COUNT = 11;
const LAP_SECONDS = 3.2;

export function HeroRiverFlow({
  variant,
  reducedMotion,
}: {
  variant: "desktop" | "mobile";
  reducedMotion: boolean;
}) {
  const isDesktop = variant === "desktop";
  const path = isDesktop ? DESKTOP_PATH : MOBILE_PATH;
  const [fadeStart, fadeEnd] = isDesktop ? DESKTOP_FADE : MOBILE_FADE;
  // animateMotion's rotate="auto" turns the shape so its local +x axis
  // follows the path's tangent — so the *length* of the streak has to
  // be on rx (x-radius), not ry, or it ends up perpendicular to travel.
  const streakRx = isDesktop ? 13 : 9;
  const streakRy = isDesktop ? 2.2 : 1.6;

  return (
    <svg
      aria-hidden
      viewBox={isDesktop ? DESKTOP_VIEWBOX : MOBILE_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full pointer-events-none ${isDesktop ? "hidden md:block" : "block md:hidden"}`}
      style={{ mixBlendMode: "screen" }}
    >
      <defs>
        <filter id={`hero-river-glow-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={`hero-river-spark-${variant}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <linearGradient
          id={`hero-river-fade-${variant}`}
          gradientUnits="userSpaceOnUse"
          x1="0" y1={fadeStart} x2="0" y2={fadeEnd}
        >
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={`hero-river-mask-${variant}`}>
          <rect
            x="0" y={fadeStart} width="100%" height="100%"
            fill={`url(#hero-river-fade-${variant})`}
          />
        </mask>
      </defs>
      <g mask={`url(#hero-river-mask-${variant})`}>
        {/* Static soft blue glow, deepening the riverbed's own color —
            no animation on this layer, so it can't read as a moving
            line of any kind. */}
        <path
          d={path}
          fill="none"
          stroke="rgba(60,150,255,0.28)"
          strokeWidth={14}
          strokeLinecap="round"
          filter={`url(#hero-river-glow-${variant})`}
        />
        {/* Small glowing streaks riding the current, spaced evenly
            around one shared loop so they read as a continuous stream
            rather than isolated blips. Each ellipse is elongated along
            its local x-axis, which `rotate="auto"` keeps aligned with
            the path's own tangent at every point along the curve, so
            it always reads as a streak following the bend rather than
            a shape sliding sideways through it. */}
        {!reducedMotion &&
          Array.from({ length: SPARK_COUNT }).map((_, i) => (
            <ellipse
              key={i}
              rx={streakRx}
              ry={streakRy}
              fill="rgba(200,235,255,0.9)"
              filter={`url(#hero-river-spark-${variant})`}
            >
              <animateMotion
                path={path}
                keyPoints="1;0"
                keyTimes="0;1"
                calcMode="linear"
                dur={`${LAP_SECONDS}s`}
                begin={`${-(i * LAP_SECONDS) / SPARK_COUNT}s`}
                repeatCount="indefinite"
                rotate="auto"
              />
            </ellipse>
          ))}
      </g>
    </svg>
  );
}
