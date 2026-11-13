import type { ArtifactId, Vec2 } from "@/store/types";

/**
 * MAP LAYOUT (Person 1 owns). World units = meters. Forward/north = -Z.
 *
 *            Phoenix (icy north)  ← polar frost biome
 *                    ▲
 *      Opportunity (inside a small "Eagle" crater, east)
 *                    ▲
 *      Viking 1 (rocky plains, west)
 *                    ▲
 *            Landing pod (spawn, south)
 *
 * Walk time at normal speed (7 m/s): ~13–20 s between machines.
 * The HUD compass and Person 2's machines read these values, so keep the export names.
 */
export const ZONES: Record<ArtifactId, Vec2> = {
  viking1: [-52, -38],
  opportunity: [62, -104],
  phoenix: [-18, -178],
};

export const SPAWN: Vec2 = [0, 42];
export const SCAN_RADIUS = 5;

/** Flat ground radius around each machine / the spawn (so models sit nicely). */
export const PAD_RADIUS = 9;

/** Player can't walk past this distance from the map center. */
export const MAP_CENTER: Vec2 = [0, -70];
export const MAP_RADIUS = 150;
