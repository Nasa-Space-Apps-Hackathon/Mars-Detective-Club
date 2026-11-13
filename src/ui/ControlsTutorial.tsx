"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "@/store/useGame";
import { Button, Overlay, popIn } from "./primitives";

const ROWS: [React.ReactNode, string][] = [
  [
    <>
      <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrows
    </>,
    "Walk and turn",
  ],
  [<kbd key="s">Shift</kbd>, "Run faster"],
  [<kbd key="sp">Space</kbd>, "Jump (Mars gravity is only 38% of Earth's!)"],
  ["🖱️ Drag / scroll", "Look around / zoom the camera"],
  [<kbd key="e">E</kbd>, "Scan a NASA machine when you're close"],
  [<kbd key="j">J</kbd>, "Open your Detective Journal"],
  [<kbd key="esc">Esc</kbd>, "Pause"],
];

export default function ControlsTutorial() {
  const dismiss = useGame((s) => s.dismissControls);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <Overlay>
      <motion.div {...popIn} className="glass rounded-3xl p-8 max-w-lg w-full">
        <h2 className="font-display text-3xl font-bold mb-1">Detective controls 🎮</h2>
        <p className="text-white/80 mb-5">Follow the glowing beam and the arrow in the corner to find each machine.</p>
        <ul className="space-y-3">
          {ROWS.map(([k, label], i) => (
            <li key={i} className="flex items-center justify-between gap-4 bg-white/5 rounded-xl px-4 py-2">
              <span>{k}</span>
              <span className="text-white/85 text-right">{label}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end mt-6">
          <Button variant="glow" onClick={dismiss} autoFocus>
            Let&apos;s explore! 🚀
          </Button>
        </div>
      </motion.div>
    </Overlay>
  );
}
