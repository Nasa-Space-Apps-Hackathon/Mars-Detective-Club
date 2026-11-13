"use client";

/**
 * ⚠️ PERSON 2 PLACEHOLDER (machines, scan interaction, Ziggy).
 * Person 2 replaces the primitive models with real GLB models, but keeps:
 *   - setNearArtifact(id | null) every frame (proximity)
 *   - startScan(id) on the E key
 *   - machines placed at ZONES, on getHeight()
 *   - addColliders() so the player can't walk through them
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { canMove, useGame } from "@/store/useGame";
import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import { addColliders, playerState } from "@/world/playerState";
import { getHeight } from "@/world/terrainData";
import { SCAN_RADIUS, ZONES } from "@/world/zones";

const metal = "#d9d4cc";
const gold = "#d6a43a";
const panel = "#2b3f75";

function VikingModel() {
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.6, 6]} />
        <meshStandardMaterial color={metal} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.2, 0.6, Math.sin(a) * 1.2]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 1.5]} />
            <meshStandardMaterial color={gold} />
          </mesh>
        );
      })}
      <mesh position={[0.4, 2.6, 0]} rotation={[0, 0, 0.5]} castShadow>
        <coneGeometry args={[0.7, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#eeeeee" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.2, 2.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      <mesh position={[-1.4, 1.2, 0.3]} rotation={[0, 0, -0.9]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.12]} />
        <meshStandardMaterial color={metal} />
      </mesh>
    </group>
  );
}

function OpportunityModel() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1, 0.5, 1.4]} />
        <meshStandardMaterial color={gold} flatShading />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.6, 0.06, 1.8]} />
        <meshStandardMaterial color={panel} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.8, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.2]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      <mesh position={[0, 2.4, 0.5]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.2]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      {[-0.6, 0, 0.6].map((z) =>
        [-0.65, 0.65].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.2, 10]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        )),
      )}
    </group>
  );
}

function PhoenixModel() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.4, 10]} />
        <meshStandardMaterial color={metal} flatShading />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.9, 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <circleGeometry args={[1, 10]} />
          <meshStandardMaterial color={panel} side={THREE.DoubleSide} metalness={0.5} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.9, 0.45, Math.sin(a) * 0.9]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.9]} />
            <meshStandardMaterial color={gold} />
          </mesh>
        );
      })}
      <mesh position={[0.3, 1.3, 1.3]} rotation={[0.8, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 1.8]} />
        <meshStandardMaterial color={metal} />
      </mesh>
      <mesh position={[0.3, 0.15, 1.9]} receiveShadow>
        <boxGeometry args={[1.2, 0.05, 0.6]} />
        <meshStandardMaterial color="#5a2a16" />
      </mesh>
    </group>
  );
}

const MODELS: Record<ArtifactId, () => React.JSX.Element> = {
  viking1: VikingModel,
  opportunity: OpportunityModel,
  phoenix: PhoenixModel,
};

function Machine({ id }: { id: ArtifactId }) {
  const [x, z] = ZONES[id];
  const y = getHeight(x, z);
  const solved = useGame((s) => s.evidence.includes(id));
  const near = useGame((s) => s.nearArtifact === id);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const Model = MODELS[id];

  useEffect(() => addColliders([{ x, z, r: 1.8 }]), [x, z]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * 0.8;
      ring.current.position.y = 4.2 + Math.sin(t * 2) * 0.2;
    }
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = solved ? 0.12 : 0.32 + Math.sin(t * 3) * 0.08;
  });
  const color = solved ? "#7CFF9B" : near ? "#FFFFFF" : "#5CE1E6";
  return (
    <group position={[x, y, z]}>
      <group rotation={[0, (x + z) * 0.1, 0]}>
        <Model />
      </group>
      <mesh ref={beam} position={[0, 30, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 60, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} fog={false} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 0]}>
        <torusGeometry args={[0.6, 0.06, 8, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[SCAN_RADIUS - 0.15, SCAN_RADIUS, 48]} />
        <meshBasicMaterial color={color} transparent opacity={near ? 0.75 : 0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Ziggy() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const tx = playerState.x + Math.sin(playerState.yaw + 1.1) * 1.5;
    const tz = playerState.z + Math.cos(playerState.yaw + 1.1) * 1.5;
    const k = 1 - Math.pow(0.02, Math.min(dt, 0.05));
    g.position.x += (tx - g.position.x) * k;
    g.position.z += (tz - g.position.z) * k;
    g.position.y = playerState.y + 2.3 + Math.sin(t * 2.5) * 0.18;
    g.rotation.y = playerState.yaw + Math.sin(t) * 0.3;
  });
  return (
    <group ref={ref}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial color="#f2f2f2" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.28]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshBasicMaterial color="#5CE1E6" />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.9, 0.03, 0.08]} />
        <meshStandardMaterial color="#ff8a3d" />
      </mesh>
    </group>
  );
}

/** Proximity check + E key → store. */
function ScanLogic() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE") return;
      const s = useGame.getState();
      if (s.nearArtifact && canMove()) s.startScan(s.nearArtifact);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useFrame(() => {
    let near: ArtifactId | null = null;
    for (const id of ARTIFACT_ORDER) {
      const [zx, zz] = ZONES[id];
      if (Math.hypot(playerState.x - zx, playerState.z - zz) < SCAN_RADIUS) near = id;
    }
    useGame.getState().setNearArtifact(near);
  });
  return null;
}

export default function StubArtifacts() {
  return (
    <>
      {ARTIFACT_ORDER.map((id) => (
        <Machine key={id} id={id} />
      ))}
      <Ziggy />
      <ScanLogic />
    </>
  );
}
