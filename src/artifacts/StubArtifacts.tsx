"use client";

/**
 * NASA Viking/Opportunity models and a stylized Phoenix representation.
 * Person 2 replaces the primitive models with real GLB models, but keeps:
 *   - setNearArtifact(id | null) every frame (proximity)
 *   - startScan(id) on the E key
 *   - machines placed at ZONES, on getHeight()
 *   - addColliders() so the player can't walk through them
 */

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "@/store/useGame";
import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import { addColliders } from "@/world/playerState";
import { getHeight } from "@/world/terrainData";
import { SCAN_RADIUS, ZONES } from "@/world/zones";

const metal = "#d9d4cc";
const gold = "#d6a43a";
const panel = "#2b3f75";

function NasaModel({ id }: { id: "viking1" | "opportunity" }) {
  const { scene } = useGLTF(`/models/${id}.glb`, "/draco/");
  const model = useMemo(() => {
    const object = scene.clone(true);
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = (id === "viking1" ? 2 : 1.5) / size.y;
    object.scale.multiplyScalar(scale);
    object.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    return object;
  }, [scene, id]);
  return <primitive object={model} />;
}

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
        {id === "phoenix" ? <Model /> : <Suspense fallback={<Model />}><NasaModel id={id} /></Suspense>}
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

export default function StubArtifacts() {
  return <>{ARTIFACT_ORDER.map((id) => <Machine key={id} id={id} />)}</>;
}
