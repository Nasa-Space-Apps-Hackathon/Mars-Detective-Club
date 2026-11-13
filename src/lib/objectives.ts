import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import type { GameState } from "@/store/useGame";
import { getArtifact } from "./content";

/** The next machine the compass should point to (first one without evidence). */
export const nextTarget = (evidence: ArtifactId[]): ArtifactId | null =>
  ARTIFACT_ORDER.find((id) => !evidence.includes(id)) ?? null;

export function getObjective(s: Pick<GameState, "phase" | "evidence">): string {
  if (s.phase === "ending") return "Solve Case #001 on the case board";
  const target = nextTarget(s.evidence);
  if (!target) return "All clues found! Open the case board";
  const a = getArtifact(target);
  const n = s.evidence.length + 1;
  return `Clue ${n}/3 · Find the ${a.name}`;
}
