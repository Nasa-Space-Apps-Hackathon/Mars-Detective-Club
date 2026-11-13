"use client";

import { motion } from "motion/react";
import { useGame } from "@/store/useGame";
import { Button, Overlay, popIn } from "./primitives";

export default function PauseMenu() {
  const togglePause = useGame((s) => s.togglePause);
  const reset = useGame((s) => s.reset);
  const evidence = useGame((s) => s.evidence);

  return (
    <Overlay>
      <motion.div {...popIn} className="glass rounded-3xl p-8 w-full max-w-sm text-center space-y-4">
        <h2 className="font-display text-4xl font-bold">Paused ⏸</h2>
        <p className="text-white/80">Evidence collected: {evidence.length}/3</p>
        <div className="flex flex-col gap-3">
          <Button variant="glow" onClick={() => togglePause(false)} autoFocus>
            Resume
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              togglePause(false);
              useGame.setState({ showControls: true });
            }}
          >
            Controls
          </Button>
          <Button variant="ghost" onClick={reset}>
            Quit to menu
          </Button>
        </div>
      </motion.div>
    </Overlay>
  );
}
