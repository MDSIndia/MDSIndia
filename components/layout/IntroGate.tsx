"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const QUOTE =
  "Saying is easy. Doing is harder. But we don't stop at doing—we change the status quo.";

const BLAST_IMAGES = [
  "/rightimage.jpeg",
  "/herosectionimage.jpg",
  "/pillar-mission.png",
  "/pillar-vision.png",
  "/pillar-purpose.png",
  "/about.jpeg",
  "/technologywithoutsoul.png",
  "/worldleftalone.png",
  "/gapwefill.png",
  "/heroimage.png",
  "/technlogy.png",
  ...Array.from({ length: 15 }, (_, i) => `/intro-slide-${String(i + 1).padStart(2, "0")}.png`),
];

const SG = "var(--font-space-grotesk), Inter, sans-serif";
const NM = "'Neue Machina', 'Inter', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Fira Code', Menlo, monospace";
const TYPE_MS = 32;
const TYPE_START_DELAY_MS = 900;
const LANE_STAGGER_MS = 72;
const LANE_DURATION_MS = 760;
const PORTAL_MS = 672;
const LANE_ITEM_COUNT = 28;
const LANE_POSITIONS = [-2.3, -1.5, -0.75, 0.75, 1.5, 2.3];
const BLAST_MS = LANE_ITEM_COUNT * LANE_STAGGER_MS + LANE_DURATION_MS + PORTAL_MS;

