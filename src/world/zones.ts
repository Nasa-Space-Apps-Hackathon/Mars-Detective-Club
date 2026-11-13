import type { ArtifactId, Vec2 } from "@/store/types";

/**
 * PLACEHOLDER positions. Person 1 owns the real map and replaces these values.
 * The HUD compass reads ZONES, so keep the export name + shape.
 */
export const ZONES: Record<ArtifactId, Vec2> = {
  viking1: [-14, -22],
  opportunity: [20, -38],
  phoenix: [-6, -62],
};

export const SPAWN: Vec2 = [0, 6];
export const SCAN_RADIUS = 4.5;
