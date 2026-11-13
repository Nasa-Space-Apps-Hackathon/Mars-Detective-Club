"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { addColliders } from "./playerState";
import { getHeight } from "./terrainData";
import { SPAWN } from "./zones";

/** The Detective Club landing pod at the spawn point + its flag. */
function LandingPod() {
  const [x, z] = SPAWN;
  const px = x + 7;
  const pz = z - 2;
  const y = getHeight(px, pz);
  const flag = useRef<THREE.Mesh>(null);

  useEffect(() => addColliders([{ x: px, z: pz, r: 2.4 }]), [px, pz]);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.12;
  });

  const badge = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c1440e";
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#fff";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(56, 56, 26, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 14;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(76, 76);
    g.lineTo(100, 100);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <group position={[px, y, pz]} rotation={[0, -0.6, 0]}>
      {/* capsule body */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.9, 2.4, 8]} />
        <meshStandardMaterial color="#eae6df" flatShading />
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <coneGeometry args={[1.1, 0.9, 8]} />
        <meshStandardMaterial color="#c1440e" flatShading />
      </mesh>
      <mesh position={[0, 1.8, 1.55]} rotation={[-0.42, 0, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial color="#5ce1e6" emissive="#2aa6ab" emissiveIntensity={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.9, 0.35, Math.sin(a) * 1.9]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.1]} />
            <meshStandardMaterial color="#9aa0ad" />
          </mesh>
        );
      })}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[1.9, 1.7, 0.4, 8]} />
        <meshStandardMaterial color="#6d7180" flatShading />
      </mesh>
      {/* flag */}
      <group position={[-3, 0, 1.5]}>
        <mesh position={[0, 1.7, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 3.4]} />
          <meshStandardMaterial color="#d9d4cc" />
        </mesh>
        <mesh ref={flag} position={[0.55, 3, 0]}>
          <planeGeometry args={[1.1, 0.8]} />
          <meshStandardMaterial map={badge} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Small signposts pointing the way on the first walk. */
function Signpost({ x, z, rot, label }: { x: number; z: number; rot: number; label: string }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#3b2414";
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#fff6e8";
    g.font = "bold 30px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 128, 34);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [label]);
  return (
    <group position={[x, getHeight(x, z), z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.12, 1.8, 0.12]} />
        <meshStandardMaterial color="#5a3820" />
      </mesh>
      <mesh position={[0, 1.6, 0.07]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Landmarks() {
  return (
    <>
      <LandingPod />
      <Signpost x={-4} z={30} rot={0.5} label="← Viking 1" />
    </>
  );
}
