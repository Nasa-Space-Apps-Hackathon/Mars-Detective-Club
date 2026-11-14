"use client";

import { create } from "zustand";
import styles from "./ExplorationHUD.module.css";

interface WorldStatusState {
  wind: number;
  grounded: boolean;
  altitude: number;
  steadyCamera: boolean;
  toggleSteadyCamera: () => void;
}

export const useWorldStatus = create<WorldStatusState>((set) => ({
  wind: 0, grounded: true, altitude: 0, steadyCamera: false,
  toggleSteadyCamera: () => set((s) => ({ steadyCamera: !s.steadyCamera })),
}));

/** Called at 10 Hz by CameraRig; physics stays outside the React render cycle. */
export function publishWorldStatus(wind: number, grounded: boolean, altitude: number) {
  const state = useWorldStatus.getState();
  const roundedWind = Math.round(wind * 20) / 20;
  const roundedAltitude = Math.round(Math.max(0, altitude) * 2) / 2;
  if (state.wind !== roundedWind || state.grounded !== grounded || state.altitude !== roundedAltitude) {
    useWorldStatus.setState({ wind: roundedWind, grounded, altitude: roundedAltitude });
  }
}

export default function WorldStatus() {
  const wind = useWorldStatus((s) => s.wind);
  const grounded = useWorldStatus((s) => s.grounded);
  const altitude = useWorldStatus((s) => s.altitude);
  if (wind < 0.15) return null;
  const lifted = !grounded && altitude > 1.5;
  return (
    <div className={styles.weather} role="status" aria-live="polite">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h12c4 0 4-5 1-5M2 12h15c5 0 5 6 1 6M5 17h5c4 0 4 5 1 5" /></svg>
      <div><strong>{lifted ? "Riding the updraft" : "Dust devil nearby"}</strong><span>{lifted ? "Keep steering. Pebble will brace for landing." : "Keep moving to steer out of the wind."}</span></div>
      <div className={styles.windMeter} aria-label={`Wind intensity ${Math.round(wind * 100)} percent`}><i style={{ transform: `scaleY(${Math.max(0.12, wind)})` }} /></div>
    </div>
  );
}
