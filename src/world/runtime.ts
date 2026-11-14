import { Vector3 } from "three";
import type { MutableRefObject } from "react";
import { SPAWN } from "./zones";
import { groundHeight } from "./worldConfig";

/** Shared frame state; keep high-frequency physics updates outside React/Zustand. */
export interface WorldRuntime {
  position: Vector3;
  velocity: Vector3;
  heading: number;
  orbitYaw: number;
  orbitPitch: number;
  cameraDistance: number;
  grounded: boolean;
  speed: number;
  wind: number;
  landing: number;
  scanning: number;
  simTime: number;
}

export type RuntimeRef = MutableRefObject<WorldRuntime>;

export function createWorldRuntime(): WorldRuntime {
  return {
    position: new Vector3(SPAWN[0], groundHeight(...SPAWN), SPAWN[1]),
    velocity: new Vector3(),
    heading: Math.PI,
    orbitYaw: Math.PI,
    orbitPitch: 0.4,
    cameraDistance: 8,
    grounded: true,
    speed: 0,
    wind: 0,
    landing: 0,
    scanning: 0,
    simTime: 0,
  };
}
