"use client";

import { create } from "zustand";
import { ARTIFACT_ORDER, type ArtifactId, type Phase, type Vec2 } from "./types";
import { SALVAGE, SALVAGE_RADIUS, TOOLBOX_COST } from "@/world/salvageData";
import { SHIP_TERMINAL } from "@/world/landingPod";

/**
 * The ONE shared game store.
 *
 * Who calls what:
 *  - Person 1 (world):     reads `canMove()`; writes `setPlayer()`
 *  - Person 2 (artifacts): writes `setNearArtifact()`; calls `startScan(id)`
 *  - Person 4 (UI):        everything else (dialogue, memory, activity, evidence, ending)
 */
export interface GameState {
  phase: Phase;
  paused: boolean;
  journalOpen: boolean;
  showControls: boolean;
  muted: boolean;

  // progression
  activeArtifact: ArtifactId | null;
  nearArtifact: ArtifactId | null;
  scanned: ArtifactId[];
  evidence: ArtifactId[];
  revisit: boolean; // true when re-opening a solved machine (memory only)
  collectedSalvage: string[];
  salvage: number;
  toolbox: boolean;
  repaired: ArtifactId[];
  repairMission: boolean;
  nearSalvage: string | null;
  nearShip: boolean;
  fieldMessage: string;

  // dialogue
  dialogueKey: string;
  dialogueIndex: number;
  afterDialogue: Phase;

  // world info for HUD compass (Person 1 writes these)
  playerPos: Vec2;
  playerYaw: number; // radians, camera/player heading

  // ── actions ──
  startGame: () => void;
  startDialogue: (key: string, then: Phase) => void;
  nextLine: (totalLines: number) => void;
  startScan: (id: ArtifactId) => void;
  openActivity: () => void;
  completeActivity: (id: ArtifactId) => void;
  closeEvidence: () => void;
  closeMemory: () => void;
  goTo: (phase: Phase) => void;
  setNearArtifact: (id: ArtifactId | null) => void;
  setPlayer: (pos: Vec2, yaw: number) => void;
  togglePause: (v?: boolean) => void;
  toggleJournal: (v?: boolean) => void;
  dismissControls: () => void;
  toggleMute: () => void;
  devUnlock: (id: ArtifactId) => void;
  reset: () => void;
  setNearSupplies: (salvage: string | null, ship: boolean) => void;
  collectSalvage: (id: string) => void;
  openShop: () => void;
  buyToolbox: () => void;
  closeShop: () => void;
}

const initial = {
  phase: "menu" as Phase,
  paused: false,
  journalOpen: false,
  showControls: false,
  activeArtifact: null,
  nearArtifact: null,
  scanned: [] as ArtifactId[],
  evidence: [] as ArtifactId[],
  revisit: false,
  collectedSalvage: [] as string[],
  salvage: 0,
  toolbox: false,
  repaired: ["viking1"] as ArtifactId[],
  repairMission: false,
  nearSalvage: null,
  nearShip: false,
  fieldMessage: "",
  dialogueKey: "intro",
  dialogueIndex: 0,
  afterDialogue: "explore" as Phase,
  playerPos: [0, 0] as Vec2,
  playerYaw: 0,
};

