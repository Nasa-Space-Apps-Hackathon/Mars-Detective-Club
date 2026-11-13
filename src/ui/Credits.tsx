"use client";

import { motion } from "motion/react";
import { useGame } from "@/store/useGame";
import { ARTIFACTS } from "@/lib/content";
import { ARTIFACT_ORDER } from "@/store/types";
import { Button } from "./primitives";

/** TODO(team): put real names + GitHub URL here. */
const TEAM = [
  { role: "Mars World & Exploration", name: "Person 1" },
  { role: "NASA Artifacts & 3D Models", name: "Person 2" },
  { role: "Story, Science & Content", name: "Person 3" },
  { role: "Gameplay Flow & UI", name: "Person 4" },
  { role: "Architecture, Integration & Release", name: "Person 5" },
];
const GITHUB_URL = "https://github.com/your-team/mars-detective-club";

export default function Credits() {
  const reset = useGame((s) => s.reset);
  const startGame = useGame((s) => s.startGame);
  const finished = useGame((s) => s.evidence.length === 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-auto overflow-y-auto bg-night stars">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center">
          <p className="font-display text-glow tracking-widest">THE GREAT MARS DETECTIVE CLUB</p>
          <h2 className="font-display text-5xl font-bold">Credits</h2>
          <p className="text-white/70 mt-2">NASA Space Apps Challenge 2026 · Abandoned but not Forgotten</p>
        </div>

        <section>
          <h3 className="font-display text-2xl font-bold mb-3">👩‍🚀 Team</h3>
          <ul className="grid sm:grid-cols-2 gap-2">
            {TEAM.map((t) => (
              <li key={t.role} className="bg-white/5 rounded-xl px-4 py-2">
                <b>{t.name}</b>
                <br />
                <span className="text-white/70 text-sm">{t.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-display text-2xl font-bold mb-3">🛰️ NASA sources</h3>
          <ul className="space-y-2 text-[16px]">
            {ARTIFACT_ORDER.map((id) => (
              <li key={id} className="bg-white/5 rounded-xl px-4 py-2">
                <b>{ARTIFACTS[id].name}</b>:{" "}
                {ARTIFACTS[id].sources.map((s, i) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline text-glow">
                    {s.label}
                    {i < ARTIFACTS[id].sources.length - 1 ? " · " : ""}
                  </a>
                ))}
              </li>
            ))}
            <li className="bg-white/5 rounded-xl px-4 py-2">
              Challenge:{" "}
              <a className="underline text-glow" href="https://www.spaceappschallenge.org/" target="_blank" rel="noreferrer">
                NASA Space Apps Challenge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-display text-2xl font-bold mb-3">🤖 AI use disclosure</h3>
          <p className="text-white/85 text-[16px]">
            Per Space Apps rules: list every AI-generated asset (images, 3D models, voice, code) here. TODO(team): fill in, e.g. &ldquo;Ziggy 3D model generated with … · Code written
            with AI assistance (Claude)&rdquo;.
          </p>
        </section>

        <section className="text-center space-y-4">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="underline text-glow">
            View source code on GitHub
          </a>
          <div className="flex flex-wrap justify-center gap-3">
            {finished && (
              <Button variant="glow" onClick={startGame}>
                Play again
              </Button>
            )}
            <Button variant="ghost" onClick={reset}>
              Main menu
            </Button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
