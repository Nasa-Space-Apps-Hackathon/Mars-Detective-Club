"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { addColliders } from "./playerState";
import { getHeight } from "./terrainData";
import { LANDING_POD, POD_LEGS } from "./landingPod";

/** A sheltered exterior supply depot; the sealed hull is deliberately not enterable. */
function LandingPod() {
  const pod = LANDING_POD;
  const flag = useRef<THREE.Mesh>(null);
  useEffect(() => addColliders([{ x: pod.x, z: pod.z, r: pod.baseRadius }]), [pod]);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.12;
  });

  const textures = useMemo(() => {
    const badge = document.createElement("canvas");
    badge.width = badge.height = 128;
    const mark = badge.getContext("2d")!;
    mark.fillStyle = "#bd5429";
    mark.fillRect(0, 0, 128, 128);
    mark.strokeStyle = "#fff2d9";
    mark.lineWidth = 10;
    mark.beginPath(); mark.arc(56, 56, 26, 0, Math.PI * 2); mark.stroke();
    mark.lineWidth = 14; mark.lineCap = "round";
    mark.beginPath(); mark.moveTo(76, 76); mark.lineTo(100, 100); mark.stroke();
    const sign = document.createElement("canvas");
    sign.width = 512; sign.height = 128;
    const label = sign.getContext("2d")!;
    label.fillStyle = "#213d45"; label.fillRect(0, 0, 512, 128);
    label.fillStyle = "#fff1d4"; label.textAlign = "center";
    label.font = "bold 46px sans-serif"; label.fillText("SUPPLY DEPOT", 256, 57);
    label.fillStyle = "#91e5d2"; label.font = "26px sans-serif";
    label.fillText("SALVAGE  /  REPAIR KITS", 256, 103);
    const maps = [badge, sign].map((canvas) => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    });
    return { badge: maps[0], sign: maps[1] };
  }, []);
  useEffect(() => () => { textures.badge.dispose(); textures.sign.dispose(); }, [textures]);

  return (
    <group position={[pod.x, pod.y, pod.z]} rotation={[0, pod.rotation, 0]}>
      <mesh position={[0, pod.bodyCenterY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[pod.bodyTopRadius, pod.bodyBottomRadius, pod.bodyHeight, pod.segments]} />
        <meshStandardMaterial color="#e9e3d4" flatShading roughness={0.72} />
      </mesh>
      <mesh position={[0, pod.bodyCenterY + pod.bodyHeight / 2 + pod.noseHeight / 2, 0]} castShadow>
        <coneGeometry args={[pod.bodyTopRadius, pod.noseHeight, pod.segments]} />
        <meshStandardMaterial color="#c45a30" flatShading roughness={0.65} />
      </mesh>
      <mesh position={[0, pod.baseCenterY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[pod.baseRadius, pod.baseRadius, pod.baseHeight, pod.segments]} />
        <meshStandardMaterial color="#42545b" flatShading />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[2.73, 2.81, 0.18, pod.segments]} />
        <meshStandardMaterial color="#c45a30" flatShading />
      </mesh>
      {/* Recessed front window, raised above the trading console. */}
      <group position={[0, 3.2, 2.14]} rotation={[-0.264, 0, 0]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.73, 0.73, 0.12, 12]} /><meshStandardMaterial color="#405763" /></mesh>
        <mesh position={[0, 0, 0.09]}>
          <circleGeometry args={[0.61, 20]} /><meshStandardMaterial color="#6bcfce" emissive="#296f77" emissiveIntensity={0.55} metalness={0.25} roughness={0.2} />
        </mesh>
      </group>
      {/* Exterior terminal keeps every trade accessible from the ground. */}
      <group position={[0, 0, pod.terminalZ]}>
        <mesh position={[0, 0.72, 0]} castShadow><boxGeometry args={[1.3, 1.4, 0.65]} /><meshStandardMaterial color="#405763" roughness={0.7} /></mesh>
        <mesh position={[0, 1.25, 0.19]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[1.1, 0.64, 0.15]} /><meshStandardMaterial color="#223c46" />
        </mesh>
        <mesh position={[0, 1.28, 0.29]} rotation={[-0.35, 0, 0]}>
          <planeGeometry args={[0.9, 0.43]} /><meshBasicMaterial color="#9af2d9" />
        </mesh>
        <mesh position={[0, 0.73, 0.335]}><boxGeometry args={[0.78, 0.2, 0.025]} /><meshStandardMaterial color="#1f3037" /></mesh>
        <mesh position={[0, 2.07, -0.25]} castShadow><boxGeometry args={[2.5, 0.7, 0.12]} /><meshStandardMaterial color="#c45a30" /></mesh>
        <mesh position={[0, 2.07, -0.18]}><planeGeometry args={[2.35, 0.58]} /><meshBasicMaterial map={textures.sign} /></mesh>
        <mesh position={[0, 0.035, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.82, 32]} /><meshBasicMaterial color="#8ce8cc" transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      {POD_LEGS.map(({ x, z, angle }, index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.65, 0]} rotation={[Math.sin(angle) * 0.45, 0, -Math.cos(angle) * 0.45]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1.65, 8]} /><meshStandardMaterial color="#8a9b9e" flatShading />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow><cylinderGeometry args={[0.5, 0.55, 0.24, 8]} /><meshStandardMaterial color="#405763" /></mesh>
        </group>
      ))}
      {/* Side service panels break up the hull without increasing draw complexity much. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.35, 1.8, 0]} rotation={[0, side * Math.PI / 2, 0]}>
          <mesh castShadow><boxGeometry args={[1, 1.25, 0.15]} /><meshStandardMaterial color="#d2caba" /></mesh>
          {[0, 1, 2].map((slot) => <mesh key={slot} position={[0, slot * 0.18 - 0.18, 0.085]}><boxGeometry args={[0.7, 0.06, 0.025]} /><meshStandardMaterial color="#5c6b6c" /></mesh>)}
        </group>
      ))}
      <group position={[-4.3, 0, 0.6]}>
        <mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 4, 8]} /><meshStandardMaterial color="#d9d4cc" /></mesh>
        <mesh ref={flag} position={[0.75, 3.45, 0]}><planeGeometry args={[1.5, 1]} /><meshStandardMaterial map={textures.badge} side={THREE.DoubleSide} /></mesh>
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
