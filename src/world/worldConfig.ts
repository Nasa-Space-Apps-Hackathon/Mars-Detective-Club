import { ROCK_DATA } from "./rockData";
import { MAP_CENTER, MAP_RADIUS } from "./zones";

// Compatibility for the upgraded movement, camera and effects. The original map remains authoritative.
export { getHeight as groundHeight } from "./terrainData";
export const WORLD_BOUNDS = {
  minX: MAP_CENTER[0] - MAP_RADIUS, maxX: MAP_CENTER[0] + MAP_RADIUS,
  minZ: MAP_CENTER[1] - MAP_RADIUS, maxZ: MAP_CENTER[1] + MAP_RADIUS,
};
export const ROCKS = ROCK_DATA.map((rock) => ({
  pos: [rock.x, rock.y, rock.z] as [number, number, number], s: rock.s, rot: rock.ry,
}));
