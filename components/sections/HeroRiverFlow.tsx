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
// Both images were regenerated with a city skyline sharing the frame
// with the canyon (previously canyon-only), which shifted the river
// and — for mobile — changed the image's own aspect ratio, so both
// this viewBox and the traced paths below had to be redone against
// the new artwork.
const DESKTOP_VIEWBOX = "0 0 1672 941";
const MOBILE_VIEWBOX = "0 0 853 1844";

// The river's distant tip fades in gradually in the source images —
// too faintly for the flow overlay to have any real glow to blend
// into up there. Without a matching fade, the overlay shows up as a
// bare mark against near-empty sky before the riverbed is actually
// bright enough to hide it in. These are the (y0, y1) bounds, in each
// viewBox's own pixel space, over which the overlay ramps from
// invisible to fully visible.
const DESKTOP_FADE: [number, number] = [555, 705];
const MOBILE_FADE: [number, number] = [820, 970];

const DESKTOP_PATH = smoothPath([
  [897, 555], [897, 565], [891, 575], [890, 585], [883, 595],
  [872, 605], [870, 615], [882, 625], [897, 635], [919, 645],
  [943, 655], [959, 665], [965, 675], [960, 685], [946, 695],
  [930, 705], [914, 715], [903, 725], [898, 735], [901, 745],
  [910, 755], [925, 765], [941, 775], [956, 785], [973, 795],
  [986, 805], [996, 815], [1000, 825], [1000, 835], [994, 845],
  [984, 855], [969, 865], [952, 875], [930, 885], [905, 895],
  [880, 905], [857, 915], [844, 925], [833, 935],
]);

const MOBILE_PATH = smoothPath([
  [450, 820], [455, 832], [458, 844], [466, 856], [475, 868],
  [478, 880], [480, 892], [477, 904], [471, 916], [462, 928],
  [455, 940], [448, 952], [449, 964], [454, 976], [463, 988],
  [474, 1000], [480, 1012], [481, 1024], [474, 1036], [461, 1048],
  [445, 1060], [431, 1072], [418, 1084], [408, 1096], [401, 1108],
  [399, 1120], [402, 1132], [408, 1144], [423, 1156], [442, 1168],
  [461, 1180], [478, 1192], [494, 1204], [505, 1216], [514, 1228],
  [519, 1240], [523, 1252], [522, 1264], [519, 1276], [513, 1288],
  [507, 1300], [497, 1312], [487, 1324], [473, 1336], [455, 1348],
  [436, 1360], [418, 1372], [402, 1384], [390, 1396], [382, 1408],
  [376, 1420], [370, 1432], [365, 1444], [360, 1456], [357, 1468],
  [355, 1480], [353, 1492], [354, 1504], [357, 1516], [361, 1528],
  [367, 1540], [377, 1552], [387, 1564], [398, 1576], [409, 1588],
  [420, 1600], [428, 1612], [435, 1624], [438, 1636], [442, 1648],
  [445, 1660], [451, 1672], [457, 1684], [464, 1696], [469, 1708],
  [474, 1720], [477, 1732], [478, 1744], [480, 1756], [481, 1768],
  [481, 1780], [480, 1792], [478, 1804], [475, 1816], [473, 1828],
  [470, 1840],
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
