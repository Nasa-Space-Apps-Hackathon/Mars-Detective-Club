"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useGame } from "@/store/useGame";
import { Button, NarratorIcon, Overlay, popIn, ZiggySvg } from "./primitives";

function About({ onClose }: { onClose: () => void }) {
  return (
    <Overlay>
      <motion.div {...popIn} className="glass rounded-3xl p-8 max-w-2xl space-y-4">
        <h2 className="font-display text-3xl font-bold">About this game</h2>
        <p>
          <b>The Great Mars Detective Club</b> is an educational game for kids aged 9–14, made for the <b>NASA Space Apps Challenge 2026</b>:{" "}
          <i>Abandoned but not Forgotten: Storytelling about NASA&apos;s Discarded Equipment on the Moon and Mars.</i>
        </p>
        <p>
          You visit three real NASA machines that are still resting on Mars: <b>Viking 1</b> (1976), <b>Opportunity</b> (2004) and <b>Phoenix</b> (2008). You learn what each one
          discovered and why it stopped working.
        </p>
        <p className="bg-white/10 rounded-2xl p-3 text-[16px]">
          <b>Virtual simulation:</b> in real life these machines landed thousands of kilometers apart. We placed them close together so you can visit all three. Their true landing
          sites are shown in your Journal.
        </p>
        <div className="flex justify-end">
          <Button variant="glow" onClick={onClose} autoFocus>
            Got it!
          </Button>
        </div>
      </motion.div>
    </Overlay>
  );
}

export default function MainMenu() {
  const startGame = useGame((s) => s.startGame);
  const goTo = useGame((s) => s.goTo);
  const [about, setAbout] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-night/90 via-night/55 to-rust/50 stars" />
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 gap-6">
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 160, damping: 12 }}>
          <NarratorIcon size={110} />
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <p className="font-display text-glow tracking-[0.3em] text-sm md:text-base">NASA SPACE APPS 2026</p>
          <h1 className="font-display font-bold text-5xl md:text-7xl leading-[0.95] drop-shadow-[0_4px_0_#8a2f0a]">
            The Great Mars
            <br />
            Detective Club
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-dust">Case #001: Did Mars ever have water?</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-3">
          <Button className="text-2xl px-10 py-4" onClick={startGame} autoFocus>
            Start the case
          </Button>
          <Button variant="ghost" onClick={() => setAbout(true)}>
            About
          </Button>
          <Button variant="ghost" onClick={() => goTo("credits")}>
            Credits & Sources
          </Button>
        </motion.div>

        <motion.div className="absolute bottom-8 right-8 hidden md:block" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
          <ZiggySvg size={120} />
        </motion.div>
        <p className="absolute bottom-4 inset-x-0 text-center text-sm text-white/60 px-4">
          A virtual Mars simulation. The real machines landed far apart; their true sites are shown in your Journal.
        </p>
      </div>
      <AnimatePresence>{about && <About onClose={() => setAbout(false)} />}</AnimatePresence>
    </motion.div>
  );
}
