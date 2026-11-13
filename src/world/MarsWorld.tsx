"use client";

/**
 * PERSON 1: Mars World & Exploration.
 * The 3D canvas: terrain, sky, light, rocks, dust, landmarks, player + camera.
 * Person 2's machines/Ziggy are passed in as children.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { attachInput } from "./controls";
import { playerState } from "./playerState";
import Terrain from "./Terrain";
import Rocks from "./Rocks";
import Sky, { SKY_HORIZON, SUN_DIR } from "./Sky";
import { DustDevil, DustParticles } from "./Dust";
import Landmarks from "./Landmarks";
import Footprints from "./Footprints";
import Player from "./Player";

function Input() {
  const gl = useThree((s) => s.gl);
  useEffect(() => attachInput(gl.domElement), [gl]);
  return null;
}

/** Sun light whose shadow box follows the player → crisp shadows, cheap. */
function SunLight() {
  const light = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.set(playerState.x + SUN_DIR.x * 60, playerState.y + SUN_DIR.y * 60, playerState.z + SUN_DIR.z * 60);
    l.target.position.set(playerState.x, playerState.y, playerState.z);
    l.target.updateMatrixWorld();
  });
  return (
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
    />
  );
}

export default function MarsWorld({ children }: { children?: ReactNode }) {
  return (
    <Canvas shadows camera={{ fov: 55, near: 0.1, far: 900, position: [0, 8, 60] }} dpr={[1, 1.75]} gl={{ antialias: true }}>
      <Input />
      <fog attach="fog" args={[SKY_HORIZON, 45, 230]} />
      <hemisphereLight args={["#ffd9bd", "#7a3218", 1.0]} />
      <ambientLight intensity={0.15} />
      <SunLight />
      <Sky />
      <Terrain />
      <Rocks />
      <Landmarks />
      <DustParticles />
      <DustDevil start={[30, -20]} />
      <Footprints />
      <Player />
      {children}
    </Canvas>
  );
}
