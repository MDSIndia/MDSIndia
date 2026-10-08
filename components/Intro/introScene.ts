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
export const STAR_DURATION = 6.0;
/** When the star detonates, in seconds from the start. */
export const STAR_BLAST_AT = 2.5;
/** When the hand-off glow starts, in seconds from the start. It begins while
 * the camera is still deep inside the dense, turning star cloud (the cloud
 * thins out and leaves empty black in the last ~0.7s of the dive), so the
 * glow rises out of the stars with no empty gap before it. STAR_DURATION is
 * the length of the 3D scene itself, which keeps running under the glow. */
export const STAR_HANDOFF_AT = 5.3;
