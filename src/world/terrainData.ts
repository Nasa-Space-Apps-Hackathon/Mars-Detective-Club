import * as THREE from "three";
import { createNoise2D } from "./noise";
import { MAP_CENTER, MAP_RADIUS, PAD_RADIUS, SPAWN, ZONES } from "./zones";

/**
 * The terrain is a pure function: getHeight(x, z).
 * The mesh, the player, rocks and Person 2's machines all use it,
 * so everything sits exactly on the ground.
 */

const noise = createNoise2D(1976);
const noise2 = createNoise2D(2004);

export interface Crater {
  x: number;
  z: number;
  r: number; // radius (m)
  depth: number;
}

// Eagle-style crater around Opportunity + decorative craters
export const CRATERS: Crater[] = [
  { x: ZONES.opportunity[0], z: ZONES.opportunity[1], r: 20, depth: 3.2 },
  { x: 30, z: -10, r: 9, depth: 1.6 },
  { x: -90, z: -100, r: 16, depth: 2.6 },
  { x: 95, z: -40, r: 12, depth: 2 },
  { x: -40, z: -130, r: 7, depth: 1.2 },
  { x: 40, z: -160, r: 10, depth: 1.8 },
  { x: -80, z: 10, r: 8, depth: 1.3 },
  { x: 10, z: -70, r: 5, depth: 0.9 },
];

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function craterOffset(x: number, z: number) {
  let h = 0;
  for (const c of CRATERS) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d > 1.6) continue;
    if (d < 1) h -= c.depth * (1 - d * d); // bowl
    // raised rim
    h += c.depth * 0.45 * Math.exp(-((d - 1) * (d - 1)) / 0.04);
  }
  return h;
}

/** Height without the flat pads. */
function rawHeight(x: number, z: number) {
  // rolling hills + small bumps
  let h = noise(x * 0.012, z * 0.012) * 3.2 + noise(x * 0.035, z * 0.035) * 1.1 + noise2(x * 0.11, z * 0.11) * 0.25;
  h += craterOffset(x, z);
  // mountains / mesas around the edge of the map
  const dEdge = Math.hypot(x - MAP_CENTER[0], z - MAP_CENTER[1]);
  const m = smoothstep(MAP_RADIUS - 8, MAP_RADIUS + 40, dEdge);
  if (m > 0) {
    const ridge = 1 - Math.abs(noise2(x * 0.02, z * 0.02));
    h += m * (18 + ridge * 22);
  }
  return h;
}

const PADS: { x: number; z: number; h: number }[] = [
  ...Object.values(ZONES).map(([x, z]) => ({ x, z, h: rawHeight(x, z) })),
  { x: SPAWN[0], z: SPAWN[1], h: rawHeight(SPAWN[0], SPAWN[1]) },
];

export function getHeight(x: number, z: number) {
  let h = rawHeight(x, z);
  for (const p of PADS) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < PAD_RADIUS + 7) {
      const w = 1 - smoothstep(PAD_RADIUS, PAD_RADIUS + 7, d);
      h = THREE.MathUtils.lerp(h, p.h, w);
    }
  }
  return h;
}

/** 0 = warm dusty plains, 1 = icy polar region (around Phoenix). */
export function frostAmount(x: number, z: number) {
  const base = smoothstep(-128, -165, z);
  const patchy = noise(x * 0.06 + 40, z * 0.06) * 0.35;
  return THREE.MathUtils.clamp(base + patchy * base, 0, 1);
}

/** Ground color for a vertex (low-poly, slightly varied). */
const C_SAND = new THREE.Color("#c8693c");
const C_RUST = new THREE.Color("#a84a26");
const C_DARK = new THREE.Color("#7a3518");
const C_LIGHT = new THREE.Color("#dd8a55");
const C_FROST = new THREE.Color("#efe6e4");
const C_CLIFF = new THREE.Color("#8e4123");

export function groundColor(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const n = noise2(x * 0.05, z * 0.05);
  out.copy(C_SAND).lerp(n > 0 ? C_LIGHT : C_RUST, Math.abs(n) * 0.8);
  // crater floors darker
  for (const c of CRATERS) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d < 0.85) out.lerp(C_DARK, 0.35 * (1 - d));
  }
  if (slope > 0.45 || h > 14) out.lerp(C_CLIFF, Math.min(1, (slope - 0.3) * 1.5 + Math.max(0, h - 14) * 0.03));
  const f = frostAmount(x, z);
  if (f > 0) out.lerp(C_FROST, f * (h > 14 ? 1 : 0.85));
  return out;
}
