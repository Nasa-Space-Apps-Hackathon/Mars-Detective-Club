"use client";

import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/store/useGame";
import { getArtifact } from "@/lib/content";
import { getObjective, nextTarget } from "@/lib/objectives";
import { ZONES } from "@/world/zones";

function Compass() {
  const evidence = useGame((s) => s.evidence);
  const [px, pz] = useGame((s) => s.playerPos);
  const yaw = useGame((s) => s.playerYaw);
  const target = nextTarget(evidence);
  if (!target) return null;
  const [tx, tz] = ZONES[target];
  const dx = tx - px;
  const dz = tz - pz;
  const dist = Math.round(Math.hypot(dx, dz));
  // angle of target relative to where the player faces (world uses sin(yaw), cos(yaw) as forward)
  const targetAngle = Math.atan2(dx, dz);
  let rel = targetAngle - yaw;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel)); // normalize to [-π, π]
  const deg = (-rel * 180) / Math.PI;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="glass rounded-full w-20 h-20 grid place-items-center relative">
        <motion.div animate={{ rotate: deg }} transition={{ type: "spring", stiffness: 120, damping: 18 }} className="w-10 h-10">
          <svg viewBox="0 0 40 40" className="w-full h-full" aria-label="Direction to next machine">
            <path d="M20 3 L33 34 L20 26 L7 34 Z" fill="#5ce1e6" stroke="#1b1f3b" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
      <span className="glass rounded-full px-3 py-0.5 text-sm font-display">{dist} m</span>
    </div>
  );
}

export default function HUD() {
  const phase = useGame((s) => s.phase);
  const evidence = useGame((s) => s.evidence);
  const near = useGame((s) => s.nearArtifact);
  const muted = useGame((s) => s.muted);
  const toggleJournal = useGame((s) => s.toggleJournal);
  const togglePause = useGame((s) => s.togglePause);
  const toggleMute = useGame((s) => s.toggleMute);
  const startScan = useGame((s) => s.startScan);
  const exploring = phase === "explore";
  const nearSolved = near ? evidence.includes(near) : false;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* top-left objective */}
      <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-4 left-4 max-w-sm">
        <div className="glass rounded-2xl px-4 py-3">
          <p className="text-xs font-display uppercase tracking-widest text-glow">Case #001 · Did Mars have water?</p>
          <p className="font-display text-lg leading-tight mt-0.5">{getObjective({ phase, evidence })}</p>
        </div>
      </motion.div>

      {/* top-right evidence + buttons */}
      <div className="absolute top-4 right-4 flex items-start gap-2 pointer-events-auto">
        <button
          onClick={() => toggleJournal()}
          disabled={!exploring}
          className="glass rounded-2xl px-4 py-2 font-display text-lg flex items-center gap-2 hover:border-glow disabled:opacity-60 cursor-pointer"
          aria-label="Open journal"
        >
          🔎 <span className="font-bold">{evidence.length}/3</span>
          <span className="text-sm opacity-80 hidden md:inline">
            Journal <kbd>J</kbd>
          </span>
        </button>
        <button onClick={toggleMute} className="glass rounded-2xl w-11 h-11 grid place-items-center cursor-pointer" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          onClick={() => togglePause(true)}
          disabled={!exploring}
          className="glass rounded-2xl w-11 h-11 grid place-items-center cursor-pointer disabled:opacity-60"
          aria-label="Pause"
        >
          ⏸
        </button>
      </div>

      {/* compass bottom-right */}
      {exploring && (
        <div className="absolute bottom-6 right-6">
          <Compass />
        </div>
      )}

      {/* scan prompt */}
      <AnimatePresence>
        {exploring && near && (
          <motion.div
            key={near}
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-24 inset-x-0 flex justify-center pointer-events-auto"
          >
            <button
              onClick={() => startScan(near)}
              className="glass rounded-2xl px-6 py-3 font-display text-xl flex items-center gap-3 border-glow cursor-pointer hover:scale-105 transition"
            >
              <kbd>E</kbd>
              {nearSolved ? `Re-read ${getArtifact(near).shortName}'s file` : `Scan ${getArtifact(near).name}`}
              <span className="text-glow animate-pulse">◉</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* controls hint bottom-left */}
      {exploring && (
        <div className="absolute bottom-6 left-6 glass rounded-2xl px-4 py-2 text-sm text-white/85 hidden md:block">
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> move · <kbd>Shift</kbd> run · <kbd>Space</kbd> jump · <kbd>E</kbd> scan · <kbd>Esc</kbd> pause
        </div>
      )}
    </div>
  );
}
