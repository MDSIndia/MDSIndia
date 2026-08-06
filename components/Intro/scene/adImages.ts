/**
 * Brand imagery reused from the previous intro animation, now displayed
 * as in-world digital advertising throughout the cinematic city. Every
 * path here must exist in /public — if an asset is ever removed, drop
 * its entry (or replace it) rather than pointing at a placeholder.
 */
export const AD_IMAGES = [
  "/rightimage.jpeg",
  "/herosectionimage.jpg",
  "/pillar-mission.png",
  "/pillar-vision.png",
  "/pillar-purpose.png",
  "/about.jpeg",
  "/technologywithoutsoul.png",
  "/worldleftalone.png",
  "/gapwefill.png",
  "/heroimage.png",
  "/technlogy.png",
  ...Array.from(
    { length: 15 },
    (_, i) => `/intro-slide-${String(i + 1).padStart(2, "0")}.png`
  ),
];

/** The MDS mark, used sparingly as a floating holographic brand projection. */
export const BRAND_LOGO = "/logo.png";

/** Hand-authored SVG glass panel (frame + tinted glass + a diagonal
 * sky-reflection sweep) used for every vehicle's cabin windows —
 * a real vector asset rather than a flat color, so cabins read as
 * actual glass instead of a solid painted block. */
export const CAR_GLASS = "/car-glass.svg";
