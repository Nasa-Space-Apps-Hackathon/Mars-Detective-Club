"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useGame } from "@/store/useGame";
import HUD from "./HUD";
import DialogueBox from "./DialogueBox";
import MemoryPanel from "./MemoryPanel";
import ActivityHost from "./activities/ActivityHost";
import EvidenceUnlock from "./EvidenceUnlock";
import Journal from "./Journal";
import MainMenu from "./MainMenu";
import ControlsTutorial from "./ControlsTutorial";
import PauseMenu from "./PauseMenu";
import CaseBoard from "./CaseBoard";
import Credits from "./Credits";
import DevPanel from "./DevPanel";
import ShipShop from "./ShipShop";
import { closeGameplayPanel, GameplaySettings, useGameplayPanel } from "./GameplayControls";
import controlStyles from "./GameplayControls.module.css";

/**
 * Person 4's overlay. Sits on top of the 3D canvas.
 * pointer-events: none on the root so the canvas still gets input;
 * every interactive panel turns pointer-events back on.
 */
export default function UILayer() {
  const phase = useGame((s) => s.phase);
  const paused = useGame((s) => s.paused);
  const journalOpen = useGame((s) => s.journalOpen);
  const showControls = useGame((s) => s.showControls);
  const settingsPanel = useGameplayPanel((s) => s.panel);
  const [dev, setDev] = useState(false);

  useEffect(() => {
    setDev(new URLSearchParams(window.location.search).has("dev"));
  }, []);

  useEffect(() => {
    if (phase !== "explore" || !paused) useGameplayPanel.getState().setPanel(null);
  }, [phase, paused]);

  // global keys: Esc = pause / close, J = journal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const s = useGame.getState();
      const inGame = !["menu", "credits"].includes(s.phase);
      if (e.code === "Escape" && inGame) {
        if (useGameplayPanel.getState().panel) closeGameplayPanel();
        else if (s.phase === "shop") s.closeShop();
        else if (s.journalOpen) s.toggleJournal(false);
        else if (s.showControls) s.dismissControls();
        else if (s.phase === "explore") s.togglePause();
      }
      if (e.code === "KeyJ" && !e.repeat && s.phase === "explore" && !s.paused && !s.showControls) s.toggleJournal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const inPlay = !["menu", "credits", "ending"].includes(phase);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${controlStyles.theme}`}>
      {inPlay && <HUD />}

      <AnimatePresence mode="wait">
        {phase === "menu" && <MainMenu key="menu" />}
        {(phase === "intro" || phase === "dialogue") && <DialogueBox key="dialogue" />}
        {phase === "memory" && <MemoryPanel key="memory" />}
        {phase === "shop" && <ShipShop key="shop" />}
        {phase === "activity" && <ActivityHost key="activity" />}
        {phase === "evidence" && <EvidenceUnlock key="evidence" />}
        {phase === "ending" && <CaseBoard key="ending" />}
        {phase === "credits" && <Credits key="credits" />}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "explore" && showControls && <ControlsTutorial key="controls" />}
        {journalOpen && <Journal key="journal" />}
        {paused && !settingsPanel && <PauseMenu key="pause" />}
      </AnimatePresence>

      {settingsPanel && <GameplaySettings />}

      {dev && <DevPanel />}
    </div>
  );
}
