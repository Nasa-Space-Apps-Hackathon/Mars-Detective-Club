"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { attachGameAudio, createSoundLoop, playWorldSound, worldAudioActive, type SoundLoop } from "@/lib/sfx";
import { useGame } from "@/store/useGame";
import type { RuntimeRef } from "./runtime";
import { STORMS, getStormCenter } from "./weather";
import { groundHeight } from "./worldConfig";

/** Pebble is the listener, even when the orbit camera is far behind the suit. */
export function stormAudibility(distance: number) {
  const t = Math.max(0, Math.min(1, (distance - 5) / 35));
  const fade = 1 - t * t * (3 - 2 * t);
  return fade * fade;
}

export default function WorldAudio({ runtime }: { runtime: RuntimeRef }) {
  const loops = useRef(new Map<string, SoundLoop>());
  const stride = useRef({ phase: Math.PI * 0.65, foot: 1, grounded: true, velocityY: 0, landing: 0, lastTime: 0, lastImpact: -1 });

  useEffect(() => {
    const detach = attachGameAudio();
    const activeLoops = loops.current;
    const stop = () => { activeLoops.forEach((loop) => loop.stop()); activeLoops.clear(); };
    const unsubscribe = useGame.subscribe(() => { if (!worldAudioActive() || useGame.getState().muted) stop(); });
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { stop(); unsubscribe(); detach(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useFrame((_, delta) => {
    const s = runtime.current;
    const gait = stride.current;
    const active = worldAudioActive() && !useGame.getState().muted;
    const dt = Math.min(delta, 0.05);
    if (!active) {
      gait.phase = Math.PI * 0.65;
      gait.grounded = s.grounded;
      gait.velocityY = s.velocity.y;
      gait.landing = s.landing;
      return;
    }
    if (s.simTime < gait.lastTime) {
      gait.phase = Math.PI * 0.65;
      gait.lastImpact = -1;
      gait.grounded = s.grounded;
      gait.landing = s.landing;
    }
    gait.lastTime = s.simTime;

    for (const storm of STORMS) {
      const center = getStormCenter(storm, s.simTime);
      const dx = center.x - s.position.x;
      const dz = center.z - s.position.z;
      const dy = groundHeight(center.x, center.z) + 2 - (s.position.y + 1.5);
      const intensity = stormAudibility(Math.hypot(dx, dy, dz));
      let loop = loops.current.get(storm.id);
      if (intensity <= 0) {
        loop?.stop();
        loops.current.delete(storm.id);
        continue;
      }
      if (!loop) {
        loop = createSoundLoop("wind", storm.phase * 3.7) ?? undefined;
        if (loop) loops.current.set(storm.id, loop);
      }
      // Dot the source direction with the camera's right vector for stereo placement.
      const pan = (-Math.cos(s.orbitYaw) * dx + Math.sin(s.orbitYaw) * dz) / Math.max(1, Math.hypot(dx, dz));
      loop?.set(intensity * 0.42, pan * 0.85, 0.96 + Math.min(1, intensity) * 0.08);
    }

    let fan = loops.current.get("ziggy");
    if (!fan) {
      fan = createSoundLoop("fan") ?? undefined;
      if (fan) loops.current.set("ziggy", fan);
    }
    // Keep the motor audible at rest, then make room for each walking contact.
    const fanVolume = s.grounded && s.speed > 0.65 ? 0.24 : 0.38;
    fan?.set(fanVolume, -0.3, 1 + Math.min(1, s.speed / 11) * 0.045);

    const landed = (!gait.grounded && s.grounded) || (s.landing > gait.landing + 0.12);
    const impactSpeed = Math.max(-gait.velocityY, s.landing * 10);
    if (landed && impactSpeed > 1.8 && s.simTime - gait.lastImpact > 0.18) {
      const weight = Math.max(0, Math.min(1, impactSpeed / 14));
      playWorldSound("impact", 0.25 + weight * 0.65, 1.06 - weight * 0.2);
      gait.lastImpact = s.simTime;
      gait.phase = 0;
    }
    if (s.grounded && s.speed > 0.65 && s.wind < 0.35) {
      const run = Math.max(0, Math.min(1, (s.speed - 6.5) / 4.5));
      // Match the articulated legs: each half stride is one ground contact.
      gait.phase += Math.min(s.speed, 6.5) * (1.35 + run * 0.4) * dt;
      if (gait.phase >= Math.PI) {
        gait.phase %= Math.PI;
        gait.foot *= -1;
        playWorldSound("footstep", 0.36 + run * 0.18, 0.94 + Math.random() * 0.12 + run * 0.06, gait.foot * 0.08);
      }
    } else gait.phase = Math.PI * 0.65;
    gait.grounded = s.grounded;
    gait.velocityY = s.velocity.y;
    gait.landing = s.landing;
  });

  return null;
}