export const useGame = create<GameState>((set, get) => ({
  ...initial,
  muted: false,

  startGame: () =>
    set({ ...initial, phase: "intro", dialogueKey: "intro", dialogueIndex: 0, afterDialogue: "explore" }),

  startDialogue: (key, then) =>
    set({ dialogueKey: key, dialogueIndex: 0, afterDialogue: then, phase: get().phase === "intro" ? "intro" : "dialogue" }),

  nextLine: (totalLines) => {
    const { dialogueIndex, afterDialogue, phase } = get();
    if (dialogueIndex + 1 < totalLines) {
      set({ dialogueIndex: dialogueIndex + 1 });
      return;
    }
    // dialogue finished
    if (phase === "intro") {
      set({ phase: "explore", showControls: true });
      return;
    }
    set({ phase: afterDialogue, dialogueIndex: 0 });
  },

  startScan: (id) => {
    const s = get();
    if (s.phase !== "explore" || s.paused || s.journalOpen || s.showControls) return;
    if (!s.repaired.includes(id)) {
      if (!s.toolbox) {
        set({ repairMission: true, fieldMessage: `This simulation station needs a toolbox. Collect ${TOOLBOX_COST} glowing scrap pieces, then trade at your ship.` });
      } else {
        set({ repaired: [...s.repaired, id], fieldMessage: "Station repaired. Press E again to scan. Your toolbox is reusable." });
      }
      return;
    }
    const scanned = s.scanned.includes(id) ? s.scanned : [...s.scanned, id];
    if (s.evidence.includes(id)) {
      // already solved → just reopen the fact file
      set({ activeArtifact: id, scanned, revisit: true, phase: "memory" });
      return;
    }
    set({
      activeArtifact: id,
      scanned,
      revisit: false,
      dialogueKey: `${id}_intro`,
      dialogueIndex: 0,
      afterDialogue: "memory",
      phase: "dialogue",
      journalOpen: false,
    });
  },

  openActivity: () => set({ phase: "activity" }),

  completeActivity: (id) => {
    const ev = get().evidence;
    set({ evidence: ev.includes(id) ? ev : [...ev, id], phase: "evidence", repairMission: true, fieldMessage: "" });
  },

  closeEvidence: () => {
    const { evidence, activeArtifact } = get();
    if (evidence.length >= ARTIFACT_ORDER.length) {
      set({ dialogueKey: "case_ready", dialogueIndex: 0, afterDialogue: "ending", phase: "dialogue", activeArtifact: null });
      return;
    }
    set({
      dialogueKey: `${activeArtifact}_outro`,
      dialogueIndex: 0,
      afterDialogue: "explore",
      phase: "dialogue",
      activeArtifact: null,
    });
  },

  closeMemory: () => set({ phase: "explore", activeArtifact: null, revisit: false }),

  goTo: (phase) => set({ phase, paused: false, journalOpen: false }),

  setNearArtifact: (id) => {
    if (get().nearArtifact !== id) set({ nearArtifact: id });
  },

  setPlayer: (pos, yaw) => set({ playerPos: pos, playerYaw: yaw }),

  togglePause: (v) => set((s) => ({ paused: v ?? !s.paused })),
  toggleJournal: (v) => set((s) => ({ journalOpen: v ?? !s.journalOpen })),
  dismissControls: () => set({ showControls: false }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  devUnlock: (id) =>
    set((s) => ({
      evidence: s.evidence.includes(id) ? s.evidence : [...s.evidence, id],
      scanned: s.scanned.includes(id) ? s.scanned : [...s.scanned, id],
    })),

  reset: () => set({ ...initial }),

  setNearSupplies: (nearSalvage, nearShip) => {
    const s = get();
    if (s.nearSalvage !== nearSalvage || s.nearShip !== nearShip) set({ nearSalvage, nearShip });
  },
  collectSalvage: (id) => {
    const s = get();
    const piece = SALVAGE.find((item) => item.id === id);
    if (!canMove() || !piece || s.collectedSalvage.includes(id) || Math.hypot(piece.x - s.playerPos[0], piece.z - s.playerPos[1]) > SALVAGE_RADIUS + 0.5) return;
    set({ collectedSalvage: [...s.collectedSalvage, id], salvage: s.salvage + 1, nearSalvage: null,
      repairMission: s.repairMission || s.salvage + 1 >= TOOLBOX_COST,
      fieldMessage: s.salvage + 1 >= TOOLBOX_COST && !s.toolbox ? "Enough scrap. Follow the compass back to the ship for your toolbox." : "Scrap collected. Your ship can recycle it into supplies." });
  },
  openShop: () => {
    const s = get();
    if (!canMove() || Math.hypot(s.playerPos[0] - SHIP_TERMINAL.x, s.playerPos[1] - SHIP_TERMINAL.z) > SHIP_TERMINAL.radius + 0.5) return;
    set({ phase: "shop", repairMission: true, fieldMessage: "" });
  },
  buyToolbox: () => {
    const s = get();
    if (s.phase !== "shop" || s.toolbox || s.salvage < TOOLBOX_COST) return;
    set({ toolbox: true, salvage: s.salvage - TOOLBOX_COST, repairMission: true });
  },
  closeShop: () => set({ phase: "explore", fieldMessage: "" }),
}));

/** Person 1: only move the player when this is true. */
export const canMove = () => {
  const s = useGame.getState();
  return s.phase === "explore" && !s.paused && !s.journalOpen && !s.showControls;
};
