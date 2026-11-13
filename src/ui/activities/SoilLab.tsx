"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ACTIVITIES } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { Button } from "../primitives";
import { ActivityShell, type ActivityProps } from "./ActivityHost";

export default function SoilLab({ onSuccess }: ActivityProps) {
  const A = ACTIVITIES.soilLab;
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [ziggy, setZiggy] = useState<string | null>("Pick an experiment. Viking can only run one at a time!");
  const allDone = done.length === A.experiments.length;
  const correct = A.options.find((o) => o.id === answer)?.correct;

  const run = (id: string) => {
    if (running || done.includes(id)) return;
    const exp = A.experiments.find((e) => e.id === id)!;
    setRunning(id);
    setZiggy(exp.action);
    sfx.scan();
    setTimeout(() => {
      setRunning(null);
      setDone((d) => [...d, id]);
      setZiggy(exp.result);
      sfx.correct();
    }, 1400);
  };

  const choose = (id: string) => {
    if (correct) return;
    const o = A.options.find((x) => x.id === id)!;
    setAnswer(id);
    setZiggy(o.feedback);
    if (o.correct) {
      sfx.correct();
    } else {
      sfx.wrong();
    }
  };

  return (
    <ActivityShell title={A.title} intro={A.intro} ziggySays={ziggy}>
      <div className="grid md:grid-cols-3 gap-4">
        {A.experiments.map((e) => {
          const isDone = done.includes(e.id);
          const isRunning = running === e.id;
          return (
            <motion.button
              key={e.id}
              whileHover={!isDone && !running ? { y: -4 } : undefined}
              onClick={() => run(e.id)}
              disabled={!!running && !isRunning}
              className={`relative overflow-hidden rounded-2xl p-4 text-left border-4 cursor-pointer disabled:opacity-50 ${
                isDone ? "border-glow bg-glow/10" : "border-white/15 bg-white/5 hover:border-glow/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <motion.span className="text-4xl" animate={isRunning ? { rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 0.6 }}>
                  {e.icon}
                </motion.span>
                <span className="font-display font-bold text-lg leading-tight">{e.label}</span>
              </div>
              {/* test tube */}
              <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full bg-glow" initial={{ width: 0 }} animate={{ width: isDone ? "100%" : isRunning ? "100%" : 0 }} transition={{ duration: isRunning ? 1.4 : 0.2 }} />
              </div>
              {isDone && <p className="text-sm mt-2 text-white/85">{e.result}</p>}
            </motion.button>
          );
        })}
      </div>

      {allDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-4">
          <p className="font-display text-xl font-bold mb-3">🕵️ {A.question}</p>
          <div className="grid gap-2">
            {A.options.map((o) => (
              <button
                key={o.id}
                onClick={() => choose(o.id)}
                className={`text-left rounded-xl px-4 py-3 border-2 transition cursor-pointer ${
                  answer === o.id ? (o.correct ? "border-leaf bg-leaf/20" : "border-rust bg-rust/20") : "border-white/15 hover:border-glow bg-white/5"
                }`}
              >
                {answer === o.id ? (o.correct ? "✅ " : "❌ ") : "◻️ "}
                {o.text}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {correct && (
        <div className="flex justify-end">
          <Button variant="glow" onClick={onSuccess} autoFocus>
            Collect the Evidence ✨
          </Button>
        </div>
      )}
    </ActivityShell>
  );
}
