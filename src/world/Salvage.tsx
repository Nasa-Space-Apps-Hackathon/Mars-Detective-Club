"use client";

import { useGame } from "@/store/useGame";
import { getHeight } from "./terrainData";
import { SALVAGE } from "./salvageData";

/** Small recyclable debris: amber fragments and a mint locator distinguish them from scenery. */
export default function Salvage() {
  const collected = useGame((s) => s.collectedSalvage);
  const nearest = useGame((s) => s.nearSalvage);
  return <>{SALVAGE.filter((piece) => !collected.includes(piece.id)).map((piece, index) => (
    <group key={piece.id} position={[piece.x, getHeight(piece.x, piece.z), piece.z]}>
      <mesh position={[0, 0.28, 0]} rotation={[0.2, index * 1.7, 0.3]} castShadow>
        <boxGeometry args={[0.65, 0.38, 0.5]} />
        <meshStandardMaterial color="#f4b66b" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh position={[0.18, 0.4, 0.08]} rotation={[0.3, index, 0.7]} castShadow>
        <boxGeometry args={[0.16, 0.36, 0.18]} /><meshStandardMaterial color="#52636c" />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <octahedronGeometry args={[nearest === piece.id ? 0.22 : 0.15]} /><meshBasicMaterial color="#baf4e4" />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.68, 0.74, 24]} /><meshBasicMaterial color="#baf4e4" transparent opacity={nearest === piece.id ? 0.85 : 0.4} depthWrite={false} />
      </mesh>
    </group>
  ))}</>;
}
