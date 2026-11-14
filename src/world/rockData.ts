import { mulberry32 } from "./noise";
import { frostAmount, getHeight } from "./terrainData";
import { MAP_CENTER, MAP_RADIUS, PAD_RADIUS, SPAWN, ZONES } from "./zones";

export interface RockData {
  x: number; y: number; z: number; s: number; rx: number; ry: number; frost: boolean;
}

/** One deterministic source for both visible rocks and Rapier collision shapes. */
export const ROCK_DATA: RockData[] = (() => {
  const random = mulberry32(42);
  const keepClear: [number, number, number][] = [
    ...Object.values(ZONES).map(([x, z]) => [x, z, PAD_RADIUS + 2] as [number, number, number]),
    [SPAWN[0], SPAWN[1], PAD_RADIUS + 3],
  ];
  const rocks: RockData[] = [];
  while (rocks.length < 1100) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * (MAP_RADIUS + 25);
    const x = MAP_CENTER[0] + Math.cos(angle) * distance;
    const z = MAP_CENTER[1] + Math.sin(angle) * distance;
    if (keepClear.some(([cx, cz, radius]) => Math.hypot(x - cx, z - cz) < radius)) continue;
    const big = random() < 0.12;
    const s = big ? 1.6 + random() * 2.2 : 0.25 + random() * 0.9;
    rocks.push({ x, y: getHeight(x, z) + s * 0.25, z, s, rx: random() * 6, ry: random() * 6, frost: frostAmount(x, z) > 0.5 });
  }
  return rocks;
})();
