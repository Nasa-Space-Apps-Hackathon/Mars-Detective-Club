"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ACTIVITIES, type RockData } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { Button } from "../primitives";
import { ActivityShell, type ActivityProps } from "./ActivityHost";

function RockArt({ rock }: { rock: RockData }) {
  return (
    <svg viewBox="0 0 100 80" className="w-full h-24">
      <path d="M10 65 L18 30 L40 14 L70 18 L90 40 L86 66 Z" fill={rock.color} stroke="#00000040" strokeWidth="2" />
      {rock.id === "blueberries" &&
        [
          [30, 40],
          [45, 50],
          [60, 35],
          [70, 55],
          [38, 58],
          [55, 25],
          [78, 45],
        ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#3c4660" />)}
      {rock.id === "layers" && [28, 36, 44, 52, 60].map((y) => <path key={y} d={`M16 ${y} Q50 ${y - 4} 88 ${y}`} stroke="#8b5530" strokeWidth="2.5" fill="none" />)}
      {rock.id === "basalt" &&
        [
          [35, 35],
          [55, 45],
          [70, 30],
          [45, 58],
          [72, 56],
        ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#2a2629" />)}
      {rock.id === "dust" && <path d="M18 30 L40 14 L70 18 L90 40 L80 34 L60 26 L35 24 Z" fill="#e0855a" opacity="0.8" />}
    </svg>
  );
}

type RockState = "idle" | "scanning" | "scanned";

export default function RockScanner({ onSuccess }: ActivityProps) {
  const A = ACTIVITIES.rockScanner;
  const [state, setState] = useState<Record<string, RockState>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [ziggy, setZiggy] = useState<string | null>("Click a rock to scan it with Opportunity's microscope!");
  const found = picked.filter((id) => A.rocks.find((r) => r.id === id)?.water).length;
  const solved = found >= A.required;

  const scan = (rock: RockData) => {
    if (state[rock.id] || solved) return;
    sfx.scan();
    setState((s) => ({ ...s, [rock.id]: "scanning" }));
    setTimeout(() => {
      setState((s) => ({ ...s, [rock.id]: "scanned" }));
      setPicked((p) => [...p, rock.id]);
      if (rock.water) {
        sfx.correct();
        const newFound = found + 1;
        setZiggy(newFound >= A.required ? A.success : `Water clue! ${newFound}/${A.required} found. Keep scanning!`);
      } else {
        sfx.wrong();
        setZiggy(A.wrongHint.replace(/^Ziggy:\s*/, ""));
      }
    }, 1100);
  };

  return (
    <ActivityShell title={A.title} intro={A.intro} ziggySays={ziggy}>
      <div className="flex items-center gap-2 text-sm font-display">
        Water clues found:
        {Array.from({ length: A.required }).map((_, i) => (
          <span key={i} className={`w-6 h-6 rounded-full grid place-items-center border-2 ${i < found ? "bg-glow border-glow text-night" : "border-white/40"}`}>
            {i < found ? i + 1 : ""}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {A.rocks.map((rock) => {
          const st = state[rock.id] ?? "idle";
          const good = st === "scanned" && rock.water;
          const bad = st === "scanned" && !rock.water;
          return (
            <motion.button
              key={rock.id}
              whileHover={st === "idle" && !solved ? { y: -4 } : undefined}
              onClick={() => scan(rock)}
              className={`relative overflow-hidden rounded-2xl p-3 text-left border-4 transition cursor-pointer ${
                good ? "border-glow bg-glow/15" : bad ? "border-white/20 bg-white/5 opacity-75" : "border-white/15 bg-white/5 hover:border-glow/60"
              }`}
            >
              <RockArt rock={rock} />
              <p className="font-display font-bold text-lg">{rock.name}</p>
              <p className="text-sm text-white/75">{rock.look}</p>
              <AnimatePresence>
                {st === "scanning" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-night/40">
                    <div className="scanline w-full" />
                    <p className="absolute bottom-2 inset-x-0 text-center font-display text-glow text-sm">Scanning…</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {st === "scanned" && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`mt-2 text-sm rounded-xl p-2 ${good ? "bg-glow text-night" : "bg-white/10"}`}>
                  <b>{good ? "Water clue: " : "No water clue: "}</b>
                  {rock.scan}
                </motion.p>
              )}
            </motion.button>
          );
        })}
      </div>

      {solved && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="glow" onClick={onSuccess} autoFocus>
            Collect the Evidence
          </Button>
        </motion.div>
      )}
    </ActivityShell>
  );
}
