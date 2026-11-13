/**
 * Live player state, updated every frame by Person 1's <Player/>.
 * Read it inside useFrame (no React re-renders), e.g. Person 2's
 * proximity check and Ziggy following the player.
 *
 * (The store's setPlayer() is also called ~10×/s for the HUD compass.)
 */
export const playerState = {
  x: 0,
  y: 0,
  z: 0,
  yaw: Math.PI, // facing -Z (north, towards the machines)
  speed: 0,
  grounded: true,
};

/** Dev/testing: set this and the Player jumps there on the next frame. */
export const teleport: { to: [number, number] | null } = { to: null };

/** Circle colliders on the XZ plane (rocks, machines…). Anyone can add. */
export interface Collider {
  x: number;
  z: number;
  r: number;
}
export const colliders: Collider[] = [];

export function addColliders(list: Collider[]) {
  colliders.push(...list);
  return () => {
    for (const c of list) {
      const i = colliders.indexOf(c);
      if (i >= 0) colliders.splice(i, 1);
    }
  };
}
