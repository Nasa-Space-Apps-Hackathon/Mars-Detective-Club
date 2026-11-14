"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useGame } from "@/store/useGame";
import { getArtifact } from "@/lib/content";
import { expeditionDestination, getObjective } from "@/lib/objectives";
import { interactNearby } from "@/lib/supplies";
import ActiveMissions from "./ActiveMissions";
import supplyStyles from "./SupplyUI.module.css";
import WorldStatus, { useWorldStatus } from "./WorldStatus";
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
      <motion.div className={styles.compassArrow} animate={{ rotate: degrees }} transition={{ duration: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 6 16-6-4-6 4Z" fill="#baf4e4" /></svg>
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
  const muted = useGame((s) => s.muted);
  const paused = useGame((s) => s.paused);
  const journalOpen = useGame((s) => s.journalOpen);
  const showControls = useGame((s) => s.showControls);
  const toggleJournal = useGame((s) => s.toggleJournal);
  const togglePause = useGame((s) => s.togglePause);
  const toggleMute = useGame((s) => s.toggleMute);
  const steady = useWorldStatus((s) => s.steadyCamera);
  const grounded = useWorldStatus((s) => s.grounded);
  const toggleSteady = useWorldStatus((s) => s.toggleSteadyCamera);
  const reduced = useReducedMotion();
  const interactive = phase === "explore" && !paused && !journalOpen && !showControls;
  const nearSolved = near ? evidence.includes(near) : false;
  const broken = near ? !repaired.includes(near) : false;
  const prompt = near ? broken ? toolbox ? `Repair ${getArtifact(near).shortName}` : `${getArtifact(near).shortName} is offline` : nearSolved ? `Revisit ${getArtifact(near).shortName}` : `Scan ${getArtifact(near).shortName}` : nearShip ? "Open ship supplies" : "Collect recyclable scrap";
  const detail = near ? broken ? toolbox ? "Use your reusable toolbox" : "Toolbox needed · Press E for the supply mission" : nearSolved ? "Open the mission file again" : "A discovery is waiting inside" : nearShip ? "Trade scrap for a reusable repair toolbox" : "Amber debris · Trade it at your ship";

  return (
    <div className={styles.hud}>
      <div className={styles.mission}>
        <h1>Did Mars have water?</h1>
        <p>{getObjective({ phase, evidence, repairMission, toolbox, salvage })}</p>
      </div>
      <div className={styles.actions}>
        <button onClick={() => toggleJournal()} disabled={!interactive} className={styles.action} aria-label={`Open journal, ${evidence.length} of 3 evidence cards`} title="Journal (J)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h13a1 1 0 0 1 1 1v17H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Zm1 0v18M9 8h7M9 12h5" /></svg>
          <span className={styles.counter}>{evidence.length}/3</span>
        </button>
        <button onClick={toggleMute} className={styles.action} aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute sound" : "Mute sound"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 4-6 5H2v6h3l6 5Z" />{muted ? <path d="m16 9 6 6m0-6-6 6" /> : <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />}</svg>
        </button>
        <button onClick={toggleSteady} className={styles.action} aria-pressed={steady} aria-label="Steady camera: reduce shake and speed effects" title={steady ? "Steady camera on" : "Enable steady camera"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l2-3h4l2 3h4v13H4Z" /><circle cx="12" cy="13" r="3.5" /></svg>
        </button>
        <button onClick={() => togglePause(true)} disabled={!interactive} className={styles.action} aria-label="Pause game" title="Pause (Esc)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" strokeWidth="3" /></svg>
        </button>
      </div>
      {interactive && <><Compass /><WorldStatus /><ActiveMissions />{fieldMessage && <p className={supplyStyles.message} role="status">{fieldMessage}</p>}</>}
      <AnimatePresence>
        {interactive && (near || nearShip || nearSalvage) && (
          <div className={styles.scan} key={near ?? (nearShip ? "ship" : nearSalvage)}>
            <motion.button className={styles.scanButton} disabled={!grounded} initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onClick={interactNearby}>
              <kbd>E</kbd>
              <span className={styles.scanText}><strong>{!grounded ? "Land to interact" : prompt}</strong><small>{detail}</small></span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8V3h5m8 0h5v5m0 8v5h-5M8 21H3v-5M5 12h14" /></svg>
            </motion.button>
          </div>
        )}
      </AnimatePresence>
      {interactive && (
        <div className={styles.controls} aria-label="Game controls">
          <span><kbd>WASD</kbd> move</span><span><kbd>Space</kbd> jump</span><span><kbd>Shift</kbd> sprint</span><span>Drag to look</span><span>Scroll to zoom</span><span><kbd>R</kbd> recenter</span>
        </div>
      )}
    </div>
  );
}
