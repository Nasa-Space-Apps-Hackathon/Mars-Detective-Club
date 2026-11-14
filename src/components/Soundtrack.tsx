"use client";

import { useEffect } from "react";
import { getAudioLevels, subscribeAudioLevels } from "@/lib/sfx";
import { useGame } from "@/store/useGame";

/** One streamed track continues across story and exploration; it is not decoded into RAM. */
export default function Soundtrack() {
  useEffect(() => {
    const audio = new Audio("/sfx/Tea_And_Tangrams.m4a");
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0;
    let unlocked = false;
    let frame = 0;
    let last = performance.now();
    let pending = false;
    const active = () => !["menu", "credits", "ending"].includes(useGame.getState().phase);
    const begin = () => {
      if (!unlocked || !active() || document.hidden || !audio.paused || pending) return;
      pending = true;
      void audio.play().catch(() => { /* A later gesture can unlock playback. */ }).finally(() => { pending = false; });
    };
    const gesture = () => { unlocked = true; begin(); };
    const sync = () => { if (document.hidden) audio.pause(); else begin(); };
    const unsubscribe = useGame.subscribe(sync);
    const unsubscribeLevels = subscribeAudioLevels(sync);
    window.addEventListener("pointerdown", gesture, true);
    window.addEventListener("keydown", gesture, true);
    document.addEventListener("visibilitychange", sync);
    const tick = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.1); last = time;
      const game = useGame.getState();
      const levels = getAudioLevels();
      const playing = active() && !document.hidden;
      const target = playing && !game.muted ? levels.master * levels.music * (game.paused ? 0.25 : 1) : 0;
      audio.volume += (target - audio.volume) * (1 - Math.exp(-dt * 2.5));
      if (Math.abs(target - audio.volume) < 0.001) audio.volume = target;
      if (!playing && audio.volume === 0 && !audio.paused) { audio.pause(); if (!active()) audio.currentTime = 0; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); unsubscribe(); unsubscribeLevels();
      window.removeEventListener("pointerdown", gesture, true);
      window.removeEventListener("keydown", gesture, true);
      document.removeEventListener("visibilitychange", sync);
      audio.pause(); audio.removeAttribute("src"); audio.load();
    };
  }, []);
  return null;
}
