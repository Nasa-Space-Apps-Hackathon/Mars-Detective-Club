"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ACTIVITIES } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { Button } from "../primitives";
import { ActivityShell, type ActivityProps } from "./ActivityHost";

type Stage = "dig" | "found" | "waiting" | "revealed";

export default function DigSite({ onSuccess }: ActivityProps) {
  const A = ACTIVITIES.digSite;
  const total = A.cols * A.rows;
  const [dug, setDug] = useState<number[]>([]);
  const [stage, setStage] = useState<Stage>("dig");
  const [sol, setSol] = useState(0);
  const [ziggy, setZiggy] = useState<string | null>("Dig, dig, dig! Click the soil squares.");
  const iceFound = A.iceCells.filter((c) => dug.includes(c)).length;

  const dig = (i: number) => {
    if (stage !== "dig" || dug.includes(i)) return;
    sfx.dig();
    const next = [...dug, i];
    setDug(next);
    const ice = A.iceCells.filter((c) => next.includes(c)).length;
    if (A.iceCells.includes(i)) {
      sfx.correct();
      setZiggy(ice >= 2 ? A.foundText : "Ooh, something white and shiny!");
    }
    if (ice >= 2 && next.length >= A.minDug) {
      setStage("found");
      setZiggy(A.foundText);
    }
  };

  const wait = () => {
    setStage("waiting");
    setZiggy(A.waitAction);
    let d = 0;
    const iv = setInterval(() => {
      d += 1;
      setSol(d);
      sfx.blip();
      if (d >= 4) {
        clearInterval(iv);
        setStage("revealed");
        setZiggy(A.revealText);
        sfx.correct();
      }
    }, 900);
  };

  // ice fades away during the 4 sols
  const iceOpacity = stage === "waiting" ? Math.max(0, 1 - sol / 4) : stage === "revealed" ? 0 : 1;

  return (
    <ActivityShell title={A.title} intro={A.intro} ziggySays={ziggy}>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative rounded-2xl p-3 bg-[#4a2414] border-4 border-[#2c140a]">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${A.cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: total }).map((_, i) => {
              const isDug = dug.includes(i);
              const isIce = A.iceCells.includes(i);
              return (
                <motion.button
                  key={i}
                  onClick={() => dig(i)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-lg relative overflow-hidden cursor-pointer ${isDug ? "bg-[#6b3519]" : "bg-[#c1440e] hover:bg-[#d8581f]"}`}
                  aria-label={isDug ? "dug" : "soil"}
                >
                  {!isDug && <span className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 30% 30%, #e8a86b 2px, transparent 3px), radial-gradient(circle at 70% 60%, #8a2f0a 2px, transparent 3px)" }} />}
                  {isDug && isIce && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, opacity: iceOpacity }}
                      transition={{ opacity: { duration: 0.8 } }}
                      className="absolute inset-1.5 rounded-md bg-white shadow-[0_0_12px_#b8e6ff]"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="font-display text-lg">🦾 Trench progress</p>
            <p className="text-white/80 text-sm">
              Squares dug: {dug.length} · White patches: {iceFound}
            </p>
            {(stage === "waiting" || stage === "revealed") && (
              <div className="mt-3">
                <p className="font-display">📅 Day {sol} / 4</p>
                <div className="h-3 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <motion.div className="h-full bg-glow" animate={{ width: `${(sol / 4) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
          {stage === "found" && (
            <Button variant="glow" onClick={wait} autoFocus>
              ⏳ {A.waitButton}
            </Button>
          )}
          {stage === "revealed" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="bg-glow/15 border-2 border-glow rounded-2xl p-3 text-[16px]">
              🧊 → 💨 Salt would have stayed. The white chunks <b>turned straight into vapor</b>. Phoenix found <b>water ice</b>!
              </p>
              <Button variant="glow" onClick={onSuccess} autoFocus>
                Collect the Evidence ✨
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </ActivityShell>
  );
}
