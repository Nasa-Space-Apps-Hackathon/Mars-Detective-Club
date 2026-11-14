// ─────────────────────────────────────────────────────────────
// SHARED CONTRACTS: agreed by the whole team. Change only after
// telling everyone (Person 1, 2, 3, 4, 5).
// ─────────────────────────────────────────────────────────────

export type ArtifactId = "viking1" | "opportunity" | "phoenix";

export const ARTIFACT_ORDER: ArtifactId[] = ["viking1", "opportunity", "phoenix"];

export type Phase =
  | "menu" // main menu
  | "intro" // Ziggy intro dialogue + controls tutorial
  | "explore" // player walks (the ONLY phase where movement is allowed)
  | "shop" // exterior landing ship supply terminal
  | "dialogue" // Ziggy talks about a machine
  | "memory" // NASA fact file of the machine
  | "activity" // mini science activity
  | "evidence" // Evidence Card unlock
  | "ending" // case board + verdict
  | "credits";

export type Speaker = "ziggy" | "pebble" | "narrator";

export interface DialogueLine {
  speaker: Speaker;
  text: string;
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface ArtifactContent {
  id: ArtifactId;
  name: string;
  shortName: string;
  missionTitle: string; // e.g. "The First Clue"
  mission: string;
  launched: string;
  landed: string;
  year: number;
  realLocation: string;
  purpose: string;
  howItWorked: string;
  discovery: string;
  whyStopped: string;
  funFact: string;
  image?: string; // /images/... (Person 3 adds NASA photos)
  imageCredit?: string;
  color: string; // accent color for UI
  sources: SourceLink[];
  evidenceCard: { title: string; clue: string };
}

/** World positions on the XZ plane. Person 1 owns the real values. */
export type Vec2 = [number, number];
