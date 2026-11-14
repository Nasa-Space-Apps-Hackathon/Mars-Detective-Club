"use client";

import { useGame } from "@/store/useGame";

export interface AudioLevels { master: number; effects: number; ambience: number; music: number }
let levels: AudioLevels = { master: 0.75, effects: 0.8, ambience: 0.65, music: 0.55 };
const levelListeners = new Set<() => void>();
export const getAudioLevels = () => levels;
export const subscribeAudioLevels = (listener: () => void) => {
  levelListeners.add(listener);
  return () => { levelListeners.delete(listener); };
};

export function setAudioLevels(next: Partial<AudioLevels>) {
  const updated = { ...levels };
  for (const key of ["master", "effects", "ambience", "music"] as const) {
    const value = next[key];
    if (typeof value === "number" && Number.isFinite(value)) updated[key] = Math.max(0, Math.min(1, value));
  }
  if (Object.keys(updated).every((key) => updated[key as keyof AudioLevels] === levels[key as keyof AudioLevels])) return;
  levels = updated;
  syncAudioMix();
  levelListeners.forEach((listener) => listener());
}

const FILES = {
  wind: "/sfx/hurricane-strong-wind.mp3",
  footstep: "/sfx/one-footstep.mp3",
  impact: "/sfx/universfield-ground-impact.mp3",
  fan: "/sfx/ziggy-fan-sound.mp3",
  collect: "/sfx/collect-points.mp3",
} as const;
export type WorldSound = keyof typeof FILES;
const buffers = new Map<WorldSound, AudioBuffer>();
const downloads = new Map<WorldSound, Promise<ArrayBuffer | null>>();
let decoding: Promise<void> | null = null;
let context: AudioContext | null = null;
let master: GainNode | null = null;
let effects: GainNode | null = null;
let ambience: GainNode | null = null;
let worldEffects: GainNode | null = null;
let audioUsers = 0;
let unsubscribeGame: (() => void) | null = null;
const worldVoices = new Set<AudioBufferSourceNode>();

export function worldAudioActive() {
  const state = useGame.getState();
  return typeof document !== "undefined" && !document.hidden && state.phase === "explore" && !state.paused && !state.journalOpen && !state.showControls;
}

function setGain(node: GainNode | null, value: number) {
  if (!node || !context) return;
  node.gain.cancelScheduledValues(context.currentTime);
  node.gain.setTargetAtTime(value, context.currentTime, 0.015);
}

function stopWorldVoices() {
  worldVoices.forEach((source) => { try { source.stop(); } catch { /* Already ended. */ } });
  worldVoices.clear();
}

function syncAudioMix() {
  if (!context) return;
  setGain(master, useGame.getState().muted || (typeof document !== "undefined" && document.hidden) ? 0 : levels.master);
  setGain(effects, levels.effects);
  setGain(ambience, worldAudioActive() ? levels.ambience : 0);
  setGain(worldEffects, worldAudioActive() ? 1 : 0);
  if (!worldAudioActive() || useGame.getState().muted) stopWorldVoices();
}

function ac() {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return null;
    context = new Constructor();
    master = context.createGain();
    effects = context.createGain();
    ambience = context.createGain();
    worldEffects = context.createGain();
    master.connect(context.destination);
    effects.connect(master);
    ambience.connect(master);
    worldEffects.connect(effects);
    syncAudioMix();
  }
  return context;
}

function download(name: WorldSound) {
  let request = downloads.get(name);
  if (!request) {
    request = fetch(FILES[name]).then((response) => response.ok ? response.arrayBuffer() : null).catch(() => null);
    downloads.set(name, request);
  }
  return request;
}

/** The supplied fan has loud handling/startup bursts; loop its steady motor section. */
function prepareFanLoop(c: AudioContext, recording: AudioBuffer) {
  const start = Math.floor((recording.duration > 20 ? 9 : 0) * recording.sampleRate);
  const end = Math.floor((recording.duration > 20 ? 18 : recording.duration) * recording.sampleRate);
  const overlap = Math.min(Math.floor(recording.sampleRate * 0.08), Math.floor((end - start) / 4));
  const length = end - start - overlap;
  const loop = c.createBuffer(recording.numberOfChannels, length, recording.sampleRate);
  let energy = 0;
  let peak = 0;
  for (let channel = 0; channel < recording.numberOfChannels; channel++) {
    const source = recording.getChannelData(channel);
    const output = loop.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const tail = i - (length - overlap);
      if (tail < 0) output[i] = source[start + overlap + i];
      else {
        const blend = tail / Math.max(1, overlap - 1);
        output[i] = source[start + overlap + i] * (1 - blend) + source[start + tail] * blend;
      }
      energy += output[i] * output[i];
      peak = Math.max(peak, Math.abs(output[i]));
    }
  }
  const rms = Math.sqrt(energy / (length * recording.numberOfChannels));
  const normalization = Math.min(0.07 / Math.max(0.0001, rms), 0.8 / Math.max(0.0001, peak));
  for (let channel = 0; channel < loop.numberOfChannels; channel++) {
    const output = loop.getChannelData(channel);
    for (let i = 0; i < output.length; i++) output[i] *= normalization;
  }
  return loop;
}

