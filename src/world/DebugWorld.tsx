"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useGame } from "@/store/useGame";
import { getHeight } from "./terrainData";
import { getStormCenter, STORMS } from "./weather";
import { ROCK_DATA } from "./rockData";
import type { RuntimeRef } from "./runtime";
import { SALVAGE } from "./salvageData";
import { LANDING_POD, SHIP_TERMINAL } from "./landingPod";
import { useInteraction } from "@/lib/interaction";
import { sampleDayCycle } from "./dayCycle";

/** Opt-in diagnostics for browser playtests, matching the existing ?dev=1 panel. */
export default function DebugWorld({ runtime }: { runtime: RuntimeRef }) {
  const scene = useThree((s) => s.scene);
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
          salvage: game.salvage, toolbox: game.toolbox, repaired: game.repaired,
          collectedSalvage: game.collectedSalvage, nearSalvage: game.nearSalvage, nearShip: game.nearShip,
          evidence: game.evidence, repairMission: game.repairMission,
          interaction: useInteraction.getState(),
          daylight: sampleDayCycle(state.simTime),
          pose: {
            headPitch: scene.getObjectByName("pebble-helmet")?.rotation.x,
            torsoPitch: scene.getObjectByName("pebble-torso")?.rotation.x,
            rightArmPitch: scene.getObjectByName("pebble-right-arm")?.rotation.x,
          },
          storms: STORMS.map((storm) => getStormCenter(storm, state.simTime)),
        };
      },
      rocks: () => ROCK_DATA.filter((rock) => rock.s > 1.6),
      supplies: () => ({ pieces: SALVAGE, ship: LANDING_POD, terminal: SHIP_TERMINAL }),
      teleport: (x: number, z: number, y?: number) => window.dispatchEvent(new CustomEvent("mars:teleport", { detail: { x, z, y } })),
      setTime: (seconds: number) => { if (Number.isFinite(seconds) && seconds >= 0) runtime.current.simTime = seconds; },
    } });
    return () => { Reflect.deleteProperty(window, "__marsDebug"); };
  }, [runtime, scene]);
  return null;
}
