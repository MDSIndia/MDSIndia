/** Which scene the intro plays.
 *
 * "star" — the star portal and cosmic blast: a flight through deep space
 *          toward the glowing portal, ending in the blast that hands off
 *          to the homepage.
 * "city" — the original cyberpunk highway flythrough. All of its scene
 *          code is still in components/Intro/scene and is simply not
 *          mounted while this is "star"; flip this back to restore it.
 */
export type IntroSceneKind = "star" | "city";

export const INTRO_SCENE: IntroSceneKind = "star";

/** Length of the star scene, in seconds. The star scene runs on its own
 * clock rather than INTRO_DURATION (which paces the city flythrough):
 * it needs a few seconds of approach, then room for the blast and the
 * cosmos to spread before the hand-off. */
export const STAR_DURATION = 7.8;
/** When the star detonates, in seconds from the start. */
export const STAR_BLAST_AT = 3.0;