/** Called from a real input event; browsers require this before playing sound. */
export function unlockAudio() {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => { /* The next user gesture retries. */ });
  if (!decoding) {
    decoding = Promise.all((Object.keys(FILES) as WorldSound[]).map(async (name) => {
      const bytes = await download(name);
      if (!bytes) return;
      try {
        const recording = await c.decodeAudioData(bytes.slice(0));
        buffers.set(name, name === "fan" ? prepareFanLoop(c, recording) : recording);
      } catch { /* A missing clip must not interrupt gameplay. */ }
    })).then(() => undefined);
  }
}

/** One mounted world owns listeners. Clips preload, but playback waits for user input. */
export function attachGameAudio() {
  audioUsers++;
  // Restore the mix after a remount or hot reload previously silenced the bus.
  syncAudioMix();
  if (audioUsers === 1) {
    for (const name of Object.keys(FILES) as WorldSound[]) void download(name);
    window.addEventListener("pointerdown", unlockAudio, true);
    window.addEventListener("keydown", unlockAudio, true);
    document.addEventListener("visibilitychange", syncAudioMix);
    unsubscribeGame = useGame.subscribe((next, previous) => {
      if (next.muted !== previous.muted || next.phase !== previous.phase || next.paused !== previous.paused || next.journalOpen !== previous.journalOpen || next.showControls !== previous.showControls) syncAudioMix();
      if (next.collectedSalvage.length > previous.collectedSalvage.length) sfx.collect();
    });
  }
  return () => {
    audioUsers--;
    if (audioUsers > 0) return;
    unsubscribeGame?.();
    unsubscribeGame = null;
    window.removeEventListener("pointerdown", unlockAudio, true);
    window.removeEventListener("keydown", unlockAudio, true);
    document.removeEventListener("visibilitychange", syncAudioMix);
    stopWorldVoices();
    setGain(ambience, 0);
  };
}

export interface SoundLoop {
  set: (gain: number, pan: number, rate?: number) => void;
  stop: () => void;
}

export function createSoundLoop(name: "wind" | "fan", offset = 0): SoundLoop | null {
  const c = context;
  const buffer = buffers.get(name);
  if (!c || c.state !== "running" || !buffer || !ambience) return null;
  const source = c.createBufferSource();
  const gain = c.createGain();
  const panner = c.createStereoPanner();
  source.buffer = buffer;
  source.loop = true;
  gain.gain.value = 0;
  source.connect(gain).connect(panner).connect(ambience);
  source.start(0, offset % buffer.duration);
  let stopped = false;
  return {
    set(volume, pan, rate = 1) {
      if (stopped) return;
      gain.gain.setTargetAtTime(Math.max(0, volume), c.currentTime, 0.09);
      panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), c.currentTime, 0.09);
      source.playbackRate.setTargetAtTime(rate, c.currentTime, 0.15);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      gain.gain.cancelScheduledValues(c.currentTime);
      gain.gain.setTargetAtTime(0, c.currentTime, 0.012);
      source.stop(c.currentTime + 0.06);
      source.onended = () => { source.disconnect(); gain.disconnect(); panner.disconnect(); };
    },
  };
}

export function playWorldSound(name: "footstep" | "impact" | "collect", volume = 0.6, rate = 1, pan = 0) {
  if (!worldAudioActive() || useGame.getState().muted) return;
  const c = context;
  const buffer = buffers.get(name);
  if (!c || c.state !== "running" || !buffer || !worldEffects) return;
  const source = c.createBufferSource();
  const gain = c.createGain();
  const panner = c.createStereoPanner();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = volume;
  panner.pan.value = pan;
  source.connect(gain).connect(panner).connect(worldEffects);
  worldVoices.add(source);
  source.onended = () => { worldVoices.delete(source); source.disconnect(); gain.disconnect(); panner.disconnect(); };
  source.start();
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.06, delay = 0, slideTo?: number) {
  if (useGame.getState().muted) return;
  unlockAudio();
  const c = ac();
  if (!c || !effects) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(effects);
  o.onended = () => { o.disconnect(); g.disconnect(); };
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
  collect: () => playWorldSound("collect", 0.7),
};
