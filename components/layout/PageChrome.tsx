"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const CustomCursor = dynamic(
  () => import("@/components/shared/CustomCursor").then((m) => ({ default: m.CustomCursor })),
  { ssr: false }
);

const SceneCanvas = dynamic(
  () => import("@/components/three/SceneCanvas").then((m) => ({ default: m.SceneCanvas })),
  { ssr: false }
);

/* Animated dot grid — fixed behind everything */
const seeded = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const starPalette = ["255,255,255", "220,235,255", "200,220,255", "255,255,255"];

const GlobalStars = dynamic(
  () => Promise.resolve(() => {
    const stars = Array.from({ length: 90 }, (_, index) => {
      const size = 1.6 + seeded(index, 3) * 2.8;
      const color = starPalette[Math.floor(seeded(index, 4) * starPalette.length)];
      return {
        x: seeded(index, 1) * 100,
        y: seeded(index, 2) * 100,
        size,
        color,
        opacity: 0.28 + seeded(index, 5) * 0.42,
        duration: 12 + seeded(index, 6) * 18,
        delay: -seeded(index, 7) * 28,
        dx: (seeded(index, 8) - 0.5) * 72,
        dy: -18 - seeded(index, 9) * 38,
      };
    });
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden>
        {stars.map((star, index) => (
          <span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              background: `rgba(${star.color}, 1)`,
              boxShadow: `0 0 ${Math.max(5, star.size * 5)}px rgba(${star.color}, ${star.opacity})`,
              animation: `starDrift ${star.duration}s linear infinite, starTwinkle ${5 + (index % 6)}s ease-in-out infinite`,
              animationDelay: `${star.delay}s, ${-(index % 7)}s`,
              "--star-dx": `${star.dx}px`,
              "--star-dy": `${star.dy}px`,
            } as CSSProperties}
          />
        ))}
      </div>
    );
  }),
  { ssr: false }
);

// A hard reload (F5 / the browser's reload button) on a subpage should
// land back on the homepage's starting point — the intro cinematic —
// rather than re-rendering whatever subpage the user happened to be
// on. The Navigation Timing API is what actually distinguishes "this
// load was a reload" from "this was a normal navigation to this URL"
// (a plain pathname check alone can't tell those apart); router.replace
// rather than push so the subpage doesn't linger in browser history
// as a page you'd land back on with the back button. A no-op on "/"
// itself — reloading the homepage already re-plays the intro on its
// own (see useIntro's hasPlayedThisRuntime, which resets on a real
// reload since it's in-memory, not persisted).
function useReloadGoesHome() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") return;
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entry?.type === "reload") {
      router.replace("/");
    }
  }, [pathname, router]);
}

export function PageChrome({ children }: { children: ReactNode }) {
  useReloadGoesHome();

  return (
    <>
      <CustomCursor />
      <GlobalStars />
      <SceneCanvas />

      <div className="relative min-h-screen" style={{ zIndex: 1 }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </>
  );
}
