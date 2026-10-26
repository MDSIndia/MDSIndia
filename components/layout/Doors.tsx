"use client";

import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { getJourneyArmed, subscribeJourneyArmed } from "@/lib/journey";

/* A panel's content, laid out as the two leaves of a pair of doors.

   Outside the journey (other routes, reduced motion) the leaves vanish
   (`display: contents`) and this is just the content. During the journey the
   first leaf is the whole panel; while the panel is on stage a second, identical
   leaf is rendered on top of it (inert, hidden from assistive tech). When the
   doors open JourneyController clips the first leaf to the left half of the
   screen and the second to the right half, and slides them apart. */
export function Doors({ label, children, className = "" }: { label?: string; children: ReactNode; className?: string }) {
  const armed = useSyncExternalStore(subscribeJourneyArmed, getJourneyArmed, () => null);
  return (
    <>
      <div className={`door-half ${className}`} data-door="l">
        {children}
      </div>
      {label && armed === label && (
        <div className={`door-half ${className}`} data-door="r" aria-hidden inert>
          {children}
        </div>
      )}
    </>
  );
}
