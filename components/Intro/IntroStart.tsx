"use client";

import type { KeyboardEvent } from "react";

const SG = "var(--font-space-grotesk), Inter, sans-serif";

export function IntroStart({
  onStart,
  visible,
}: {
  onStart: () => void;
  visible: boolean;
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStart();
    }
  };

  return (
    <div
      className="intro-root"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.45s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <button
        type="button"
        autoFocus
        onClick={onStart}
        onKeyDown={handleKeyDown}
        className="intro-start-btn group"
        aria-label="Click to start the cinematic intro. Press Enter or Space."
        style={{
          background: "none",
          border: "none",
          outline: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.15rem",
          padding: "2.5rem",
        }}
      >
        <span
          className="intro-click-text"
          style={{
            fontFamily: "'Neue Machina', 'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2rem, 6.2vw, 4.5rem)",
            letterSpacing: "0.1em",
            color: "#ffffff",
            transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="intro-click-text-inner">CLICK TO START</span>
        </span>
        <span
          className="intro-helper-text"
          style={{
            fontFamily: SG,
            fontSize: "0.68rem",
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Enter the Experience
        </span>
      </button>

      <style jsx>{`
        .intro-start-btn:hover .intro-click-text-inner,
        .intro-start-btn:focus-visible .intro-click-text-inner {
          display: inline-block;
          transform: scale(1.045);
          text-shadow:
            0 0 26px rgba(0, 212, 255, 0.95),
            0 0 64px rgba(0, 150, 255, 0.6),
            0 0 130px rgba(0, 85, 255, 0.4);
        }
        .intro-click-text-inner {
          display: inline-block;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
            text-shadow 0.4s ease;
        }
        .intro-start-btn:focus-visible {
          box-shadow:
            0 0 0 1px rgba(0, 212, 255, 0.55),
            0 0 30px rgba(0, 150, 255, 0.35);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
