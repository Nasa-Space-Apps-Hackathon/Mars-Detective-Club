"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./noise";
import { playerState } from "./playerState";
import { getHeight } from "./terrainData";

/** Floating dust specks around the player (wraps around so it never runs out). */
export function DustParticles({ count = 700, range = 60 }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const rnd = mulberry32(11);
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rnd() - 0.5) * range;
      positions[i * 3 + 1] = rnd() * 14;
      positions[i * 3 + 2] = (rnd() - 0.5) * range;
      speeds[i] = 0.5 + rnd() * 1.5;
    }
    return { positions, speeds };
  }, [count, range]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const p = pts.geometry.attributes.position as THREE.BufferAttribute;
    const half = range / 2;
    for (let i = 0; i < count; i++) {
      let x = p.getX(i) + speeds[i] * dt * 1.6; // wind blows east
      let y = p.getY(i) + Math.sin(x * 0.3 + i) * dt * 0.3;
      if (x > half) x -= range;
      if (y > 14) y = 0;
      if (y < 0) y = 14;
      p.setXY(i, x, y);
    }
    p.needsUpdate = true;
    // follow the player in big steps so specks don't slide with the camera
    pts.position.set(Math.round(playerState.x / range) * range, playerState.y, Math.round(playerState.z / range) * range);
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f1c9a5" size={0.055} transparent opacity={0.6} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/** A friendly wandering dust devil (real Mars weather!). */
export function DustDevil({ start = [40, 0] as [number, number] }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const x = start[0] + Math.sin(t * 0.05) * 60;
    const z = start[1] + Math.sin(t * 0.037 + 1) * 70 - 60;
    if (group.current) group.current.position.set(x, getHeight(x, z), z);
    if (spin.current) spin.current.rotation.y = t * 2.5;
  });
  return (
    <group ref={group}>
      <group ref={spin}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.sin(i * 1.7) * 0.4, 3 + i * 3.2, Math.cos(i * 1.7) * 0.4]}>
            <cylinderGeometry args={[1.2 + i * 1.1, 0.8 + i * 0.9, 3.4, 10, 1, true]} />
            <meshBasicMaterial color="#e2a274" transparent opacity={0.16 - i * 0.025} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
