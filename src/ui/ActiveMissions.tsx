"use client";

import { useGame } from "@/store/useGame";
import { TOOLBOX_COST } from "@/world/salvageData";
import { nextTarget } from "@/lib/objectives";
import { getArtifact } from "@/lib/content";
import styles from "./SupplyUI.module.css";

export default function ActiveMissions() {
  const salvage = useGame((s) => s.salvage);
  const toolbox = useGame((s) => s.toolbox);
  const repaired = useGame((s) => s.repaired);
  const mission = useGame((s) => s.repairMission);
  const evidence = useGame((s) => s.evidence);
  const target = nextTarget(evidence);
  const repairDone = repaired.includes("opportunity") && repaired.includes("phoenix");
  const step = !mission ? "Visit Viking 1" : !toolbox && salvage < TOOLBOX_COST ? "Collect recyclable scrap" : !toolbox ? "Trade at your ship" : !repairDone ? "Bring the stations back online" : "Follow the remaining clues";
  return <aside className={styles.missions} aria-labelledby="missions-title">
    <h2 id="missions-title">Active missions</h2>
    <h3>{step}</h3>
    <p>{!mission ? "Your first station is ready. Follow the compass and press E to scan." : !toolbox && salvage < TOOLBOX_COST ? "Look for amber debris with mint markers along the Viking trail. Press E to collect." : !toolbox ? "Return to the ship supply terminal. Exchange your scrap for a reusable toolbox." : !repairDone ? "Press E at an offline station to repair it, then press E again to scan." : target ? `Find ${getArtifact(target).shortName} and collect its evidence.` : "All three clues are in your journal."}</p>
    <div className={styles.pack}><span>Scrap <strong>{salvage}/{TOOLBOX_COST}</strong></span><span>Toolbox <strong>{toolbox ? "Packed" : "Needed"}</strong></span></div>
    {mission && !toolbox && <progress aria-label="Scrap collected for toolbox" value={Math.min(salvage, TOOLBOX_COST)} max={TOOLBOX_COST} />}
    {mission && <ul><li data-done={repaired.includes("opportunity")}>Opportunity <span>{repaired.includes("opportunity") ? "Online" : "Offline"}</span></li><li data-done={repaired.includes("phoenix")}>Phoenix <span>{repaired.includes("phoenix") ? "Online" : "Offline"}</span></li></ul>}
  </aside>;
}
