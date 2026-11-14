import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import type { GameState } from "@/store/useGame";
import { getArtifact } from "./content";
import { SALVAGE, TOOLBOX_COST } from "@/world/salvageData";
import { SHIP_TERMINAL } from "@/world/landingPod";
import { ZONES } from "@/world/zones";

/** The next machine the compass should point to (first one without evidence). */
export const nextTarget = (evidence: ArtifactId[]): ArtifactId | null =>
  ARTIFACT_ORDER.find((id) => !evidence.includes(id)) ?? null;

export function getObjective(s: Pick<GameState, "phase" | "evidence"> & Partial<Pick<GameState, "repairMission" | "toolbox" | "salvage">>): string {
  if (s.phase === "ending") return "Solve Case #001 on the case board";
  if (s.repairMission && !s.toolbox) return (s.salvage ?? 0) >= TOOLBOX_COST ? "Return to your ship for a repair toolbox" : `Collect scrap for a toolbox (${s.salvage ?? 0}/${TOOLBOX_COST})`;
  const target = nextTarget(s.evidence);
  if (!target) return "All clues found! Open the case board";
  const a = getArtifact(target);
  const n = s.evidence.length + 1;
  return `Clue ${n}/3 · Find the ${a.name}`;
}

export function expeditionDestination(s: Pick<GameState, "evidence" | "repairMission" | "toolbox" | "salvage" | "collectedSalvage" | "playerPos">) {
  if (s.repairMission && !s.toolbox) {
    if (s.salvage >= TOOLBOX_COST) return { label: "Ship supply depot", x: SHIP_TERMINAL.x, z: SHIP_TERMINAL.z, hint: "to your toolbox" };
    const piece = SALVAGE.filter((item) => !s.collectedSalvage.includes(item.id)).sort((a, b) => Math.hypot(a.x - s.playerPos[0], a.z - s.playerPos[1]) - Math.hypot(b.x - s.playerPos[0], b.z - s.playerPos[1]))[0];
    if (piece) return { label: "Recyclable scrap", x: piece.x, z: piece.z, hint: "to field supplies" };
  }
  const id = nextTarget(s.evidence);
  return id ? { label: getArtifact(id).shortName, x: ZONES[id][0], z: ZONES[id][1], hint: "to next clue" } : null;
}
