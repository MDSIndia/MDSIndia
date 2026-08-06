/** Where the cross streets sit along the route — shared between
 * CrossStreets (which draws the actual pavement/signals) and
 * CityScape/BuildingBanners (which both need to keep their building
 * placements clear of the same spots), so a cross street reads as a
 * real gap between buildings rather than pavement drawn on top of, or
 * cutting through, a tower. Kept to just a few fixed positions rather
 * than scattered/randomized — a handful of deliberate intersections
 * reads as real city blocks; too many starts to look like a grid
 * stamped over the whole corridor. */
export const CROSS_STREET_Z: number[] = [-14, -56, -98];

/** Half-width of the no-building buffer kept clear around each cross
 * street's centerline — wider than the street's own paved width (see
 * CROSS_STREET_WIDTH in CrossStreets.tsx) so there's a visible setback
 * rather than towers planting right at the curb. */
export const CROSS_STREET_CLEARANCE = 7;

/** Pushes a building's own z position out of any cross street's
 * clearance zone, just past whichever edge it started closer to,
 * rather than deleting it outright — keeps the skyline's overall
 * density the same while still leaving every intersection clear.
 * CityScape (placing the buildings) and BuildingBanners (which
 * recomputes those same seeded placements purely to find a facade to
 * hang a banner on) both call this on the identical raw z so the two
 * stay in sync. */
export function keepClearOfCrossStreets(z: number): number {
  let result = z;
  for (const crossZ of CROSS_STREET_Z) {
    const delta = result - crossZ;
    if (Math.abs(delta) < CROSS_STREET_CLEARANCE) {
      result = crossZ + (delta >= 0 ? 1 : -1) * CROSS_STREET_CLEARANCE;
    }
  }
  return result;
}
