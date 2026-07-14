"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import { useMobile } from "@/hooks/useMobile";

const SG = "var(--font-space-grotesk), Inter, sans-serif";
const NM = "'Neue Machina', 'Inter', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Fira Code', Menlo, monospace";

const QUOTE =
  "Saying is easy. Doing is harder. But we don't stop at doing—we change the status quo.";
const TYPE_MS = 26;
const TYPE_START_DELAY_MS = 600;
/** How long the gate takes to fade out locally before onStart() fires —
 * the cinematic sequence itself is untouched; this only delays when it
 * mounts by a beat so the gate gets a smooth exit instead of an
 * instant cut. */
const EXIT_MS = 420;

function seeded(i: number, salt: number) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

export function IntroStart({
  onStart,
  visible,
}: {
  onStart: () => void;
  visible: boolean;
}) {
  const isMobile = useMobile();
  const [typed, setTyped] = useState("");
  const [exiting, setExiting] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const doneTyping = typed.length >= QUOTE.length;

  // The declarative `autoFocus` prop only reliably self-applies on
  // native form-focusable elements; for an arbitrary focusable div it
  // needs an explicit imperative focus() so keyboard users can
  // immediately press Enter/Space without tabbing first.
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        x: seeded(i, 1) * 100,
        y: seeded(i, 2) * 100,
        size: 1 + seeded(i, 3) * 1.6,
        opacity: 0.2 + seeded(i, 4) * 0.5,
        duration: 3 + seeded(i, 5) * 5,
        delay: seeded(i, 6) * 5,
      })),
    []
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i++;
        setTyped(QUOTE.slice(0, i));
        if (i >= QUOTE.length) clearInterval(interval);
      }, TYPE_MS);
    }, TYPE_START_DELAY_MS);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: MouseEvent) => {
      glowRef.current?.style.setProperty(
        "transform",
        `translate(${e.clientX - 220}px, ${e.clientY - 220}px)`
      );
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile]);

  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(onStart, EXIT_MS);
  }, [exiting, onStart]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleEnter();
    }
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      onClick={handleEnter}
      onKeyDown={handleKeyDown}
      aria-label="Click anywhere to enter. Press Enter or Space."
      className="intro-gate"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        background: "#05070D",
        opacity: visible ? (exiting ? 0 : 1) : 0,
        transition: `opacity ${EXIT_MS}ms ease`,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="intro-gate-nebula" aria-hidden />

      <div className="intro-gate-stars" aria-hidden>
        {stars.map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 4}px rgba(255,255,255,${s.opacity})`,
              animation: `introStarTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {!isMobile && <div ref={glowRef} className="intro-gate-cursor-glow" aria-hidden />}

      <div className="intro-gate-hud" aria-hidden>
        <span className="intro-gate-hud-corner" style={{ top: 24, left: 24, borderWidth: "1px 0 0 1px" }} />
        <span className="intro-gate-hud-corner" style={{ top: 24, right: 24, borderWidth: "1px 1px 0 0" }} />
        <span className="intro-gate-hud-corner" style={{ bottom: 24, left: 24, borderWidth: "0 0 1px 1px" }} />
        <span className="intro-gate-hud-corner" style={{ bottom: 24, right: 24, borderWidth: "0 1px 1px 0" }} />
      </div>

      <div className="intro-gate-content">
        <div className="intro-gate-logo-wrap">
          <Image
            src="/fevicon.png"
            alt="Mahadeva Digital Solutions"
            width={64}
            height={64}
            priority
            className="intro-gate-logo"
          />
        </div>

        <p className="intro-gate-quote">
          &ldquo;{typed}
          <span className="intro-gate-caret" />
          {doneTyping ? "”" : ""}
        </p>

        <div className={`intro-gate-author${doneTyping ? " intro-gate-author--visible" : ""}`}>
          <span className="intro-gate-author-name">— Sumanth Mahadeva</span>
          <span className="intro-gate-author-title">Founder &amp; CEO, MDS</span>
        </div>
      </div>

      <div className={`intro-gate-prompt${doneTyping ? " intro-gate-prompt--visible" : ""}`}>
        <span>CLICK ANYWHERE TO ENTER</span>
        <span className="intro-gate-prompt-cursor" />
      </div>

      <style jsx>{`
        .intro-gate-nebula {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 60% 42% at 50% 30%, rgba(0, 85, 255, 0.16) 0%, transparent 70%),
            radial-gradient(ellipse 45% 35% at 68% 70%, rgba(0, 217, 255, 0.08) 0%, transparent 70%);
          opacity: 0;
          animation:
            introFadeInOnly 1.2s ease-out 0s forwards,
            introNebulaPulse 9s ease-in-out 1.2s infinite;
        }

        .intro-gate-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          animation: introFadeInOnly 1s ease-out 0.15s forwards;
        }

        .intro-gate-cursor-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 440px;
          height: 440px;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, rgba(0, 217, 255, 0.16) 0%, rgba(0, 217, 255, 0.05) 45%, transparent 72%);
          filter: blur(2px);
          mix-blend-mode: screen;
          will-change: transform;
          z-index: 1;
        }

        .intro-gate-hud {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          animation: introFadeInOnly 1.2s ease-out 0.4s forwards;
        }
        .intro-gate-hud-corner {
          position: absolute;
          width: 26px;
          height: 26px;
          border-style: solid;
          border-color: rgba(0, 217, 255, 0.28);
        }

        .intro-gate-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.75rem;
          padding: 2rem 1.5rem;
          text-align: center;
        }

        .intro-gate-logo-wrap {
          opacity: 0;
          animation: introFadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
        }
        :global(.intro-gate-logo) {
          width: 56px;
          height: 56px;
          object-fit: contain;
          animation: introLogoFloat 5.5s ease-in-out infinite,
            introLogoBreathe 4.2s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(0, 217, 255, 0.55))
            drop-shadow(0 0 26px rgba(0, 150, 255, 0.3));
          transition: filter 0.5s ease;
        }
        .intro-gate:hover :global(.intro-gate-logo) {
          filter: drop-shadow(0 0 14px rgba(0, 217, 255, 0.8))
            drop-shadow(0 0 38px rgba(0, 150, 255, 0.45));
        }

        .intro-gate-quote {
          margin: 0;
          max-width: 46rem;
          font-family: ${MONO};
          font-weight: 500;
          font-size: clamp(1.15rem, 3vw, 2.1rem);
          line-height: 1.5;
          letter-spacing: 0.01em;
          color: rgba(255, 255, 255, 0.94);
          text-shadow: 0 0 24px rgba(0, 217, 255, 0.18);
          opacity: 0;
          animation: introFadeInOnly 0.8s ease-out 0.5s forwards;
        }
        .intro-gate-caret {
          display: inline-block;
          width: 2px;
          height: 0.95em;
          margin-left: 3px;
          vertical-align: text-bottom;
          background: #00d9ff;
          box-shadow: 0 0 8px #00d9ff;
          animation: introCaretBlink 1s step-end infinite;
        }

        .intro-gate-author {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .intro-gate-author--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .intro-gate-author-name {
          font-family: ${NM};
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .intro-gate-author-title {
          font-family: ${SG};
          font-size: 0.68rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.45);
        }

        .intro-gate-prompt {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 3.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          font-family: ${SG};
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: #00d9ff;
          text-shadow: 0 0 14px rgba(0, 217, 255, 0.55);
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.6s ease 0.4s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s;
        }
        .intro-gate-prompt--visible {
          opacity: 1;
          transform: translateY(0);
          animation: introPromptPulse 2.6s ease-in-out 1s infinite;
        }
        .intro-gate-prompt-cursor {
          display: inline-block;
          width: 2px;
          height: 0.85em;
          margin-left: 6px;
          background: #00d9ff;
          box-shadow: 0 0 8px #00d9ff;
          animation: introCaretBlink 1s step-end infinite;
        }

        @keyframes introFadeInOnly {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes introFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes introStarTwinkle {
          0%,
          100% {
            filter: brightness(0.75);
          }
          50% {
            filter: brightness(1.4);
          }
        }
        @keyframes introNebulaPulse {
          0%,
          100% {
            opacity: 0.75;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }
        @keyframes introLogoFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes introLogoBreathe {
          0%,
          100% {
            opacity: 0.92;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes introCaretBlink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
        @keyframes introPromptPulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }

        .intro-gate:focus-visible {
          box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
