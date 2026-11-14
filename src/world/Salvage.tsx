"use client";

import { useGame } from "@/store/useGame";
import { useInteraction } from "@/lib/interaction";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getHeight } from "./terrainData";
import { playerState } from "./playerState";
import { SALVAGE, type SalvagePiece } from "./salvageData";

function ScrapPiece({ piece, selected }: { piece: SalvagePiece; selected: boolean }) {
  const debris = useRef<THREE.Group>(null);
  const locator = useRef<THREE.Mesh>(null);
  const metal = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }, dt) => {
    const interaction = useInteraction.getState();
    const progress = interaction.target === `salvage:${piece.id}` ? interaction.progress : 0;
    const lift = THREE.MathUtils.smoothstep(progress, 0.68, 1);
    if (debris.current) {
      const group = debris.current;
      group.position.y = THREE.MathUtils.damp(group.position.y, lift * 0.65, 16, dt);
      group.position.x = (playerState.x - piece.x) * lift * 0.2;
      group.position.z = (playerState.z - piece.z) * lift * 0.2;
      group.rotation.y = piece.rotation + lift * 0.55;
      group.scale.setScalar(piece.scale * (1 - lift * 0.3));
    }
    if (locator.current) {
      locator.current.position.y = 1.05 + Math.sin(clock.elapsedTime * 2.5 + piece.rotation) * 0.09;
      locator.current.rotation.y = clock.elapsedTime * 0.8 + piece.rotation;
      locator.current.scale.setScalar(selected ? 1.25 : 0.8);
    }
    if (metal.current) metal.current.emissiveIntensity = selected ? 0.18 + progress * 0.45 : 0;
  });
  return (
    <group position={[piece.x, getHeight(piece.x, piece.z) + 0.045, piece.z]}>
      <group ref={debris} rotation={[0, piece.rotation, 0]} scale={piece.scale}>
        {/* Creased metal skin, a broken solar panel or a discarded power coupling. */}
        <mesh position={[0, 0.13, 0]} rotation={[0.06, 0.08, -0.12]} castShadow>
          <boxGeometry args={[0.8, 0.13, 0.58]} />
          <meshStandardMaterial ref={metal} color="#ca8d55" metalness={0.7} roughness={0.56} emissive="#ffbf69" emissiveIntensity={0} />
        </mesh>
        <mesh position={[-0.27, 0.23, 0]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.29, 0.07, 0.59]} /><meshStandardMaterial color="#e1b889" metalness={0.7} roughness={0.6} />
        </mesh>
        {piece.variant === 0 && <group position={[0.04, 0.23, 0]} rotation={[0.08, 0, -0.1]}>
          <mesh castShadow><boxGeometry args={[0.47, 0.04, 0.41]} /><meshStandardMaterial color="#304f62" metalness={0.5} roughness={0.35} /></mesh>
          {[-0.13, 0, 0.13].map((z) => <mesh key={z} position={[0, 0.026, z]}><boxGeometry args={[0.44, 0.012, 0.012]} /><meshStandardMaterial color="#9bcbd0" metalness={0.6} roughness={0.35} /></mesh>)}
          <mesh position={[0.15, 0.03, 0]}><boxGeometry args={[0.012, 0.012, 0.39]} /><meshStandardMaterial color="#d1e8d7" /></mesh>
        </group>}
        {piece.variant === 1 && <group position={[0.06, 0.3, -0.02]} rotation={[0.2, 0.3, 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.21, 0.075, 6, 12]} /><meshStandardMaterial color="#77858a" metalness={0.8} roughness={0.4} /></mesh>
          <mesh position={[0.22, 0, 0]} castShadow><boxGeometry args={[0.25, 0.12, 0.14]} /><meshStandardMaterial color="#3e535a" metalness={0.6} roughness={0.5} /></mesh>
        </group>}
        {piece.variant === 2 && <group position={[0.06, 0.31, 0]} rotation={[0.15, 0.1, 0.2]}>
          {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.095, 0.095, 0.38, 8]} /><meshStandardMaterial color={x < 0 ? "#53646c" : "#d7b37b"} metalness={0.6} roughness={0.48} /></mesh>)}
          <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.38, 0.055, 0.12]} /><meshStandardMaterial color="#4c7567" metalness={0.25} roughness={0.7} /></mesh>
        </group>}
        {[-1, 1].map((sign) => <mesh key={sign} position={[sign * 0.3, 0.22, sign * 0.2]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.045, 6]} /><meshStandardMaterial color="#c6c8bd" metalness={0.8} roughness={0.4} /></mesh>)}
      </group>
      <mesh ref={locator} position={[0, 1.05, 0]}>
        <octahedronGeometry args={[0.12]} /><meshBasicMaterial color={selected ? "#f9f2c2" : "#baf4e4"} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, selected ? 0.72 : 0.68, 28]} /><meshBasicMaterial color="#baf4e4" transparent opacity={selected ? 0.8 : 0.23} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Randomly scattered, grounded scrap with three reusable industrial silhouettes. */
export default function Salvage() {
  const collected = useGame((s) => s.collectedSalvage);
  const nearest = useGame((s) => s.nearSalvage);
  return <>{SALVAGE.filter((piece) => !collected.includes(piece.id)).map((piece) => <ScrapPiece key={piece.id} piece={piece} selected={nearest === piece.id} />)}</>;
}
