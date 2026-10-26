"use client";

import type { ReactNode } from "react";
import { Doors } from "@/components/layout/Doors";

/* One panel of the homepage journey.

   Outside the journey (other routes, or a visitor who prefers reduced motion)
   this is plain wrapper divs that add nothing, so the same markup serves the
   ordinary vertical layout. During the journey the CSS in globals.css
   (`html.jmode .hslide`) makes it a full-screen panel and JourneyController
   places it on stage: opening it like a pair of doors (see Doors) onto the next
   panel, scaling it to fit and, when a screen is too short for all its content
   (phones), scrolling the content upwards as you go. */
export function Slide({
  children,
  label,
  id,
  className = "",
  bg,
  zoom,
}: {
  children: ReactNode;
  /** Name of the panel; also what pairs a panel with its second door leaf. */
  label?: string;
  id?: string;
  className?: string;
  /** A backdrop painted behind the panel's content, filling the whole panel
   * (it travels with the panel, unlike anything placed outside it). */
  bg?: ReactNode;
  /** Opens by diving the camera into the panel's `data-zoom-layer` (this many times
   * closer) instead of splitting like doors — see JourneyController. */
  zoom?: number;
}) {
  return (
    <div id={id} data-slide data-label={label} data-zoom={zoom} className={`hslide ${className}`}>
      <Doors label={label}>
        {bg}
        <div className="hslide-inner">{children}</div>
      </Doors>
    </div>
  );
}
