"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/store/useGame";
import styles from "./ExplorationHUD.module.css";

/** One short reminder after the introductory controls, without a permanent HUD bar. */
export default function ControlsHint({ interactive, hasPrompt }: { interactive: boolean; hasPrompt: boolean }) {
  const showControls = useGame((s) => s.showControls);
  const previous = useRef(showControls);
  const shown = useRef(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (previous.current && !showControls && !shown.current) {
      shown.current = true;
      setVisible(true);
    }
    previous.current = showControls;
  }, [showControls]);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 7000);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible || !interactive || hasPrompt) return null;
  return <div className={styles.guide} role="status">
    <span>Controls are in the pause menu.</span>
    <button onClick={() => { setVisible(false); useGame.setState({ showControls: true }); }}>View controls</button>
    <button onClick={() => setVisible(false)} aria-label="Dismiss controls hint">×</button>
  </div>;
}
