import { LANDING_POD, SHIP_TERMINAL } from "./landingPod";
import { mulberry32 } from "./noise";
import { ROCK_DATA } from "./rockData";
import { getHeight } from "./terrainData";
import { MAP_CENTER, MAP_RADIUS, PAD_RADIUS, SPAWN, ZONES } from "./zones";

export const TOOLBOX_COST = 6;
export const SALVAGE_RADIUS = 2.5;

export interface SalvagePiece {
  id: string;
  x: number;
  z: number;
  rotation: number;
  scale: number;
  variant: number;
}

/** Seeded scatter stays stable through renders/reset, so collected IDs keep their meaning. */
export const SALVAGE: SalvagePiece[] = (() => {
  const random = mulberry32(24061976);
  const pieces: SalvagePiece[] = [];
  const routes = [
    { from: SPAWN, to: ZONES.viking1, count: 14, width: 20 },
    { from: ZONES.viking1, to: ZONES.opportunity, count: 6, width: 27 },
    { from: ZONES.opportunity, to: ZONES.phoenix, count: 4, width: 24 },
  ];
  const isClear = (x: number, z: number) => {
    if (Math.hypot(x - MAP_CENTER[0], z - MAP_CENTER[1]) > MAP_RADIUS - 15) return false;
    if (Object.values(ZONES).some(([zx, zz]) => Math.hypot(x - zx, z - zz) < PAD_RADIUS + 3)) return false;
    if (Math.hypot(x - LANDING_POD.x, z - LANDING_POD.z) < 8) return false;
    if (Math.hypot(x - SHIP_TERMINAL.x, z - SHIP_TERMINAL.z) < SHIP_TERMINAL.radius + 2) return false;
    if (ROCK_DATA.some((rock) => rock.s > 0.55 && Math.hypot(x - rock.x, z - rock.z) < rock.s + 1.6)) return false;
    if (pieces.some((piece) => Math.hypot(x - piece.x, z - piece.z) < 4)) return false;
    // Avoid placing a collectible on a steep crater wall.
    const slopeX = (getHeight(x + 0.6, z) - getHeight(x - 0.6, z)) / 1.2;
    const slopeZ = (getHeight(x, z + 0.6) - getHeight(x, z - 0.6)) / 1.2;
    return Math.hypot(slopeX, slopeZ) < 0.65;
  };
  for (const route of routes) {
    let placed = 0;
    for (let attempt = 0; placed < route.count && attempt < 2400; attempt++) {
      // Random lateral spread breaks the old evenly spaced, single-file trail.
      const t = 0.06 + random() * 0.88;
      const dx = route.to[0] - route.from[0];
      const dz = route.to[1] - route.from[1];
      const distance = Math.hypot(dx, dz);
      const offset = (random() - 0.5) * route.width;
      const x = route.from[0] + dx * t - dz / distance * offset;
      const z = route.from[1] + dz * t + dx / distance * offset;
      if (!isClear(x, z)) continue;
      pieces.push({ id: `salvage-${pieces.length + 1}`, x, z, rotation: random() * Math.PI * 2, scale: 0.85 + random() * 0.3, variant: Math.floor(random() * 3) });
      placed++;
    }
  }
  return pieces;
})();
