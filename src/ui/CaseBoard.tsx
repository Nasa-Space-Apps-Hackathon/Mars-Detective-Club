"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useGame } from "@/store/useGame";
import { ARTIFACTS } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import { EvidenceCard } from "./EvidenceUnlock";
import { Button, ZiggySvg } from "./primitives";

const byYear = [...ARTIFACT_ORDER].sort((a, b) => ARTIFACTS[a].year - ARTIFACTS[b].year);

/**
 * Ending: the player pins the 3 Evidence Cards on the board in time order
 * (oldest → newest), then the verdict is revealed.
 */
export default function CaseBoard() {
  const goTo = useGame((s) => s.goTo);
  const shuffled = useMemo(() => [...ARTIFACT_ORDER].sort(() => Math.random() - 0.5), []);
  const [placed, setPlaced] = useState<ArtifactId[]>([]);
  const [ziggy, setZiggy] = useState("Pin the clues on the board from OLDEST to NEWEST. Click a card to pin it!");
  const [shake, setShake] = useState<ArtifactId | null>(null);
  const solved = placed.length === 3;

  const pin = (id: ArtifactId) => {
    if (placed.includes(id) || solved) return;
    const expected = byYear[placed.length];
    if (id === expected) {
      sfx.correct();
      const next = [...placed, id];
      setPlaced(next);
      if (next.length === 3) {
        setTimeout(() => sfx.unlock(), 300);
        setZiggy("CASE SOLVED! Look at what we found together!");
      } else setZiggy(`Yes! ${ARTIFACTS[id].shortName} landed in ${ARTIFACTS[id].year}. Which clue came next?`);
    } else {
      sfx.wrong();
      setShake(id);
      setTimeout(() => setShake(null), 500);
      setZiggy(`Hmm, check the year on each card. Which machine landed ${placed.length === 0 ? "first" : "next"}?`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-auto overflow-y-auto bg-night/80 stars">
      <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <p className="font-display text-glow tracking-widest">CASE #001</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Did Mars ever have water?</h2>
        </div>

        {/* corkboard */}
        <div
          className="relative rounded-3xl p-6 md:p-8 w-full max-w-5xl border-8 border-[#6b3e1f]"
          style={{ background: "radial-gradient(circle at 20% 30%, #c9955f, #b07a45 60%, #9c6a3a)" }}
        >
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* timeline line */}
            <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-rust-dark/50 rounded-full" />
            {[0, 1, 2].map((slot) => {
              const id = placed[slot];
              return (
                <div key={slot} className="relative flex flex-col items-center gap-2">
                  <span className="font-display font-bold text-night bg-paper rounded-full px-3 py-0.5 text-sm shadow">
                    {slot === 0 ? "1 · Oldest" : slot === 1 ? "2" : "3 · Newest"}
                  </span>
                  <div className="w-52 min-h-[290px] rounded-3xl border-4 border-dashed border-night/30 grid place-items-center">
                    <AnimatePresence>
                      {id ? (
                        <motion.div key={id} initial={{ scale: 1.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: slot === 1 ? 2 : -2 }} className="relative">
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rust border-2 border-white z-10 shadow" />
                          <EvidenceCard id={id} small />
                        </motion.div>
                      ) : (
                        <span className="text-night/40 font-display text-5xl">?</span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* hand of cards */}
        {!solved && (
          <div className="flex flex-wrap justify-center gap-4">
            {shuffled
              .filter((id) => !placed.includes(id))
              .map((id) => (
                <motion.button
                  key={id}
                  layout
                  onClick={() => pin(id)}
                  animate={shake === id ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
                  whileHover={{ y: -8 }}
                  className="cursor-pointer"
                >
                  <EvidenceCard id={id} small />
                </motion.button>
              ))}
          </div>
        )}

        <div className="flex items-center gap-3 max-w-2xl">
          <ZiggySvg size={64} talking />
          <p className="bg-white text-night rounded-2xl rounded-bl-none px-4 py-2 font-semibold">{ziggy}</p>
        </div>

        {/* verdict */}
        <AnimatePresence>
          {solved && (
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.4 }} className="glass rounded-3xl p-6 md:p-8 max-w-3xl text-center space-y-4">
              <p className="font-display text-glow tracking-widest">THE VERDICT</p>
              <p className="font-display text-2xl md:text-3xl font-bold leading-snug">
                Mars had liquid water long ago
                <br />
                and still has frozen ice today
              </p>
              <p className="text-lg text-white/90">
                But did life ever exist on Mars? <b>Nobody knows yet.</b> Viking&apos;s experiments couldn&apos;t prove it.
                <br />
                <span className="text-glow font-bold">This part of the case is still open… maybe YOU will solve it one day.</span>
              </p>
              <p className="italic text-dust">&ldquo;These machines stopped working. But their discoveries never did.&rdquo; · Ziggy</p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button variant="glow" onClick={() => goTo("credits")} autoFocus>
                  See credits & sources
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
