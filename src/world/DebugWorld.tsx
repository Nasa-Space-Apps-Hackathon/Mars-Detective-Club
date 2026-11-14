"use client";

import { useEffect } from "react";
import { useGame } from "@/store/useGame";
import { getHeight } from "./terrainData";
import { getStormCenter, STORMS } from "./weather";
import { ROCK_DATA } from "./rockData";
import type { RuntimeRef } from "./runtime";

/** Opt-in diagnostics for browser playtests, matching the existing ?dev=1 panel. */
export default function DebugWorld({ runtime }: { runtime: RuntimeRef }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("dev") !== "1") return;
    Object.assign(window, { __marsDebug: {
      explore: () => useGame.setState({ phase: "explore", showControls: false, paused: false, journalOpen: false }),
      snapshot: () => {
        const state = runtime.current;
        const game = useGame.getState();
        return {
          position: state.position.toArray(), velocity: state.velocity.toArray(),
          grounded: state.grounded, wind: state.wind, landing: state.landing, scanning: state.scanning,
          heading: state.heading, orbitYaw: state.orbitYaw, cameraDistance: state.cameraDistance,
          speed: state.speed, time: state.simTime, ground: getHeight(state.position.x, state.position.z),
          phase: game.phase, near: game.nearArtifact, paused: game.paused,
          storms: STORMS.map((storm) => getStormCenter(storm, state.simTime)),
        };
      },
      rocks: () => ROCK_DATA.filter((rock) => rock.s > 1.6),
      teleport: (x: number, z: number, y?: number) => window.dispatchEvent(new CustomEvent("mars:teleport", { detail: { x, z, y } })),
    } });
    return () => { Reflect.deleteProperty(window, "__marsDebug"); };
  }, [runtime]);
  return null;
}