const seeded = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export function IntroGate({ onComplete }: { onComplete: () => void }) {
  const [typed, setTyped] = useState("");
  const [blasting, setBlasting] = useState(false);
  const doneTyping = typed.length >= QUOTE.length;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: seeded(i, 1) * 100,
        y: seeded(i, 2) * 100,
        size: 1 + seeded(i, 3) * 2,
        opacity: 0.2 + seeded(i, 4) * 0.5,
        duration: 3 + seeded(i, 5) * 4,
        delay: seeded(i, 6) * 4,
      })),
    []
  );

  const lanes = useMemo(
    () =>
      Array.from({ length: LANE_ITEM_COUNT }, (_, i) => {
        const dir = LANE_POSITIONS[i % LANE_POSITIONS.length];
        const side = Math.sign(dir);
        return {
          src: BLAST_IMAGES[i % BLAST_IMAGES.length],
          startX: dir * 3,
          midX: dir * 14,
          endX: dir * (32 + Math.random() * 10),
          startY: -6 - Math.random() * 3,
          midY: 5 + Math.random() * 3,
          endY: 22 + Math.random() * 8,
          rotate: side * (4 + Math.random() * 6),
          rotateY: side * -(55 + Math.random() * 12),
          delay: (i * LANE_STAGGER_MS) / 1000,
        };
      }),
    []
  );

  const handleClick = () => {
    if (blasting) return;
    setBlasting(true);
    setTimeout(() => {
      document.body.style.overflow = "";
      onComplete();
    }, BLAST_MS);
  };

  return (
    <div
      onClick={handleClick}
      className="fixed inset-0 z-[100000] flex items-center justify-center cursor-pointer overflow-hidden"
      style={{ background: "#020208" }}
    >
      {/* Starfield — warps outward when entering, like flying forward through space */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={blasting ? { scale: 3.2, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: BLAST_MS / 1000, ease: "easeIn" }}
      >
        {stars.map((star, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: "#FFFFFF",
              boxShadow: `0 0 ${star.size * 4}px rgba(255,255,255,${star.opacity})`,
            }}
            animate={{ opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4] }}
            transition={{ duration: star.duration, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
          />
        ))}
        <div
          className="absolute"
          style={{
            width: 700,
            height: 700,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(ellipse, rgba(0,85,255,0.14) 0%, transparent 70%)",
            animation: "heroBreath 6s ease-in-out infinite",
          }}
        />
      </motion.div>

      {/* Road markers — each image rushes toward the viewer one after another, like lane lines on a road */}
      <div className="absolute inset-0 pointer-events-none" style={{ perspective: 600, transformStyle: "preserve-3d" }}>
        {lanes.map((lane, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: "50%", top: "38%", width: 0, height: 0, transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="absolute overflow-hidden rounded-2xl"
              style={{
                width: 145,
                height: 245,
                marginLeft: -72.5,
                marginTop: -122.5,
                border: "1px solid rgba(0,212,255,0.35)",
                boxShadow: "0 0 50px rgba(0,150,255,0.25), inset 0 0 24px rgba(0,0,0,0.35)",
                transformStyle: "preserve-3d",
              }}
              initial={{
                x: `${lane.startX}vw`,
                y: `${lane.startY}vh`,
                scale: 0.15,
                scaleX: 1,
                opacity: 0,
                rotate: 0,
                rotateY: lane.rotateY,
                filter: "blur(0px)",
              }}
              animate={
                blasting
                  ? {
                      x: [`${lane.startX}vw`, `${lane.midX}vw`, `${lane.endX}vw`],
                      y: [`${lane.startY}vh`, `${lane.midY}vh`, `${lane.endY}vh`],
                      scale: [0.15, 1.3, 2.9],
                      scaleX: [1, 1.05, 1.22],
                      opacity: [0, 1, 1, 0],
                      rotate: [0, lane.rotate * 0.6, lane.rotate],
                      rotateY: lane.rotateY,
                      filter: ["blur(0px)", "blur(1.5px)", "blur(5px)"],
                    }
                  : {
                      x: `${lane.startX}vw`,
                      y: `${lane.startY}vh`,
                      scale: 0.15,
                      scaleX: 1,
                      opacity: 0,
                      rotate: 0,
                      rotateY: lane.rotateY,
                      filter: "blur(0px)",
                    }
              }
              transition={{
                default: {
                  duration: LANE_DURATION_MS / 1000,
                  times: [0, 0.45, 1],
                  ease: [0.55, 0, 0.85, 0.35],
                  delay: lane.delay,
                },
                opacity: {
                  duration: LANE_DURATION_MS / 1000,
                  times: [0, 0.1, 0.82, 1],
                  ease: "easeIn",
                  delay: lane.delay,
                },
              }}
            >
              <Image
                src={lane.src}
                alt=""
                fill
                className="object-cover"
                style={{ filter: "contrast(1.12) saturate(1.15) brightness(1.02)" }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(0,212,255,0.05) 4px)",
                }}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Shockwave flash */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(180,230,255,0.95) 0%, rgba(0,150,255,0.4) 35%, transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={blasting ? { opacity: [0, 0.9, 0], scale: [0.2, 2.6, 3.2] } : { opacity: 0, scale: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Portal flash — culminates right as the reveal happens, like stepping through into the world */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, #EAF8FF 0%, #7FD8FF 30%, #0055FF 60%, #020208 100%)",
        }}
        initial={{ opacity: 0, scale: 0.1 }}
        animate={blasting ? { opacity: [0, 1], scale: [0.1, 6] } : { opacity: 0, scale: 0.1 }}
        transition={{
          duration: PORTAL_MS / 1000,
          ease: "easeIn",
          delay: (BLAST_MS - PORTAL_MS - 150) / 1000,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative flex flex-col items-center px-6 text-center max-w-3xl"
        animate={{ opacity: blasting ? 0 : 1, scale: blasting ? 0.92 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="relative mb-10"
          initial={{ opacity: 0, scale: 0.75, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="relative w-20 h-20 flex items-center justify-center flex-shrink-0"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/fevicon.png"
              alt="Mahadeva Digital Solutions"
              width={80}
              height={80}
              className="w-[72px] h-[72px] object-contain"
              priority
              style={{
                filter:
                  "drop-shadow(0 0 16px rgba(0,180,255,0.6)) drop-shadow(0 0 34px rgba(0,85,255,0.35))",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Quote */}
        <p
          className="leading-relaxed mb-5"
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: "clamp(0.95rem, 2.1vw, 1.5rem)",
            color: "rgba(255,255,255,0.90)",
            minHeight: "3.6em",
            textShadow: "0 0 20px rgba(0,212,255,0.25)",
          }}
        >
          &ldquo;{typed}
          <span
            className="inline-block animate-pulse"
            style={{ width: 2, height: "1em", background: "#00D4FF", marginLeft: 3, verticalAlign: "text-bottom", boxShadow: "0 0 8px #00D4FF" }}
          />
          {doneTyping ? "”" : ""}
        </p>

        {/* Attribution */}
        <motion.div
          className="flex flex-col items-center gap-1.5 mb-10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: doneTyping ? 1 : 0, y: doneTyping ? 0 : 8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span
            style={{
              fontFamily: NM,
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            — Sumanth Mahadeva
          </span>
          <span
            className="text-[0.62rem] tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,255,255,0.32)", fontFamily: SG }}
          >
            Founder &amp; CEO, MDS
          </span>
        </motion.div>
      </motion.div>

      {/* Click hint — pinned to the bottom */}
      <motion.div
        className="absolute bottom-10 md:bottom-14 left-0 right-0 flex flex-col items-center gap-3"
        animate={{ opacity: blasting ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.span
          className="text-xs tracking-[0.5em] uppercase"
          style={{ color: "rgba(255,255,255,0.34)", fontFamily: SG }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          Click anywhere to enter
        </motion.span>
        <motion.div
          style={{ width: 1, height: 22, background: "linear-gradient(to bottom, rgba(0,212,255,0.6), transparent)" }}
          animate={{ scaleY: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* HUD corner brackets */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: blasting ? 0 : 0.5 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        {[
          { top: 28, left: 28, borderWidth: "2px 0 0 2px" },
          { top: 28, right: 28, borderWidth: "2px 2px 0 0" },
          { bottom: 28, left: 28, borderWidth: "0 0 2px 2px" },
          { bottom: 28, right: 28, borderWidth: "0 2px 2px 0" },
        ].map((corner, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              ...corner,
              width: 28,
              height: 28,
              borderStyle: "solid",
              borderColor: "rgba(0,212,255,0.5)",
            } as CSSProperties}
          />
        ))}
      </motion.div>
    </div>
  );
}
