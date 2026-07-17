export type PortalPhase = "idle" | "transitioning";

// A short veil covers the route swap so it's never a hard cut: holds
// briefly at full opacity (matching the main intro's own "hold, then
// dissolve" hand-off shape — see IntroTransition), then clears to
// reveal the destination page, already loaded underneath.
export const TRANSITION_MS = 750;
// How far into the veil (still opaque) the actual navigation fires —
// keeps the route swap itself hidden.
export const NAVIGATE_AT_MS = 220;
