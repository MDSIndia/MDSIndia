/** Where each fixed, non-instanced landmark set-piece sits along the
 * route (Landmark's MDS sphere, NoorvaTower, Waterfall, Biodome,
 * SkyPlaza — see their own files for the real positions/radii this
 * mirrors) — CityScape's procedurally-placed buildings otherwise have
 * no idea these fixed structures exist and will happily roll a
 * position right on top of one, which is exactly what was showing up
 * as buildings visibly clipping through the dome/tower/platform
 * shapes. `clearance` is the landmark's own footprint radius plus a
 * margin, used as a z-only exclusion band (see keepClearOfLandmarks
 * below) rather than true 2D distance — cheap, and sufficient since
 * each landmark only sits on one side of the road (`side`), so a
 * building on the opposite side was never going to collide with it
 * regardless of z. */
interface LandmarkClearance {
  z: number;
  side: -1 | 1;
  clearance: number;
}

const LANDMARK_CLEARANCES: LandmarkClearance[] = [
  { z: -52, side: 1, clearance: 16 }, // Landmark.tsx — MDS sphere, x=24, ring extends to radius*1.7=15.3
  { z: -27, side: -1, clearance: 8 }, // NoorvaTower.tsx, x=-21
  { z: -72, side: -1, clearance: 10 }, // Waterfall.tsx, x=-27
  { z: -95, side: 1, clearance: 15 }, // Biodome.tsx, x=22, radius 10
  { z: -105, side: -1, clearance: 10 }, // SkyPlaza.tsx, x=-19
  { z: -38, side: 1, clearance: 9 }, // HolographicMonument.tsx, x=16
  { z: -48, side: -1, clearance: 12 }, // FuturisticPark.tsx, x=-16, radius 12 — sits in the existing gap between NoorvaTower's (-27±8) and Waterfall's (-72±10) zones on this side, chosen specifically so it doesn't overlap either.
];

/** Pushes a building's own z position out of any same-side landmark's
 * clearance band, just past whichever edge it started closer to —
 * same "shift along z" trick keepClearOfCrossStreets uses, applied on
 * top of it (call this second) so a building never lands inside
 * either kind of exclusion zone. CityScape (placing the buildings) and
 * BuildingBanners (which recomputes those same seeded placements
 * purely to find a facade to hang a banner on) both need to call this
 * on the identical (z, side) so a banner never drifts off the real
 * building it's meant to be hanging on. */
export function keepClearOfLandmarks(z: number, side: -1 | 1): number {
  let result = z;
  for (const lm of LANDMARK_CLEARANCES) {
    if (lm.side !== side) continue;
    const delta = result - lm.z;
    if (Math.abs(delta) < lm.clearance) {
      result = lm.z + (delta >= 0 ? 1 : -1) * lm.clearance;
    }
  }
  return result;
}
