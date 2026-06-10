"use client";
import { useEffect, useRef } from "react";
import { useMobile } from "@/hooks/useMobile";

export function CustomCursor() {
  const isMobile = useMobile();
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);
  const target  = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isMobile) return;

    document.body.classList.add("custom-cursor-active");

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let rafId: number;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;
      ringRef.current?.style.setProperty(
        "transform",
        `translate(${current.current.x - 20}px, ${current.current.y - 20}px)`
      );
      dotRef.current?.style.setProperty(
        "transform",
        `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`
      );
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onEnter = () => {
      ringRef.current?.classList.add("scale-150");
      if (ringRef.current) ringRef.current.style.borderColor = "rgba(0,229,255,0.9)";
    };
    const onLeave = () => {
      ringRef.current?.classList.remove("scale-150");
      if (ringRef.current) ringRef.current.style.borderColor = "rgba(0,229,255,0.4)";
    };

    const els = document.querySelectorAll("a, button, [data-cursor='pointer']");
    els.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.body.classList.remove("custom-cursor-active");
      els.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-cyan-400/40 pointer-events-none z-[9999] transition-colors duration-200 mix-blend-difference"
        style={{ willChange: "transform" }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-cyan-400 pointer-events-none z-[9999]"
        style={{ willChange: "transform" }}
      />
    </>
  );
}
