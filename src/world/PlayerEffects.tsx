"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { canMove } from "@/store/useGame";
import type { RuntimeRef } from "./runtime";
import { groundHeight } from "./worldConfig";

/** Fixed pool: footprints, landing puffs and a contact ring without per-frame allocations. */
export default function PlayerEffects({ runtime }: { runtime: RuntimeRef }) {
  const dust = useRef<THREE.InstancedMesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const state = useRef({ cursor: 0, step: 0, lastLanding: 0, ringLife: 0 });
  const particles = useMemo(() => Array.from({ length: 42 }, () => ({
    pos: new THREE.Vector3(), velocity: new THREE.Vector3(), life: 0, size: 0,
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = runtime.current;
    const pool = state.current;
    const emit = (count: number, landing: boolean) => {
      for (let i = 0; i < count; i++) {
        const particle = particles[pool.cursor++ % particles.length];
        const angle = pool.cursor * 2.399;
        particle.pos.copy(s.position);
        particle.pos.y = groundHeight(s.position.x, s.position.z) + 0.06;
        particle.velocity.set(Math.sin(angle) * (landing ? 1.8 : 0.6), landing ? 0.85 : 0.35, Math.cos(angle) * (landing ? 1.8 : 0.6));
        particle.life = 1;
        particle.size = landing ? 0.14 : 0.075;
      }
    };
    if (canMove()) {
      pool.step += s.grounded ? s.speed * dt : 0;
      if (pool.step > 1.2) { pool.step = 0; emit(2, false); }
      if (s.landing > 0.65 && pool.lastLanding < s.landing - 0.1) {
        emit(12, true);
        pool.ringLife = 1;
        if (ring.current) ring.current.position.set(s.position.x, groundHeight(s.position.x, s.position.z) + 0.035, s.position.z);
      }
      pool.lastLanding = s.landing;
      pool.ringLife = Math.max(0, pool.ringLife - dt * 2.5);
    }
    if (ring.current) {
      ring.current.visible = pool.ringLife > 0;
      ring.current.scale.setScalar(0.3 + (1 - pool.ringLife) * 2.5);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = pool.ringLife * 0.24;
    }
    if (dust.current) {
      particles.forEach((particle, i) => {
        if (canMove()) {
          particle.life = Math.max(0, particle.life - dt * 1.5);
          particle.pos.addScaledVector(particle.velocity, dt);
          particle.velocity.y -= dt * 0.6;
        }
        dummy.position.copy(particle.pos);
        dummy.scale.setScalar(particle.size * Math.sin(particle.life * Math.PI * 0.85));
        dummy.updateMatrix();
        dust.current!.setMatrixAt(i, dummy.matrix);
      });
      dust.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={dust} args={[undefined, undefined, particles.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#e8b58a" transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.85, 1, 40]} />
        <meshBasicMaterial color="#f3cf9c" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </>
  );
}
