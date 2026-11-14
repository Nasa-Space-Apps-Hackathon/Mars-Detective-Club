import { canMove, useGame } from "@/store/useGame";

/** Keyboard and pointer prompts share exactly one interaction priority. */
export function interactNearby() {
  if (!canMove()) return;
  const s = useGame.getState();
  if (s.nearArtifact) s.startScan(s.nearArtifact);
  else if (s.nearShip) s.openShop();
  else if (s.nearSalvage) s.collectSalvage(s.nearSalvage);
}
