"use client";

import { motion } from "motion/react";
import { useGame } from "@/store/useGame";
import type { ArtifactId } from "@/store/types";
import { Overlay, popIn, ZiggySvg } from "../primitives";
import RockScanner from "./RockScanner";
import SoilLab from "./SoilLab";
import DigSite from "./DigSite";

/** Every activity follows this contract. */
export interface ActivityProps {
  onSuccess: () => void;
}

const ACTIVITY: Record<ArtifactId, (p: ActivityProps) => React.JSX.Element> = {
  viking1: SoilLab,
  opportunity: RockScanner,
  phoenix: DigSite,
};

export function ActivityShell({
  title,
  intro,
  ziggySays,
  children,
}: {
  title: string;
  intro: string;
  ziggySays?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-display uppercase tracking-widest text-glow">Investigation</p>
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        <p className="text-white/85 mt-1">{intro}</p>
      </div>
      {children}
      <div className="flex items-center gap-3 min-h-[64px]">
        <ZiggySvg size={56} talking={!!ziggySays} />
        {ziggySays && (
          <motion.p key={ziggySays} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white text-night rounded-2xl rounded-bl-none px-4 py-2 text-[16px] font-semibold max-w-xl">
            {ziggySays}
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default function ActivityHost() {
  const id = useGame((s) => s.activeArtifact);
  const completeActivity = useGame((s) => s.completeActivity);
  if (!id) return null;
  const Activity = ACTIVITY[id];
  return (
    <Overlay>
      <motion.div {...popIn} className="glass rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <Activity onSuccess={() => completeActivity(id)} />
      </motion.div>
    </Overlay>
  );
}
