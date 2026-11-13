"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "@/store/useGame";
import { getArtifact } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { Button, MachineIcon, Overlay, popIn } from "./primitives";

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-2xl leading-none mt-0.5" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="font-display font-bold text-rust text-base uppercase tracking-wide">{label}</p>
        <p className="text-[17px] leading-snug">{children}</p>
      </div>
    </div>
  );
}

/** The machine's "case file", built from content/artifacts.json */
export default function MemoryPanel() {
  const id = useGame((s) => s.activeArtifact);
  const revisit = useGame((s) => s.revisit);
  const openActivity = useGame((s) => s.openActivity);
  const closeMemory = useGame((s) => s.closeMemory);

  useEffect(() => {
    sfx.open();
    // Enter = continue (no autoFocus, so the file opens scrolled to the top)
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Enter") return;
      const s = useGame.getState();
      if (s.revisit) s.closeMemory();
      else s.openActivity();
    };
    const t = setTimeout(() => window.addEventListener("keydown", onKey), 400);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  if (!id) return null;
  const a = getArtifact(id);

  return (
    <Overlay>
      <motion.div {...popIn} className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* folder tab */}
        <div className="paper rounded-t-2xl self-start px-6 py-2 font-display font-bold text-rust-dark ml-6 -mb-1">
          📁 CASE FILE · {a.shortName.toUpperCase()}
        </div>
        <div className="paper rounded-3xl p-6 md:p-8 overflow-y-auto relative">
          <div className="absolute top-5 right-6 rotate-[-8deg] border-4 border-rust text-rust font-display font-bold px-3 py-1 rounded-lg opacity-80 text-sm">
            MARS DETECTIVE CLUB
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* picture */}
            <div className="md:w-64 shrink-0">
              <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-[#f1d3b3] aspect-square grid place-items-center rotate-[-2deg]">
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <MachineIcon id={id} size={170} />
                )}
              </div>
              {a.imageCredit && <p className="text-xs mt-2 opacity-70">{a.imageCredit}</p>}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/70 rounded-xl p-2">
                  <p className="font-bold text-rust">Launched</p>
                  <p>{a.launched}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-2">
                  <p className="font-bold text-rust">Landed</p>
                  <p>{a.landed}</p>
                </div>
              </div>
            </div>

            {/* facts */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-bold opacity-60">{a.mission}</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-night">{a.name}</h2>
                <p className="text-sm mt-1">
                  📍 <b>Real location:</b> {a.realLocation}
                </p>
              </div>
              <Row icon="🎯" label="Why NASA sent it">{a.purpose}</Row>
              <Row icon="⚙️" label="How it worked">{a.howItWorked}</Row>
              <Row icon="💡" label="What it discovered">{a.discovery}</Row>
              <Row icon="🌙" label="Why it stopped">{a.whyStopped}</Row>
              <div className="bg-[#ffe7a8] rounded-2xl p-3 text-[16px]">
                <b>⭐ Fun fact:</b> {a.funFact}
              </div>
              <p className="text-xs opacity-70">
                Sources:{" "}
                {a.sources.map((s, i) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline">
                    {s.label}
                    {i < a.sources.length - 1 ? " · " : ""}
                  </a>
                ))}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {revisit ? (
              <Button variant="paper" onClick={closeMemory}>
                Back to exploring
              </Button>
            ) : (
              <Button onClick={openActivity}>
                Investigate the clue 🔍
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </Overlay>
  );
}
