"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "@/store/useGame";
import { getArtifact } from "@/lib/content";
import { expeditionDestination, getObjective } from "@/lib/objectives";
import HoldInteractionButton from "./HoldInteractionButton";
import ControlsHint from "./ControlsHint";
import ActiveMissions from "./ActiveMissions";
import supplyStyles from "./SupplyUI.module.css";
import WorldStatus, { useWorldStatus } from "./WorldStatus";
import GameplayControls, { FrameArt } from "./GameplayControls";
import styles from "./ExplorationHUD.module.css";

function Compass() {
  const state = useGame();
  const [px, pz] = useGame((s) => s.playerPos);
  const yaw = useGame((s) => s.playerYaw);
  const target = expeditionDestination(state);
  if (!target) return null;
  const { x: tx, z: tz } = target;
  const angle = Math.atan2(tx - px, tz - pz) - yaw;
  const degrees = -Math.atan2(Math.sin(angle), Math.cos(angle)) * 180 / Math.PI;
  const distance = Math.round(Math.hypot(tx - px, tz - pz));
  return (
    <div className={styles.compass} aria-label={`Next destination: ${target.label}, ${distance} metres away`}>
      <FrameArt small />
      <motion.div className={styles.compassArrow} animate={{ rotate: degrees }} transition={{ duration: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 6 16-6-4-6 4Z" fill="#a8441c" /></svg>
      </motion.div>
      <div className={styles.destination}><strong>{target.label}</strong><span>{distance} m {target.hint}</span></div>
    </div>
  );
}

export default function HUD() {
  const phase = useGame((s) => s.phase);
  const evidence = useGame((s) => s.evidence);
  const near = useGame((s) => s.nearArtifact);
  const nearSalvage = useGame((s) => s.nearSalvage);
  const nearShip = useGame((s) => s.nearShip);
  const repaired = useGame((s) => s.repaired);
  const toolbox = useGame((s) => s.toolbox);
  const salvage = useGame((s) => s.salvage);
  const repairMission = useGame((s) => s.repairMission);
  const fieldMessage = useGame((s) => s.fieldMessage);
  const collectedCount = useGame((s) => s.collectedSalvage.length);
  const paused = useGame((s) => s.paused);
  const journalOpen = useGame((s) => s.journalOpen);
  const showControls = useGame((s) => s.showControls);
  const grounded = useWorldStatus((s) => s.grounded);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!fieldMessage) return;
    const timer = window.setTimeout(() => {
      if (useGame.getState().fieldMessage === fieldMessage) useGame.setState({ fieldMessage: "" });
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [fieldMessage, collectedCount]);
  const interactive = phase === "explore" && !paused && !journalOpen && !showControls;
  const nearSolved = near ? evidence.includes(near) : false;
  const broken = near ? !repaired.includes(near) : false;
  const prompt = near ? broken ? toolbox ? `Repair ${getArtifact(near).shortName}` : `${getArtifact(near).shortName} is offline` : nearSolved ? `Revisit ${getArtifact(near).shortName}` : `Scan ${getArtifact(near).shortName}` : nearShip ? "Open ship supplies" : "Collect recyclable scrap";
  const detail = near ? broken ? toolbox ? "Use your reusable toolbox" : "Toolbox needed · Hold E for the supply mission" : nearSolved ? "Open the mission file again" : "A discovery is waiting inside" : nearShip ? "Trade scrap for a reusable repair toolbox" : "Recyclable debris · Trade it at your ship";

  return (
    <div className={styles.hud}>
      <div className={styles.mission}>
        <FrameArt />
        <h1>Did Mars have water?</h1>
        <p>{getObjective({ phase, evidence, repairMission, toolbox, salvage })}</p>
      </div>
      <GameplayControls interactive={interactive} />
      <ControlsHint interactive={interactive} hasPrompt={Boolean(near || nearShip || nearSalvage)} />
      {interactive && <><Compass /><WorldStatus /><ActiveMissions />{fieldMessage && <p className={supplyStyles.message} role="status">{fieldMessage}</p>}</>}
      <AnimatePresence>
        {interactive && (near || nearShip || nearSalvage) && (
          <div className={styles.scan} key={near ?? (nearShip ? "ship" : nearSalvage)}>
            <motion.div initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <HoldInteractionButton className={styles.scanButton} disabled={!grounded}>
              <kbd>E</kbd>
              <span className={styles.scanText}><strong>{!grounded ? "Land to interact" : prompt}</strong><small>{detail}</small></span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8V3h5m8 0h5v5m0 8v5h-5M8 21H3v-5M5 12h14" /></svg>
            </HoldInteractionButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
