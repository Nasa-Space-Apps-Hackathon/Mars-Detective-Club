"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useGame } from "@/store/useGame";
import { getArtifact } from "@/lib/content";
import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import { EvidenceCard } from "./EvidenceUnlock";
import { Button, Overlay, popIn } from "./primitives";

export default function Journal() {
  const evidence = useGame((s) => s.evidence);
  const toggleJournal = useGame((s) => s.toggleJournal);
  const [open, setOpen] = useState<ArtifactId | null>(evidence[evidence.length - 1] ?? null);
  const a = open ? getArtifact(open) : null;

  return (
    <Overlay>
      <motion.div {...popIn} className="glass rounded-3xl p-6 md:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-display uppercase tracking-widest text-glow">Detective Journal</p>
            <h2 className="font-display text-3xl font-bold">Case #001: Did Mars ever have water?</h2>
          </div>
          <Button variant="ghost" onClick={() => toggleJournal(false)} aria-label="Close journal">
            ✕
          </Button>
        </div>

        <div className="flex flex-wrap gap-5 justify-center">
          {ARTIFACT_ORDER.map((id, i) =>
            evidence.includes(id) ? (
              <button key={id} onClick={() => setOpen(id)} className={`transition cursor-pointer ${open === id ? "scale-105" : "opacity-80 hover:opacity-100"}`}>
                <EvidenceCard id={id} small />
              </button>
            ) : (
              <div key={id} className="w-52 h-[290px] rounded-3xl border-4 border-dashed border-white/25 grid place-items-center text-center p-4">
                <div>
                  <p className="text-6xl font-display text-white/30">?</p>
                  <p className="text-white/50 text-sm mt-2">Clue #{i + 1} not found yet</p>
                </div>
              </div>
            ),
          )}
        </div>

        {a && (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white/5 rounded-2xl p-5 grid md:grid-cols-3 gap-4 text-[16px]">
            <div>
              <p className="text-glow font-display font-bold">{a.name}</p>
              <p className="text-white/70 text-sm">
                Landed {a.landed}
                <br />📍 {a.realLocation}
              </p>
            </div>
            <div>
              <p className="font-bold">💡 Discovery</p>
              <p className="text-white/85">{a.discovery}</p>
            </div>
            <div>
              <p className="font-bold">🌙 Why it stopped</p>
              <p className="text-white/85">{a.whyStopped}</p>
            </div>
          </motion.div>
        )}
        {evidence.length === 0 && <p className="text-center text-white/60 mt-6">Find a NASA machine and press E to scan it. Its clue will appear here.</p>}
      </motion.div>
    </Overlay>
  );
}
