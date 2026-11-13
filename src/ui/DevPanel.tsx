"use client";

import { useState } from "react";
import { useGame } from "@/store/useGame";
import { ARTIFACT_ORDER, type ArtifactId, type Phase } from "@/store/types";

/** Dev-only test panel. Open the game with ?dev=1 */
export default function DevPanel() {
  const s = useGame();
  const [open, setOpen] = useState(true);

  const fakeScan = (id: ArtifactId) => {
    useGame.setState({ phase: "explore", paused: false, journalOpen: false, showControls: false });
    useGame.getState().startScan(id);
  };
  const jump = (phase: Phase, id?: ArtifactId) => {
    useGame.setState({ phase, activeArtifact: id ?? s.activeArtifact ?? "opportunity", paused: false, journalOpen: false, showControls: false });
  };

  return (
    <div className="absolute left-2 top-28 pointer-events-auto z-50 text-xs font-mono">
      <button onClick={() => setOpen(!open)} className="bg-black/80 text-leaf px-2 py-1 rounded">
        DEV {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="bg-black/85 text-white p-2 rounded mt-1 w-56 space-y-2">
          <p>
            phase: <b className="text-leaf">{s.phase}</b> · near: {s.nearArtifact ?? "-"}
            <br />
            active: {s.activeArtifact ?? "-"} · evidence: [{s.evidence.join(",")}]
          </p>
          <div className="flex flex-wrap gap-1">
            {(["menu", "intro", "explore", "ending", "credits"] as Phase[]).map((p) => (
              <button key={p} className="bg-white/15 px-1.5 py-0.5 rounded hover:bg-white/30" onClick={() => (p === "intro" ? s.startGame() : jump(p))}>
                {p}
              </button>
            ))}
          </div>
          {ARTIFACT_ORDER.map((id) => (
            <div key={id} className="flex flex-wrap gap-1 items-center">
              <span className="w-20 text-glow">{id}</span>
              <button className="bg-white/15 px-1 rounded" onClick={() => fakeScan(id)}>
                scan
              </button>
              <button className="bg-white/15 px-1 rounded" onClick={() => jump("memory", id)}>
                file
              </button>
              <button className="bg-white/15 px-1 rounded" onClick={() => jump("activity", id)}>
                act
              </button>
              <button className="bg-white/15 px-1 rounded" onClick={() => s.devUnlock(id)}>
                +ev
              </button>
            </div>
          ))}
          <div className="flex gap-1">
            <button className="bg-rust px-1.5 py-0.5 rounded" onClick={s.reset}>
              reset
            </button>
            <button className="bg-white/15 px-1.5 py-0.5 rounded" onClick={() => ARTIFACT_ORDER.forEach(s.devUnlock)}>
              unlock all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
