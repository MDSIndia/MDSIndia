/* Shared state for the homepage "journey" (see JourneyController): where the
   camera is along the path, how fast it is moving, and where each section
   starts in the page's scroll distance. Plain module state — read every frame
   by the canvas backdrop, so it deliberately lives outside React. */
export const journey = {
  /** Camera position in panel units: 0 = first panel, 1 = second, … */
  c: 0,
  /** Camera speed in panel units per second (signed; negative = backwards). */
  v: 0,
};

let anchors: Record<string, number> = {};

export function setJourneyAnchors(next: Record<string, number>) {
  anchors = next;
}

/** Scroll distance at which the section with this id comes into view, or null
 * when the journey isn't running (the page is a normal vertical one). */
export function getJourneyAnchor(id: string): number | null {
  return id in anchors ? anchors[id] : null;
}

let goTo: ((y: number, duration?: number) => void) | null = null;

export function setJourneyGoTo(fn: ((y: number, duration?: number) => void) | null) {
  goTo = fn;
}

/** Fly to a scroll-timeline position (the journey owns scrolling while it runs). */
export function journeyGoTo(y: number, duration = 2): boolean {
  if (!goTo) return false;
  goTo(y, duration);
  return true;
}

/* The panel whose "doors" are about to open (see JourneyController). Its second
   half is only rendered while it is armed — the panel that is on stage — so
   the rest of the page never carries a duplicate. */
let armed: string | null = null;
const armedListeners = new Set<() => void>();

export function setJourneyArmed(label: string | null) {
  if (armed === label) return;
  armed = label;
  armedListeners.forEach((l) => l());
}
export function subscribeJourneyArmed(l: () => void) {
  armedListeners.add(l);
  return () => {
    armedListeners.delete(l);
  };
}
export function getJourneyArmed() {
  return armed;
}
