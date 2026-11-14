"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LoadingScreen.module.css";

// Keep the dynamic-import fallback and the mounted game's loader moving forward.
let bootProgress = 0;

interface LoadingScreenProps {
  progress?: number;
  ready?: boolean;
  message?: string;
  error?: boolean;
  onComplete?: () => void;
}

/** The supplied illustration stays intact; this opaque panel hides its painted UI. */
export default function LoadingScreen({ progress = 0, ready = false, message = "Preparing your mission", error = false, onComplete }: LoadingScreenProps) {
  const [displayed, setDisplayed] = useState(() => Math.min(bootProgress, 94));
  const current = useRef(displayed);
  const latest = useRef({ progress, ready, error, onComplete });
  useEffect(() => { latest.current = { progress, ready, error, onComplete }; }, [progress, ready, error, onComplete]);

  useEffect(() => {
    const started = performance.now();
    let previous = started;
    let completedAt = 0;
    let frame = 0;
    const tick = (time: number) => {
      const state = latest.current;
      const dt = Math.min(time - previous, 64);
      previous = time;
      // A small buffer covers JavaScript/WASM setup, which has no byte progress.
      const buffer = Math.min(28, 4 + (time - started) / 180);
      const target = state.ready && !state.error ? 100 : Math.min(94, Math.max(buffer, state.progress));
      if (!state.error) {
        current.current = Math.max(current.current, Math.min(target, current.current + Math.max(0.015, (target - current.current) * 0.006) * dt));
        if (state.ready && current.current > 99.5) current.current = 100;
      }
      bootProgress = current.current;
      const rounded = Math.floor(current.current);
      setDisplayed((value) => value === rounded ? value : rounded);
      if (rounded === 100) {
        if (!completedAt) completedAt = time;
        if (time - completedAt >= 240) {
          latest.current.onComplete?.();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.screen} data-loading-screen="true" aria-busy={displayed < 100}>
      <div className={styles.composition}>
        <div className={styles.artwork}>
          {/* Static artwork has its own painted progress covered by the panel below. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.image} src="/references/Mars_Mission_Loading_Screen.png" alt="Captain Pebble and the Mars Detective Club arriving above a colorful Martian landscape" fetchPriority="high" />
          <div className={styles.paintedCover} aria-hidden="true" />
        </div>
        <section className={styles.panel} aria-labelledby="loading-title">
          <h1 id="loading-title" className={styles.title}>{error ? "Landing delayed" : "Loading…"}</h1>
          <div className={styles.caption}>
            <p role="status" aria-live="polite">{error ? "An asset could not load. Please retry." : displayed === 100 ? "Ready to explore Mars" : message}</p>
            <span className={styles.percentage} aria-hidden="true">{displayed}%</span>
          </div>
          <div className={styles.track} role="progressbar" aria-label="Preparing Mars" aria-valuemin={0} aria-valuemax={100} aria-valuenow={displayed}>
            <div className={styles.fill} style={{ transform: `scaleX(${displayed / 100})` }} />
          </div>
          {error && <button className={styles.retry} onClick={() => window.location.reload()}>Retry landing</button>}
        </section>
      </div>
    </div>
  );
}
