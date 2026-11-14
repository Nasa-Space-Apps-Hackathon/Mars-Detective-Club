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
  { id: "copper-whirl", x: 18, z: 10, drift: 11, phase: 0.4, radius: 12, height: 18, spin: 1 },
  { id: "canyon-dancer", x: -12, z: -65, drift: 16, phase: 2.8, radius: 14, height: 25, spin: -1 },
  { id: "polar-spinner", x: 30, z: -147, drift: 13, phase: 4.1, radius: 12, height: 21, spin: 1 },
  { id: "western-roamer", x: -99, z: -50, drift: 14, phase: 1.3, radius: 13, height: 23, spin: -1 },
  { id: "eastern-skipper", x: 96, z: -29, drift: 12, phase: 5.2, radius: 11, height: 17, spin: 1 },
];

const SHELTERS: readonly (readonly [number, number, number])[] = [
  [SPAWN[0], SPAWN[1], 19],
  ...Object.values(ZONES).map(([x, z]) => [x, z, PAD_RADIUS + 8] as const),
];

/** One simulation clock drives the visible funnel, wind forces and positional sound. */
export function getStormCenter(storm: DustDevil, time: number) {
  let x = storm.x + Math.sin(time * 0.17 + storm.phase) * storm.drift;
  let z = storm.z + Math.cos(time * 0.125 + storm.phase) * storm.drift * 0.8;
  // Slide around protected areas instead of sweeping a funnel through a mission pad.
  for (const [sx, sz, radius] of SHELTERS) {
    const dx = x - sx;
    const dz = z - sz;
    const distance = Math.hypot(dx, dz);
    if (distance < radius) {
      const angle = distance > 0.001 ? Math.atan2(dz, dx) : storm.phase;
      x = sx + Math.cos(angle) * radius;
      z = sz + Math.sin(angle) * radius;
    }
  }
  return { x, z };
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
