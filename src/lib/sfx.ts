"use client";

import { useGame } from "@/store/useGame";

/**
 * Tiny synthesized UI sounds (Web Audio). No audio files or licenses needed.
 * Replace with real sfx in /public/sfx later if the team wants.
 */
let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.06, delay = 0, slideTo?: number) {
  if (useGame.getState().muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => tone(660, 0.07, "triangle", 0.05),
  blip: () => tone(900 + Math.random() * 200, 0.03, "square", 0.012),
  scan: () => tone(300, 0.6, "sawtooth", 0.03, 0, 1200),
  correct: () => {
    tone(660, 0.12, "triangle", 0.06);
    tone(990, 0.18, "triangle", 0.06, 0.1);
  },
  wrong: () => tone(220, 0.25, "sine", 0.06, 0, 160),
  unlock: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "triangle", 0.06, i * 0.09));
  },
  dig: () => tone(140, 0.09, "square", 0.03, 0, 90),
  open: () => tone(440, 0.12, "sine", 0.05, 0, 660),
};
