"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "@/store/useGame";
import { getArtifact } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import type { ArtifactId } from "@/store/types";
import { Button, MachineIcon, Overlay } from "./primitives";

export function EvidenceCard({ id, small = false }: { id: ArtifactId; small?: boolean }) {
  const a = getArtifact(id);
  return (
    <div
      className={`relative rounded-3xl overflow-hidden text-night shadow-2xl ${small ? "w-52" : "w-72"}`}
      style={{ background: `linear-gradient(160deg, #fff6e8 0%, ${a.color} 140%)` }}
    >
      <div className="bg-night text-white px-4 py-2 flex items-center justify-between">
        <span className="font-display font-bold text-sm tracking-widest">EVIDENCE</span>
        <span className="font-display text-sm text-glow">{a.year}</span>
      </div>
      <div className={`grid place-items-center ${small ? "py-2" : "py-4"}`}>
        <MachineIcon id={id} size={small ? 70 : 110} />
      </div>
      <div className={`px-4 ${small ? "pb-3" : "pb-5"}`}>
        <p className="text-xs font-bold uppercase opacity-60">{a.shortName}</p>
        <h3 className={`font-display font-bold leading-tight ${small ? "text-lg" : "text-2xl"}`}>{a.evidenceCard.title}</h3>
        <p className={`${small ? "text-sm" : "text-base"} leading-snug mt-1`}>{a.evidenceCard.clue}</p>
        {!small && <p className="text-xs mt-3 opacity-70">Real site: {a.realLocation}</p>}
      </div>
    </div>
  );
}

export default function EvidenceUnlock() {
  const id = useGame((s) => s.activeArtifact);
  const count = useGame((s) => s.evidence.length);
  const closeEvidence = useGame((s) => s.closeEvidence);

  useEffect(() => {
    sfx.unlock();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        closeEvidence();
      }
    };
    const t = setTimeout(() => window.addEventListener("keydown", onKey), 600);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [closeEvidence]);

  if (!id) return null;

  return (
    <Overlay>
      <div className="flex flex-col items-center gap-6">
        <motion.p initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-3xl md:text-4xl font-bold text-glow drop-shadow">
          New Evidence Unlocked!
        </motion.p>
        <motion.div
          initial={{ rotateY: 180, scale: 0.4, opacity: 0 }}
          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.15 }}
          style={{ perspective: 800 }}
          className="relative"
        >
          <motion.div
            className="absolute -inset-8 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(92,225,230,.55), transparent 70%)" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <div className="relative">
            <EvidenceCard id={id} />
          </div>
        </motion.div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`w-5 h-5 rounded-full border-2 border-white ${i < count ? "bg-leaf" : "bg-transparent"}`}
            />
          ))}
        </div>
        <Button variant="glow" onClick={closeEvidence} autoFocus>
          {count >= 3 ? "Open the case board!" : "Add to Journal & continue"}
        </Button>
      </div>
    </Overlay>
  );
}
