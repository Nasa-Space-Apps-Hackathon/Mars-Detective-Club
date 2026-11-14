"use client";

import { create } from "zustand";
import { canMove, useGame } from "@/store/useGame";
import { playerState } from "@/world/playerState";
import { SALVAGE, SALVAGE_RADIUS } from "@/world/salvageData";
import { SCAN_RADIUS, ZONES } from "@/world/zones";
import { SHIP_TERMINAL } from "@/world/landingPod";
import { interactNearby } from "./supplies";

export const HOLD_SECONDS = 1.05;
type InputSource = "keyboard" | "pointer" | "button";
export const useInteraction = create<{ target: string | null; progress: number; holding: boolean }>(() => ({ target: null, progress: 0, holding: false }));
const sources = new Set<InputSource>();
let elapsed = 0;
let latched = false;

/** Same priority as the world prompt; a hold may never migrate to another object. */
export function nearbyInteraction() {
  const s = useGame.getState();
  if (s.nearArtifact) {
    const [x, z] = ZONES[s.nearArtifact];
    return { key: `artifact:${s.nearArtifact}`, x, z, radius: SCAN_RADIUS };
  }
  if (s.nearShip) return { key: "ship", ...SHIP_TERMINAL };
  const piece = SALVAGE.find((item) => item.id === s.nearSalvage && !s.collectedSalvage.includes(item.id));
  return piece ? { key: `salvage:${piece.id}`, x: piece.x, z: piece.z, radius: SALVAGE_RADIUS } : null;
}

export function beginInteraction(source: InputSource) {
  if (sources.has(source)) return;
  sources.add(source);
  const target = nearbyInteraction();
  if (latched || !canMove() || !playerState.grounded || !target) return;
  if (Math.hypot(target.x - playerState.x, target.z - playerState.z) >= target.radius) return;
  elapsed = 0;
  useInteraction.setState({ target: target.key, progress: 0, holding: true });
}

export function endInteraction(source: InputSource) {
  sources.delete(source);
  if (sources.size === 0) {
    latched = false;
    cancelInteraction();
  }
}

/** Cancellation consumes the current press; a fresh press is needed to try again. */
export function cancelInteraction(clearInputs = false) {
  if (clearInputs) { sources.clear(); latched = false; }
  else if (sources.size) latched = true;
  elapsed = 0;
  const s = useInteraction.getState();
  if (s.holding || s.progress || s.target) useInteraction.setState({ target: null, progress: 0, holding: false });
}

/** Physics time drives both keyboard and pointer holds, including low frame rates. */
export function advanceInteraction(dt: number) {
  const hold = useInteraction.getState();
  if (!hold.holding) return;
  const target = nearbyInteraction();
  if (!canMove() || !playerState.grounded || !sources.size || !target || target.key !== hold.target || Math.hypot(target.x - playerState.x, target.z - playerState.z) >= target.radius) {
    cancelInteraction();
    return;
  }
  elapsed += dt;
  const progress = Math.min(1, elapsed / HOLD_SECONDS);
  if (progress < 1) {
    useInteraction.setState({ progress });
    return;
  }
  // Latch before the store mutates: repairs must not immediately scan on the same hold.
  latched = true;
  useInteraction.setState({ progress: 1, holding: false });
  useGame.getState().setPlayer([playerState.x, playerState.z], useGame.getState().playerYaw);
  interactNearby();
}

// Any modal/phase transition cancels the current gesture immediately.
useGame.subscribe(() => { if (!canMove()) cancelInteraction(); });
