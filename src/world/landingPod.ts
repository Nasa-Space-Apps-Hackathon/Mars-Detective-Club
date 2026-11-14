import { getHeight } from "./terrainData";
import { SPAWN } from "./zones";

/** Shared dimensions: the depot mesh, Rapier hull and shop use the same footprint. */
export const LANDING_POD = {
  x: SPAWN[0] + 7,
  z: SPAWN[1] - 2,
  y: getHeight(SPAWN[0] + 7, SPAWN[1] - 2),
  rotation: -0.6,
  bodyBottomRadius: 2.8,
  bodyTopRadius: 1.8,
  bodyHeight: 3.7,
  bodyCenterY: 2.5,
  baseRadius: 2.9,
  baseCenterY: 0.45,
  baseHeight: 0.8,
  noseHeight: 1.5,
  segments: 12,
  legRadius: 3.25,
  terminalZ: 3.3,
};

export function podLocalToWorld(x: number, y: number, z: number) {
  const cosine = Math.cos(LANDING_POD.rotation);
  const sine = Math.sin(LANDING_POD.rotation);
  return {
    x: LANDING_POD.x + cosine * x + sine * z,
    y: LANDING_POD.y + y,
    z: LANDING_POD.z - sine * x + cosine * z,
  };
}

/** Stand here to trade, in front of the console rather than inside its collider. */
export const SHIP_TERMINAL = {
  ...podLocalToWorld(0, 0, LANDING_POD.terminalZ + 0.95),
  radius: 3,
};

export const POD_LEGS = [0, 1, 2, 3].map((index) => {
  const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
  return { x: Math.cos(angle) * LANDING_POD.legRadius, z: Math.sin(angle) * LANDING_POD.legRadius, angle };
});

/** Convex vertices match Three's cylinder/cone orientation, including the taper. */
export function podHullVertices() {
  const vertices: number[] = [];
  const { segments, bodyBottomRadius, bodyTopRadius, bodyCenterY, bodyHeight, noseHeight } = LANDING_POD;
  for (let index = 0; index < segments; index++) {
    const angle = index / segments * Math.PI * 2;
    for (const [radius, y] of [
      [bodyBottomRadius, bodyCenterY - bodyHeight / 2],
      [bodyTopRadius, bodyCenterY + bodyHeight / 2],
    ]) vertices.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
  }
  vertices.push(0, bodyCenterY + bodyHeight / 2 + noseHeight, 0);
  return Float32Array.from(vertices);
}
