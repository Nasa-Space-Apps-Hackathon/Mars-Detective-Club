import { ROCK_DATA } from "./rockData";

export const TOOLBOX_COST = 6;
export const SALVAGE_RADIUS = 2.5;

/** Hand placed along the first expedition; move away from solid scenery deterministically. */
const positions = [[-5, 36], [-11, 28], [-18, 19], [-24, 10], [-32, 0], [-39, -10], [-45, -24], [-57, -31], [-60, -42], [-46, -46], [-36, -34], [-30, -21]];

export const SALVAGE = positions.map(([startX, startZ], index) => {
  let x = startX;
  let z = startZ;
  for (let attempt = 0; attempt < 24; attempt++) {
    if (!ROCK_DATA.some((rock) => rock.s > 0.55 && Math.hypot(x - rock.x, z - rock.z) < rock.s + 1.6)) break;
    const angle = attempt * 2.4;
    x = startX + Math.cos(angle) * (2 + attempt * 0.4);
    z = startZ + Math.sin(angle) * (2 + attempt * 0.4);
  }
  return { id: `salvage-${index + 1}`, x, z };
});
