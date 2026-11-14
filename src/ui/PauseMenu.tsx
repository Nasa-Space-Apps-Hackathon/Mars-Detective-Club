"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useGame } from "@/store/useGame";
import { sfx } from "@/lib/sfx";
import styles from "./PauseMenu.module.css";

function MenuIcon({ kind }: { kind: "play" | "controls" | "quit" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.icon}>
      {kind === "play" ? <path d="m8 4 12 8-12 8Z" fill="currentColor" /> : kind === "controls" ? (
        <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10c2 0 3 2 3.5 4l1 6c.3 2-1.8 3-3 1.5L16 16H8l-2.5 2.5C4 20 2 19 2.5 17l1-6C4 9 5 7 7 7Z" />
          <path d="M7 10v5m-2.5-2.5h5" /><circle cx="16" cy="11" r=".5" /><circle cx="18" cy="14" r=".5" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 5V3h10v18H10v-2M14 12H3m4-4-4 4 4 4" />
        </g>
      )}
    </svg>
  );
}

export default function PauseMenu() {
  const togglePause = useGame((s) => s.togglePause);
  const reset = useGame((s) => s.reset);
  const evidence = useGame((s) => s.evidence);
  const reducedMotion = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = panel.current;
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return;
      const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      const game = useGame.getState();
      if (previousFocus?.isConnected && game.phase === "explore" && !game.showControls && !game.journalOpen) previousFocus.focus();
    };
  }, []);

  const act = (action: () => void) => {
    sfx.click();
    action();
  };

  return (
    <motion.div
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: reducedMotion ? 1 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.16 }}
      className={styles.backdrop}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        aria-describedby="pause-evidence"
        initial={reducedMotion ? false : { y: 12, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={styles.panel}
      >
        <h2 id="pause-title" className={styles.title}>Paused</h2>
        <p id="pause-evidence" className={styles.evidence}>Evidence collected: {evidence.length}/3</p>
        <button className={`${styles.button} ${styles.resume}`} onClick={() => act(() => togglePause(false))}>
          <MenuIcon kind="play" /><span>Resume</span>
        </button>
        <button className={`${styles.button} ${styles.controls}`} onClick={() => act(() => {
          togglePause(false);
          useGame.setState({ showControls: true });
        })}>
          <MenuIcon kind="controls" /><span>Controls</span>
        </button>
        <button className={`${styles.button} ${styles.quit}`} onClick={() => act(reset)}>
          <MenuIcon kind="quit" /><span>Quit to menu</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
