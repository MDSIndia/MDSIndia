"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const QUOTE =
  "Saying is easy. Doing is harder. But we don't stop at doing—we change the status quo.";

const BLAST_IMAGES = [
  "/rightimage.jpeg",
  "/pillar-mission.png",
  "/pillar-vision.png",
  "/pillar-purpose.png",
  "/about.jpeg",
  "/technologywithoutsoul.png",
  "/worldleftalone.png",
  "/gapwefill.png",
];

const SG = "var(--font-space-grotesk), Inter, sans-serif";
const TYPE_MS = 32;
const BLAST_MS = 750;

export function IntroGate({ onComplete }: { onComplete: () => void }) {
  const [typed, setTyped] = useState("");
  const [blasting, setBlasting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(QUOTE.slice(0, i));
      if (i >= QUOTE.length) clearInterval(id);
    }, TYPE_MS);
    return () => clearInterval(id);
  }, []);

  const shards = useMemo(
    () =>
      BLAST_IMAGES.map((src, i) => {
        const angle = (i / BLAST_IMAGES.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const distance = 480 + Math.random() * 480;
        return {
          src,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: (Math.random() - 0.5) * 260,
          delay: Math.random() * 0.08,
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
      {/* Blast shards */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {shards.map((shard) => (
          <motion.div
            key={shard.src}
            className="absolute rounded-xl overflow-hidden"
            style={{ width: 150, height: 150 }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
            animate={
              blasting
                ? { x: shard.x, y: shard.y, opacity: 0, scale: 1.15, rotate: shard.rotate }
                : { x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }
            }
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: shard.delay }}
          >
            <Image src={shard.src} alt="" fill className="object-cover" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative flex flex-col items-center gap-8 px-6 text-center max-w-3xl"
        animate={{ opacity: blasting ? 0 : 1, scale: blasting ? 0.92 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            boxShadow: "0 0 40px rgba(0,85,255,0.25), 0 0 80px rgba(0,85,255,0.10), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          <Image
            src="/fevicon.png"
            alt="Mahadeva Digital Solutions"
            width={64}
            height={64}
            className="w-14 h-14 object-contain"
            priority
          />
        </div>

        <p
          className="font-medium leading-relaxed"
          style={{
            fontFamily: SG,
            fontSize: "clamp(1.05rem, 2.4vw, 1.7rem)",
            color: "rgba(255,255,255,0.90)",
            minHeight: "3.6em",
          }}
        >
          &ldquo;{typed}
          <span
            className="inline-block animate-pulse"
            style={{ width: 2, height: "1em", background: "#00D4FF", marginLeft: 3, verticalAlign: "text-bottom" }}
          />
          {typed.length >= QUOTE.length ? "”" : ""}
        </p>

        <span
          className="text-xs tracking-[0.5em] uppercase"
          style={{ color: "rgba(255,255,255,0.32)", fontFamily: SG }}
        >
          Click anywhere to enter
        </span>
      </motion.div>
    </div>
  );
}
