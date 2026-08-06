import * as THREE from "three";

/** The one asphalt color every paved surface in the scene shares — the
 * main highway and the cross streets used to each define their own
 * copy of this (plus their own grain-drawing code), which is exactly
 * how the two end up drifting apart even when someone's careful to
 * start them off matching. Both now import this instead. */
export const ASPHALT_COLOR = "#030304";
export const ROAD_EDGE_LINE_COLOR = "rgba(235,235,230,0.85)";
export const ROAD_DASH_LINE_COLOR = "rgba(230,225,210,0.8)";

/** Paints the shared per-pixel asphalt grain onto `ctx`, composited via
 * a separate offscreen canvas + drawImage rather than
 * ctx.putImageData directly onto the destination — putImageData
 * overwrites pixels outright (it ignores alpha compositing entirely),
 * which would erase whatever base fill was already drawn instead of
 * texturing over it; drawImage honors globalAlpha like any other draw
 * call. Shared so the main road and every cross street show literally
 * the same grain density/character, not just the same base hex. */
export function paintAsphaltGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha = 0.1
) {
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = width;
  grainCanvas.height = height;
  const grainCtx = grainCanvas.getContext("2d")!;
  const grain = grainCtx.createImageData(width, height);
  for (let p = 0; p < grain.data.length; p += 4) {
    const n = Math.random() * 255;
    grain.data[p] = n;
    grain.data[p + 1] = n;
    grain.data[p + 2] = n;
    grain.data[p + 3] = 255;
  }
  grainCtx.putImageData(grain, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;
}

/** Applied identically to every road texture. Anisotropic filtering
 * because a tiled texture seen at a grazing angle (a road surface
 * receding toward the horizon, or a cross street seen almost edge-on
 * from the main road) blurs heavily under Three's default mipmap
 * filtering. Mipmaps themselves turned off, not just filtered better —
 * a cross street is viewed at a far more extreme minification than the
 * highway ever is (it's crossed nearly perpendicular to the view
 * direction), and at that angle the auto-generated mip chain was
 * measurably darkening the surface well past what anisotropic
 * filtering alone corrected for, which is what actually made the two
 * roads' shared asphalt color read as two different shades. Trading
 * mipmapping's distant-minification smoothing for a color that's
 * actually consistent regardless of viewing angle.
 *
 * colorSpace = SRGBColorSpace — every other canvas-drawn texture in
 * this scene (window grids, car paint, the ground) sets this; the road
 * textures never did. Without it, Three treats the canvas's 8-bit sRGB
 * pixel values as already-linear data and applies the linear->sRGB
 * output curve on top of them anyway, which lifts a near-black input
 * like this asphalt color into a visible mid-grey — the actual cause
 * of the road reading lighter than intended (not tone mapping, not the
 * base hex, which was already correct). */
export function applyRoadTextureDefaults(texture: THREE.Texture) {
  texture.anisotropy = 16;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
}
