import { PAD_RADIUS, SPAWN, ZONES } from "./zones";

/** Playful simulation weather, intentionally stronger than real Martian dust devils. */
export interface DustDevil {
  id: string;
  x: number;
  z: number;
  drift: number;
  phase: number;
  radius: number;
  height: number;
  spin: number;
}

export const STORMS: readonly DustDevil[] = [
  { id: "copper-whirl", x: 14, z: 17, drift: 2.8, phase: 0.4, radius: 12, height: 18, spin: 1 },
  { id: "canyon-dancer", x: -12, z: -65, drift: 4.2, phase: 2.8, radius: 14, height: 25, spin: -1 },
  { id: "polar-spinner", x: 30, z: -147, drift: 3.6, phase: 4.1, radius: 12, height: 21, spin: 1 },
];

export function getStormCenter(storm: DustDevil, time: number) {
  return {
    x: storm.x + Math.sin(time * 0.11 + storm.phase) * storm.drift,
    z: storm.z + Math.cos(time * 0.085 + storm.phase) * storm.drift,
  };
}

function smoothstep(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

export function sampleStorm(x: number, z: number, time: number) {
  let forceX = 0;
  let forceZ = 0;
  let lift = 0;
  let strength = 0;
  // A full mission scan radius is sheltered so the core science loop stays approachable.
  let shelter = smoothstep(10, 15, Math.hypot(x - SPAWN[0], z - SPAWN[1]));
  for (const [zx, zz] of Object.values(ZONES)) {
    shelter = Math.min(shelter, smoothstep(PAD_RADIUS + 2, PAD_RADIUS + 7, Math.hypot(x - zx, z - zz)));
  }
  if (shelter === 0) return { forceX, forceZ, lift, strength };
  for (const storm of STORMS) {
    const center = getStormCenter(storm, time);
    const dx = center.x - x;
    const dz = center.z - z;
    const distance = Math.hypot(dx, dz);
    const influence = (1 - smoothstep(2, storm.radius, distance)) * shelter;
    if (influence <= 0) continue;
    const nx = dx / Math.max(distance, 0.35);
    const nz = dz / Math.max(distance, 0.35);
    const inward = 14 * influence;
    const swirl = 17 * influence * storm.spin;
    forceX += nx * inward - nz * swirl;
    forceZ += nz * inward + nx * swirl;
    lift += (1 - smoothstep(2.5, 5.6, distance)) * 31 * shelter;
    strength = Math.max(strength, influence);
  }
  return { forceX, forceZ, lift, strength };
}
