"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/store/useGame";
import { getDialogue } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { Portrait, SPEAKER_NAME } from "./primitives";

const CHARS_PER_SEC = 38;

export default function DialogueBox() {
  const key = useGame((s) => s.dialogueKey);
  const index = useGame((s) => s.dialogueIndex);
  const nextLine = useGame((s) => s.nextLine);
  const lines = getDialogue(key);
  const line = lines[index];
  const [shown, setShown] = useState(0);
  const timer = useRef<number | null>(null);

  const full = line?.text ?? "";
  const done = shown >= full.length;

  // typewriter
  useEffect(() => {
    setShown(0);
    if (!full) return;
    const start = performance.now();
    const tick = () => {
      const n = Math.min(full.length, Math.floor(((performance.now() - start) / 1000) * CHARS_PER_SEC));
      setShown((prev) => {
        if (n > prev && n % 3 === 0 && line?.speaker === "ziggy") sfx.blip();
        return n;
      });
      if (n < full.length) timer.current = requestAnimationFrame(tick);
    };
    timer.current = requestAnimationFrame(tick);
    return () => {
      if (timer.current) cancelAnimationFrame(timer.current);
    };
  }, [full, line?.speaker]);

  const advance = useCallback(() => {
    if (!done) {
      if (timer.current) cancelAnimationFrame(timer.current);
      setShown(full.length);
      return;
    }
    sfx.click();
    nextLine(lines.length);
  }, [done, full.length, lines.length, nextLine]);

  const skipAll = () => {
    sfx.click();
    useGame.setState({ dialogueIndex: Math.max(0, lines.length - 1) });
    nextLine(lines.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Space", "Enter", "NumpadEnter"].includes(e.code)) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  // safety: empty dialogue key → just continue
  useEffect(() => {
    if (!line) nextLine(0);
  }, [line, nextLine]);
  if (!line) return null;

  const isRight = line.speaker === "pebble";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="absolute inset-x-0 bottom-0 p-4 md:p-8 pointer-events-auto"
      onClick={advance}
      role="dialog"
      aria-live="polite"
    >
      <div className={`mx-auto max-w-4xl flex items-end gap-4 ${isRight ? "flex-row-reverse" : ""}`}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={line.speaker}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="shrink-0 rounded-full bg-night-2 border-4 border-glow/60 p-2 shadow-xl hidden sm:block"
          >
            <Portrait speaker={line.speaker} talking={!done} size={110} />
          </motion.div>
        </AnimatePresence>

        <div className="glass rounded-3xl flex-1 p-5 md:p-6 cursor-pointer relative min-h-[150px]">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`font-display font-bold text-lg px-3 py-0.5 rounded-full ${
                line.speaker === "ziggy" ? "bg-glow text-night" : line.speaker === "pebble" ? "bg-[#ff8a3d] text-night" : "bg-rust text-white"
              }`}
            >
              {SPEAKER_NAME[line.speaker]}
            </span>
            <span className="text-sm text-white/60">
              {index + 1}/{lines.length}
            </span>
          </div>
          <p className="text-xl md:text-2xl leading-snug">
            {full.slice(0, shown)}
            <span className="opacity-0">{full.slice(shown)}</span>
          </p>
          <div className="flex items-center justify-between mt-3 text-sm text-white/70">
            <button
              className="underline-offset-2 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                skipAll();
              }}
            >
              Skip ⏭
            </button>
            <span className={done ? "animate-pulse" : "opacity-0"}>
              Click or <kbd>Space</kbd> ▶
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
