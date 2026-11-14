"use client";

/**
 * PERSON 1: Mars World & Exploration.
 * The 3D canvas: terrain, sky, light, rocks, dust, landmarks, player + camera.
 * Person 2's machines/Ziggy are passed in as children.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { playerState } from "./playerState";
import Terrain from "./Terrain";
import Rocks from "./Rocks";
import Sky, { SKY_HORIZON, SUN_DIR } from "./Sky";
import { DustParticles } from "./Dust";
import Landmarks from "./Landmarks";
import Footprints from "./Footprints";
import Player from "./Player";
import CameraRig from "./CameraRig";
import Environment from "./Environment";
import WorldColliders from "./WorldColliders";
import { createWorldRuntime } from "./runtime";
import DebugWorld from "./DebugWorld";
import { MARS_GRAVITY } from "./physics";
import Salvage from "./Salvage";
import CollectionEffects from "./CollectionEffects";
import WorldAudio from "./WorldAudio";
import { sampleDayCycle } from "./dayCycle";
import type { RuntimeRef } from "./runtime";

/** Sun light whose shadow box follows the player → crisp shadows, cheap. */
function SunLight({ runtime }: { runtime: RuntimeRef }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const hemisphere = useRef<THREE.HemisphereLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const scene = useThree((state) => state.scene);
  const colors = useRef({ dayFog: new THREE.Color(SKY_HORIZON), nightFog: new THREE.Color("#4b344b"), dayLight: new THREE.Color("#fff0dd"), nightLight: new THREE.Color("#a1b7e0") });
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const daylight = sampleDayCycle(runtime.current.simTime).light;
    l.intensity = 0.38 + daylight * 1.72;
    l.color.copy(colors.current.nightLight).lerp(colors.current.dayLight, daylight);
    if (hemisphere.current) hemisphere.current.intensity = 0.35 + daylight * 0.65;
    if (ambient.current) ambient.current.intensity = 0.12 + daylight * 0.03;
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(colors.current.nightFog).lerp(colors.current.dayFog, daylight);
    l.position.set(playerState.x + SUN_DIR.x * 60, playerState.y + SUN_DIR.y * 60, playerState.z + SUN_DIR.z * 60);
    l.target.position.set(playerState.x, playerState.y, playerState.z);
    l.target.updateMatrixWorld();
  });
  return (
    <><hemisphereLight ref={hemisphere} args={["#ffd9bd", "#7a3218", 1.0]} />
    <ambientLight ref={ambient} intensity={0.15} />
    <directionalLight
      ref={light}
      intensity={2.1}
      color="#fff0dd"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-40}
      shadow-camera-right={40}
      shadow-camera-top={40}
      shadow-camera-bottom={-40}
      shadow-camera-near={1}
      shadow-camera-far={160}
      shadow-bias={-0.0005}
      shadow-normalBias={0.04}
    /></>
  );
}

function WorldReady({ onReady }: { onReady?: () => void }) {
  useEffect(() => { onReady?.(); }, [onReady]);
  return null;
}

export default function MarsWorld({ children, onReady }: { children?: ReactNode; onReady?: () => void }) {
  const runtime = useRef(createWorldRuntime());
  return (
    <Canvas shadows camera={{ fov: 55, near: 0.1, far: 900, position: [0, 8, 60] }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }} style={{ touchAction: "none" }}>
      <fog attach="fog" args={[SKY_HORIZON, 45, 230]} />
      <SunLight runtime={runtime} />
      <Sky runtime={runtime} />
      <Terrain />
      <Rocks />
      <Landmarks />
      <Salvage />
      <CollectionEffects />
      <WorldAudio runtime={runtime} />
      <DustParticles />
      <Environment runtime={runtime} />
      <Footprints />
      <Suspense fallback={null}>
        <Physics gravity={[0, -MARS_GRAVITY, 0]} timeStep={1 / 60} interpolate>
          <WorldColliders />
          <Player runtime={runtime} />
          <WorldReady onReady={onReady} />
        </Physics>
      </Suspense>
      <CameraRig runtime={runtime} />
      <DebugWorld runtime={runtime} />
      {children}
    </Canvas>
  );
}
