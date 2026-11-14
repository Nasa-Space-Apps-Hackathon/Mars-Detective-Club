"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { playerState } from "./playerState";
import type { RuntimeRef } from "./runtime";
import { sampleDayCycle } from "./dayCycle";

export const SKY_HORIZON = "#e8a77a";
export const SUN_DIR = new THREE.Vector3(0.45, 0.55, -0.7).normalize();

/**
 * Butterscotch Mars sky (gradient dome) with a small pale sun.
 * Fun fact for the team: on Mars, sunsets are blue and daytime sky is tan!
 */
export default function Sky({ runtime }: { runtime: RuntimeRef }) {
  const group = useRef<THREE.Group>(null);
  const stars = useRef<THREE.PointsMaterial>(null);
  const colors = useMemo(() => ({ dayTop: new THREE.Color("#c98a62"), dayHorizon: new THREE.Color(SKY_HORIZON), dayBottom: new THREE.Color("#b5643c"), nightTop: new THREE.Color("#101b35"), nightHorizon: new THREE.Color("#4b344b"), nightBottom: new THREE.Color("#34243a") }), []);
  const starPositions = useMemo(() => {
    const positions = new Float32Array(360 * 3);
    let seed = 7963;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < positions.length; i += 3) {
      const angle = random() * Math.PI * 2;
      const y = 0.12 + random() * 0.87;
      const radius = Math.sqrt(1 - y * y) * 370;
      positions[i] = Math.cos(angle) * radius; positions[i + 1] = y * 370; positions[i + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#c98a62") },
          horizon: { value: new THREE.Color(SKY_HORIZON) },
          bottom: { value: new THREE.Color("#b5643c") },
          sunDir: { value: SUN_DIR },
          sunColor: { value: new THREE.Color("#fff6e6") },
          halo: { value: new THREE.Color("#c9d6e6") },
          sunVisibility: { value: 1 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom;
          uniform vec3 sunDir; uniform vec3 sunColor; uniform vec3 halo; uniform float sunVisibility;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.6)) : mix(horizon, bottom, clamp(-h * 4.0, 0.0, 1.0));
            float d = max(dot(normalize(vDir), sunDir), 0.0);
            col = mix(col, halo, pow(d, 12.0) * 0.45 * sunVisibility);
            col += sunColor * smoothstep(0.9993, 0.9997, d) * sunVisibility;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );

  // keep the sky centered on the player
  useFrame(() => {
    if (group.current) group.current.position.set(playerState.x, 0, playerState.z);
    const daylight = sampleDayCycle(runtime.current.simTime).light;
    material.uniforms.top.value.copy(colors.nightTop).lerp(colors.dayTop, daylight);
    material.uniforms.horizon.value.copy(colors.nightHorizon).lerp(colors.dayHorizon, daylight);
    material.uniforms.bottom.value.copy(colors.nightBottom).lerp(colors.dayBottom, daylight);
    material.uniforms.sunVisibility.value = daylight;
    if (stars.current) stars.current.opacity = (1 - daylight) * 0.8;
  });

  return (
    <group ref={group}>
      <mesh material={material} renderOrder={-1}>
        <sphereGeometry args={[400, 32, 16]} />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[starPositions, 3]} /></bufferGeometry>
        <pointsMaterial ref={stars} color="#f7e8dd" size={1.5} transparent opacity={0} depthWrite={false} fog={false} />
      </points>
      {/* Phobos & Deimos, Mars's two little moons */}
      <mesh position={[-160, 120, -260]}>
        <icosahedronGeometry args={[4.5, 1]} />
        <meshBasicMaterial color="#d9c3b0" fog={false} />
      </mesh>
      <mesh position={[190, 150, -210]}>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshBasicMaterial color="#e6d6c8" fog={false} />
      </mesh>
    </group>
  );
}
