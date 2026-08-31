"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
 * space; the visible viewBox sub-rectangle is computed below to
 * reproduce the exact same crop the underlying `<Image>` gets from
 * `object-cover` + its own `objectPosition` (see HeroSection.tsx) —
 * SVG's `preserveAspectRatio` only offers Min/Mid/Max (0%/50%/100%)
 * anchors, which can't express that image's off-center object-position,
 * so this replicates the cover-crop math by hand instead of relying on
 * `preserveAspectRatio` to line the two up on its own (it can't).
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

// Must match the `objectPosition` set on the desktop/mobile `<Image>`
// in HeroSection.tsx exactly — this is the other half of that crop.
const OBJECT_POSITION: [number, number] = [0.5, 0.78];

/** Computes the same sub-rectangle of `(imgW, imgH)` that CSS
 * `object-fit: cover` + `object-position: ${pos[0]*100}% ${pos[1]*100}%`
 * would show inside a `(containerW, containerH)` box — i.e. scale to
 * cover, then slide the crop window by `pos` across whatever overflows. */
function coverViewBox(
  imgW: number,
  imgH: number,
  containerW: number,
  containerH: number,
  pos: [number, number]
): string {
  if (containerW <= 0 || containerH <= 0) return `0 0 ${imgW} ${imgH}`;
  const scale = Math.max(containerW / imgW, containerH / imgH);
  const cropW = containerW / scale;
  const cropH = containerH / scale;
  const cropX = (imgW - cropW) * pos[0];
  const cropY = (imgH - cropH) * pos[1];
  return `${cropX.toFixed(1)} ${cropY.toFixed(1)} ${cropW.toFixed(1)} ${cropH.toFixed(1)}`;
}

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
const DESKTOP_SIZE: [number, number] = [1672, 941];
const MOBILE_SIZE: [number, number] = [853, 1844];

// The river's distant tip fades in gradually in the source images —
// too faintly for the flow overlay to have any real glow to blend
// into up there. Without a matching fade, the overlay shows up as a
// bare mark against near-empty sky before the riverbed is actually
// bright enough to hide it in. These are the (y0, y1) bounds, in each
// viewBox's own pixel space, over which the overlay ramps from
// invisible to fully visible.
// Retraced against the current herodesktop.png/heromobile.png artwork
// (the previous points were hand-authored against an earlier version
// of these images and had drifted onto the buildings by the time the
// river's own path in the artwork had moved) — points were extracted
// programmatically by scanning each PNG for its blue-glow river band,
// tracking the nearest strand row to row (rather than the single
// brightest pixel per row) so the trace follows one coherent braid
// instead of jumping between the river's several bright strands.
const DESKTOP_FADE: [number, number] = [560, 705];
const MOBILE_FADE: [number, number] = [828, 980];

const DESKTOP_PATH = smoothPath([
  [1053, 562], [1086, 568], [1098, 574], [1099, 580], [1098, 586],
  [1122, 592], [1148, 598], [1131, 604], [1143, 610], [1168, 616],
  [1174, 622], [1169, 628], [1145, 634], [1135, 640], [1130, 646],
  [1105, 652], [1103, 658], [1128, 664], [1141, 670], [1142, 676],
  [1145, 682], [1115, 688], [1125, 694], [1095, 700], [1083, 706],
  [1062, 712], [1051, 718], [1023, 724], [1006, 730], [991, 736],
  [971, 742], [954, 748], [958, 754], [925, 760], [891, 766],
  [918, 772], [946, 778], [932, 784], [940, 790], [911, 796],
  [898, 802], [904, 808], [878, 814], [863, 820], [833, 826],
  [856, 832], [822, 838], [801, 844], [767, 850], [740, 856],
  [760, 862], [762, 868], [728, 874], [701, 880], [685, 886],
  [689, 892], [659, 898], [628, 904], [614, 910], [616, 916],
  [606, 922], [599, 928], [571, 934],
]);

const MOBILE_PATH = smoothPath([
  [428, 830], [447, 838], [449, 846], [448, 854], [469, 862],
  [474, 870], [481, 878], [498, 886], [521, 894], [497, 902],
  [481, 910], [479, 918], [455, 926], [464, 934], [452, 942],
  [462, 950], [444, 958], [442, 966], [430, 974], [455, 982],
  [454, 990], [464, 998], [481, 1006], [483, 1014], [495, 1022],
  [493, 1030], [489, 1038], [502, 1046], [489, 1054], [463, 1062],
  [453, 1070], [466, 1078], [456, 1086], [431, 1094], [424, 1102],
  [403, 1110], [404, 1118], [390, 1126], [394, 1134], [402, 1142],
  [399, 1150], [399, 1158], [406, 1166], [390, 1174], [404, 1182],
  [398, 1190], [403, 1198], [416, 1206], [407, 1214], [422, 1222],
  [447, 1230], [456, 1238], [481, 1246], [498, 1254], [523, 1262],
  [534, 1270], [526, 1278], [533, 1286], [534, 1294], [543, 1302],
  [539, 1310], [521, 1318], [495, 1326], [469, 1334], [449, 1342],
  [448, 1350], [425, 1358], [424, 1366], [434, 1374], [458, 1382],
  [483, 1390], [479, 1398], [481, 1406], [481, 1414], [469, 1422],
  [470, 1430], [459, 1438], [434, 1446], [420, 1454], [401, 1462],
  [375, 1470], [392, 1478], [381, 1486], [355, 1494], [366, 1502],
  [349, 1510], [372, 1518], [348, 1526], [365, 1534], [351, 1542],
  [354, 1550], [357, 1558], [363, 1566], [356, 1574], [342, 1582],
  [350, 1590], [369, 1598], [381, 1606], [388, 1614], [400, 1622],
  [388, 1630], [402, 1638], [424, 1646], [427, 1654], [452, 1662],
  [432, 1670], [444, 1678], [468, 1686], [465, 1694], [462, 1702],
  [466, 1710], [481, 1718], [471, 1726], [453, 1734], [453, 1742],
  [436, 1750], [431, 1758], [433, 1766], [432, 1774], [456, 1782],
  [441, 1790], [425, 1798], [430, 1806], [446, 1814], [469, 1822],
  [470, 1830], [493, 1838],
]);

const SPARK_COUNT = 11;
// Was 3.2, then 5 — slowed down again at explicit request. Higher
// LAP_SECONDS means each spark takes longer to travel the full path,
// i.e. a slower-looking flow (this is a duration, not a speed, so
// bigger = slower).
const LAP_SECONDS = 6.5;

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
  const [imgW, imgH] = isDesktop ? DESKTOP_SIZE : MOBILE_SIZE;
  // animateMotion's rotate="auto" turns the shape so its local +x axis
  // follows the path's tangent — so the *length* of the streak has to
  // be on rx (x-radius), not ry, or it ends up perpendicular to travel.
  const streakRx = isDesktop ? 13 : 9;
  const streakRy = isDesktop ? 2.2 : 1.6;

  const containerRef = useRef<SVGSVGElement>(null);
  // Falls back to the plain, centered (Mid/Mid) viewBox until the
  // container's actually been measured — a brief centered-crop mismatch
  // on first paint is preferable to a hard dependency on a measurement
  // effect running before anything renders.
  const [computedViewBox, setComputedViewBox] = useState(
    isDesktop ? DESKTOP_VIEWBOX : MOBILE_VIEWBOX
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setComputedViewBox(
        coverViewBox(imgW, imgH, rect.width, rect.height, OBJECT_POSITION)
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [imgW, imgH]);

  return (
    <svg
      ref={containerRef}
      aria-hidden
      viewBox={computedViewBox}
      preserveAspectRatio="none"
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
