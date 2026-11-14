"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useGame } from "@/store/useGame";
import { Button, Overlay } from "./primitives";
import styles from "./ExplorationHUD.module.css";
import { useDialogFocus } from "./useDialogFocus";

const ROWS: [React.ReactNode, string][] = [
  [<><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows</>, "Move in the camera direction"],
  [<kbd key="shift">Shift</kbd>, "Hold to sprint"],
  [<kbd key="space">Space</kbd>, "Jump in low gravity"],
  ["Drag mouse / scroll", "Look around / zoom"],
  [<kbd key="r">R</kbd>, "Bring the camera behind Pebble"],
  [<>Hold <kbd key="e">E</kbd></>, "Scan, collect scrap, trade or repair"],
  [<><kbd>J</kbd> / <kbd>Esc</kbd></>, "Journal / pause"],
];

export default function ControlsTutorial() {
  const dismiss = useGame((s) => s.dismissControls);
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(dialog);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.code === "Enter" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <Overlay>
      <motion.div ref={dialog} className={styles.tutorial} initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} role="dialog" aria-modal="true" aria-labelledby="controls-heading">
        <h2 id="controls-heading">Controls</h2>
        <p>Open the pause menu to find these controls again.</p>
        <ul>{ROWS.map(([key, label], i) => <li key={i}><span>{key}</span><span>{label}</span></li>)}</ul>
        <div className={styles.weatherNote}><strong>Dust devils can lift Pebble</strong><p>Steer to escape. Enable Steady camera in camera settings to reduce shake.</p></div>
        <div className={styles.tutorialFooter}><Button variant="glow" onClick={dismiss} autoFocus>Let&apos;s explore</Button></div>
      </motion.div>
    </Overlay>
  );
}
