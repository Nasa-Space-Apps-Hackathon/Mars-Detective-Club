"use client";

import type { ReactNode } from "react";
import { beginInteraction, endInteraction, useInteraction } from "@/lib/interaction";
import styles from "./HoldInteractionButton.module.css";

export default function HoldInteractionButton({ disabled, children, className }: { disabled: boolean; children: ReactNode; className?: string }) {
  const progress = useInteraction((s) => s.progress);
  const holding = useInteraction((s) => s.holding);
  return <button
    type="button" disabled={disabled} className={`${className ?? ""} ${styles.button}`}
    aria-label="Hold E or hold this button to interact" aria-describedby="interaction-hold-help"
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      beginInteraction("pointer");
    }}
    onPointerUp={() => endInteraction("pointer")} onPointerCancel={() => endInteraction("pointer")}
    onLostPointerCapture={() => endInteraction("pointer")}
    onKeyDown={(event) => {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      if (!event.repeat) beginInteraction("button");
    }}
    onKeyUp={(event) => { if (["Space", "Enter"].includes(event.code)) { event.preventDefault(); endInteraction("button"); } }}
    onBlur={() => { endInteraction("pointer"); endInteraction("button"); }}
    onClick={(event) => event.preventDefault()}
    data-holding={holding}
  >
    {children}
    <span className={styles.track} role="progressbar" aria-label="Interaction progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
      <span style={{ transform: `scaleX(${progress})` }} />
    </span>
    <span id="interaction-hold-help" className={styles.hint}>{holding ? "Keep holding…" : "Hold E or hold this button"}</span>
  </button>;
}
