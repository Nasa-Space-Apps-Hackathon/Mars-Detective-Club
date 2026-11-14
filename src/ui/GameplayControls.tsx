"use client";

import { useRef, useSyncExternalStore } from "react";
import { create } from "zustand";
import { useGame } from "@/store/useGame";
import { getAudioLevels, setAudioLevels, sfx, subscribeAudioLevels } from "@/lib/sfx";
import { useWorldStatus } from "./WorldStatus";
import { useDialogFocus } from "./useDialogFocus";
import styles from "./GameplayControls.module.css";

type Panel = "sound" | "camera" | null;

export const useGameplayPanel = create<{ panel: Panel; setPanel: (panel: Panel) => void }>((set) => ({
  panel: null,
  setPanel: (panel) => set({ panel }),
}));

export function closeGameplayPanel() {
  useGameplayPanel.getState().setPanel(null);
  useGame.getState().togglePause(false);
}

/** Render a region of the supplied sheet without changing the original asset. */
export function FrameArt({ small = false }: { small?: boolean }) {
  return <svg className={styles.frameArt} viewBox={small ? "992 818 420 214" : "30 18 712 254"} preserveAspectRatio="none" aria-hidden="true"><image href="/references/Terracotta_Cartoon_Game_UI_Asset_Sheet.png" width="1448" height="1086" /></svg>;
}

export default function GameplayControls({ interactive }: { interactive: boolean }) {
  const evidence = useGame((s) => s.evidence);
  const muted = useGame((s) => s.muted);
  const openPanel = (panel: Panel) => {
    sfx.click();
    useGameplayPanel.getState().setPanel(panel);
    useGame.getState().togglePause(true);
  };
  return (
    <nav className={styles.toolbar} aria-label="Exploration menus">
      <button className={`${styles.artButton} ${styles.journal}`} disabled={!interactive} onClick={() => { sfx.click(); useGame.getState().toggleJournal(true); }} aria-label={`Open journal, ${evidence.length} of 3 evidence cards`} title="Journal (J)"><span className={styles.count}>{evidence.length}/3</span></button>
      <button className={`${styles.artButton} ${styles.sound}`} disabled={!interactive} onClick={() => openPanel("sound")} aria-label="Sound settings" title="Sound settings">{muted && <span className={styles.mutedSlash} aria-hidden="true" />}</button>
      <button className={`${styles.artButton} ${styles.camera}`} disabled={!interactive} onClick={() => openPanel("camera")} aria-label="Camera settings" title="Camera settings" />
      <button className={`${styles.artButton} ${styles.pause}`} disabled={!interactive} onClick={() => { sfx.click(); useGame.getState().togglePause(true); }} aria-label="Pause game" title="Pause (Esc)" />
    </nav>
  );
}

export function GameplaySettings() {
  const panel = useGameplayPanel((s) => s.panel);
  const muted = useGame((s) => s.muted);
  const steady = useWorldStatus((s) => s.steadyCamera);
  const levels = useSyncExternalStore(subscribeAudioLevels, getAudioLevels, getAudioLevels);
  const dialog = useRef<HTMLDivElement>(null);

  useDialogFocus(dialog, !!panel);

  if (!panel) return null;
  return (
    <div className={styles.backdrop}>
      <div ref={dialog} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className={styles.header}><h2 id="settings-title">{panel === "sound" ? "Sound settings" : "Camera settings"}</h2><button className={styles.close} onClick={closeGameplayPanel} aria-label="Close settings">×</button></div>
        {panel === "sound" ? <>
          <button className={styles.option} aria-pressed={!muted} onClick={() => useGame.getState().toggleMute()}><span>Game sound</span><strong>{muted ? "Muted" : "On"}</strong></button>
          {([ ["master", "Master volume"], ["music", "Music"], ["effects", "Effects & footsteps"], ["ambience", "Wind & Ziggy fan"] ] as const).map(([key, label]) => <label className={styles.slider} key={key}><span>{label}<output>{Math.round(levels[key] * 100)}%</output></span><input aria-label={label} type="range" min="0" max="100" value={Math.round(levels[key] * 100)} onChange={(event) => setAudioLevels({ [key]: Number(event.target.value) / 100 })} /></label>)}
        </> : <>
          <button className={styles.option} aria-pressed={steady} onClick={() => useWorldStatus.getState().toggleSteadyCamera()}><span>Steady camera<small>Reduce wind shake and sprint effects</small></span><strong>{steady ? "On" : "Off"}</strong></button>
          <button className={styles.option} onClick={() => { closeGameplayPanel(); requestAnimationFrame(() => { window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyR" })); window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyR" })); }); }}><span>Recenter behind Pebble</span><kbd>R</kbd></button>
          <div className={styles.hints}><p><strong>Drag</strong> to orbit around Pebble.</p><p><strong>Scroll</strong> to zoom in or out.</p></div>
        </>}
        <button className={styles.done} onClick={closeGameplayPanel}>Back to exploring <kbd>Esc</kbd></button>
      </div>
    </div>
  );
}
