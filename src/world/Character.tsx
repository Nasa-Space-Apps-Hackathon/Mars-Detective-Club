"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/store/useGame";
import { ZONES } from "./zones";
import type { RuntimeRef } from "./runtime";

const suit = "#f2ede1";
const orange = "#ef874c";
const joints = "#424e59";

/** A small articulated suit: joints follow movement state instead of a looping bounce. */
export default function Character({ runtime }: { runtime: RuntimeRef }) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftKnee = useRef<THREE.Group>(null);
  const rightKnee = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const rightElbow = useRef<THREE.Group>(null);
  const scanner = useRef<THREE.Group>(null);
  const scannerRing = useRef<THREE.Mesh>(null);
  const scanBeam = useRef<THREE.Mesh>(null);
  const ziggy = useRef<THREE.Group>(null);
  const propeller = useRef<THREE.Group>(null);
  const thruster = useRef<THREE.Mesh>(null);
  const animation = useRef({ stride: 0, gait: 0, scan: 0, lean: 0, tumble: 0 });
  const temp = useMemo(() => new THREE.Vector3(), []);
  const beamDirection = useMemo(() => new THREE.Vector3(), []);
  const beamUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = runtime.current;
    const a = animation.current;
    const active = useGame.getState();
    const frozen = active.paused || active.journalOpen || active.showControls;
    const t = s.simTime;
    const scanTarget = s.scanning > 0 ? Math.sin(Math.min(s.scanning * 1.4, 1) * Math.PI * 0.5) : 0;
    a.scan = THREE.MathUtils.damp(a.scan, scanTarget, 13, dt);
    a.gait = THREE.MathUtils.damp(a.gait, s.grounded ? Math.min(s.speed / 6, 1) : 0, 12, dt);
    if (!frozen) a.stride += s.speed * dt * 2.25;
    const step = Math.sin(a.stride);
    const falling = !s.grounded && s.velocity.y < -1;
    const rising = !s.grounded && s.velocity.y > 0.5;
    const airborne = s.grounded ? 0 : 1;
    const squish = Math.sin(s.landing * Math.PI) * Math.min(s.landing * 2, 1);
    a.lean = THREE.MathUtils.damp(a.lean, s.speed * 0.009, 9, dt);
    a.tumble = THREE.MathUtils.damp(a.tumble, s.wind > 0.55 && !s.grounded ? 0.45 : 0, 7, dt);
    if (root.current) {
      root.current.position.copy(s.position);
      root.current.rotation.y = s.heading;
    }
    if (hips.current) {
      hips.current.position.y = 0.82 - squish * 0.16 + Math.abs(step) * a.gait * 0.025;
      hips.current.rotation.z = step * a.gait * 0.025;
    }
    if (torso.current) {
      torso.current.rotation.x = a.lean + squish * 0.2 - (falling ? 0.12 : 0);
      torso.current.rotation.z = Math.sin(t * 4) * a.tumble;
    }
    const upperLeft = step * 0.48 * a.gait + (rising ? -0.45 : falling ? 0.2 : 0) - squish * 0.35;
    const upperRight = -step * 0.48 * a.gait + (rising ? -0.2 : falling ? -0.13 : 0) - squish * 0.35;
    if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.damp(leftLeg.current.rotation.x, upperLeft, 14, dt);
    if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.damp(rightLeg.current.rotation.x, upperRight, 14, dt);
    if (leftKnee.current) leftKnee.current.rotation.x = THREE.MathUtils.damp(leftKnee.current.rotation.x, Math.max(0, -step) * a.gait * 0.6 + airborne * 0.4 + squish * 0.65, 14, dt);
    if (rightKnee.current) rightKnee.current.rotation.x = THREE.MathUtils.damp(rightKnee.current.rotation.x, Math.max(0, step) * a.gait * 0.6 + airborne * 0.3 + squish * 0.65, 14, dt);
    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.damp(leftArm.current.rotation.x, -step * a.gait * 0.42 + (rising ? -0.6 : falling ? -0.35 : 0), 12, dt);
      leftArm.current.rotation.z = THREE.MathUtils.damp(leftArm.current.rotation.z, 0.12 + airborne * 0.45, 12, dt);
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.damp(rightArm.current.rotation.x, step * a.gait * 0.42 - a.scan * 1.3 - airborne * 0.3, 12, dt);
      rightArm.current.rotation.z = THREE.MathUtils.damp(rightArm.current.rotation.z, -0.12 - airborne * 0.45, 12, dt);
    }
    if (rightElbow.current) rightElbow.current.rotation.x = -0.12 - a.scan * 0.1;
    if (scanner.current) scanner.current.visible = a.scan > 0.08;
    if (scanBeam.current) {
      scanBeam.current.visible = a.scan > 0.15 && Boolean(active.activeArtifact);
      if (active.activeArtifact) {
        const [targetX, targetZ] = ZONES[active.activeArtifact];
        temp.set(s.position.x + Math.cos(s.heading) * 0.4 + Math.sin(s.heading) * 0.6,
          s.position.y + 1.3, s.position.z - Math.sin(s.heading) * 0.4 + Math.cos(s.heading) * 0.6);
        beamDirection.set(targetX, s.position.y + 1.1, targetZ).sub(temp);
        const distance = beamDirection.length();
        scanBeam.current.position.copy(temp).addScaledVector(beamDirection, 0.5);
        scanBeam.current.quaternion.setFromUnitVectors(beamUp, beamDirection.normalize());
        scanBeam.current.scale.set(1, distance, 1);
        (scanBeam.current.material as THREE.MeshBasicMaterial).opacity = a.scan * (0.32 + Math.sin(clock.elapsedTime * 18) * 0.1);
      }
    }
    if (scannerRing.current) {
      scannerRing.current.scale.setScalar(0.7 + ((clock.elapsedTime * 1.8) % 1) * 1.8);
      (scannerRing.current.material as THREE.MeshBasicMaterial).opacity = (1 - ((clock.elapsedTime * 1.8) % 1)) * 0.6;
    }

    if (ziggy.current) {
      temp.set(s.position.x + Math.sin(s.heading + 1.35) * 1.55,
        s.position.y + 2.15 + Math.sin(t * 2.7) * 0.13,
        s.position.z + Math.cos(s.heading + 1.35) * 1.55);
      if (ziggy.current.position.distanceToSquared(temp) > 225) ziggy.current.position.copy(temp);
      else ziggy.current.position.lerp(temp, 1 - Math.exp(-4.5 * dt));
      const target = active.activeArtifact ?? active.nearArtifact;
      let targetYaw = s.heading;
      if (target) {
        const [x, z] = ZONES[target];
        targetYaw = Math.atan2(x - ziggy.current.position.x, z - ziggy.current.position.z);
      }
      const turn = Math.atan2(Math.sin(targetYaw - ziggy.current.rotation.y), Math.cos(targetYaw - ziggy.current.rotation.y));
      ziggy.current.rotation.y += turn * (1 - Math.exp(-6 * dt));
      ziggy.current.rotation.z = Math.sin(t * 2.1) * 0.055 + a.tumble * 0.4;
      ziggy.current.rotation.x = Math.sin(t * 1.8) * 0.04 + Math.min(s.speed * 0.015, 0.15);
    }
    if (propeller.current && !frozen) propeller.current.rotation.y += dt * (18 + s.speed);
    if (thruster.current) thruster.current.scale.y = 0.8 + Math.sin(t * 24) * 0.16 + s.speed * 0.04;
  });

  return (
    <>
      <mesh ref={scanBeam} visible={false}>
        <cylinderGeometry args={[0.025, 0.07, 1, 8, 1, true]} />
        <meshBasicMaterial color="#69f5e4" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={root}>
        <group ref={hips} position={[0, 0.82, 0]}>
          <mesh castShadow><boxGeometry args={[0.56, 0.22, 0.4]} /><meshStandardMaterial color={joints} roughness={0.8} /></mesh>
          {[-1, 1].map((side) => (
            <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * 0.19, -0.05, 0]}>
              <mesh position={[0, -0.16, 0]} castShadow><capsuleGeometry args={[0.16, 0.16, 3, 8]} /><meshStandardMaterial color={suit} roughness={0.8} /></mesh>
              <group ref={side < 0 ? leftKnee : rightKnee} position={[0, -0.34, 0]}>
                <mesh castShadow><sphereGeometry args={[0.15, 8, 6]} /><meshStandardMaterial color={joints} /></mesh>
                <mesh position={[0, -0.14, 0]} castShadow><capsuleGeometry args={[0.14, 0.12, 3, 8]} /><meshStandardMaterial color={suit} /></mesh>
                <mesh position={[0, -0.3, 0.07]} castShadow><boxGeometry args={[0.3, 0.22, 0.45]} /><meshStandardMaterial color={joints} roughness={0.9} /></mesh>
                <mesh position={[0, -0.25, 0.26]}><boxGeometry args={[0.24, 0.06, 0.04]} /><meshStandardMaterial color={orange} /></mesh>
              </group>
            </group>
          ))}
          <group ref={torso} position={[0, 0.05, 0]}>
            <mesh position={[0, 0.31, 0]} castShadow><capsuleGeometry args={[0.34, 0.36, 4, 12]} /><meshStandardMaterial color={orange} roughness={0.7} /></mesh>
            <mesh position={[0, 0.37, 0.3]} castShadow><boxGeometry args={[0.4, 0.34, 0.14]} /><meshStandardMaterial color={suit} /></mesh>
            <mesh position={[0, 0.39, 0.38]}><boxGeometry args={[0.23, 0.12, 0.02]} /><meshStandardMaterial color="#294552" /></mesh>
            <mesh position={[0.07, 0.39, 0.395]}><boxGeometry args={[0.045, 0.055, 0.015]} /><meshBasicMaterial color="#8bf1ec" /></mesh>
            <mesh position={[0, 0.35, -0.35]} castShadow><boxGeometry args={[0.52, 0.62, 0.24]} /><meshStandardMaterial color={suit} roughness={0.8} /></mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.2, 0.3, -0.51]} castShadow><cylinderGeometry args={[0.085, 0.085, 0.43, 8]} /><meshStandardMaterial color={joints} /></mesh>
            ))}
            <mesh position={[0, 0.79, 0]} castShadow><cylinderGeometry args={[0.22, 0.24, 0.12, 12]} /><meshStandardMaterial color={joints} /></mesh>
            <mesh position={[0, 1.12, 0]} castShadow><sphereGeometry args={[0.39, 20, 14]} /><meshStandardMaterial color={suit} roughness={0.38} /></mesh>
            <mesh position={[0, 1.12, 0.205]} scale={[1, 0.82, 0.55]} castShadow><sphereGeometry args={[0.34, 20, 14]} /><meshStandardMaterial color="#143b4e" metalness={0.65} roughness={0.2} /></mesh>
            <mesh position={[-0.12, 1.22, 0.365]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.09, 0.13, 0.015]} /><meshBasicMaterial color="#b7f2ef" transparent opacity={0.65} /></mesh>
            <mesh position={[0.26, 1.35, 0.12]}><boxGeometry args={[0.13, 0.1, 0.13]} /><meshStandardMaterial color={joints} /></mesh>
            <mesh position={[0.26, 1.35, 0.19]}><circleGeometry args={[0.035, 8]} /><meshBasicMaterial color="#fff1b3" /></mesh>
            {[-1, 1].map((side) => (
              <group key={side} ref={side < 0 ? leftArm : rightArm} position={[side * 0.39, 0.6, 0]}>
                <mesh castShadow><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color={suit} /></mesh>
                <mesh position={[0, -0.17, 0]} castShadow><capsuleGeometry args={[0.13, 0.16, 3, 8]} /><meshStandardMaterial color={orange} /></mesh>
                <group ref={side > 0 ? rightElbow : undefined} position={[0, -0.34, 0]}>
                  <mesh castShadow><sphereGeometry args={[0.12, 8, 6]} /><meshStandardMaterial color={joints} /></mesh>
                  <mesh position={[0, -0.13, 0]} castShadow><capsuleGeometry args={[0.115, 0.14, 3, 8]} /><meshStandardMaterial color={suit} /></mesh>
                  <mesh position={[0, -0.29, 0.01]} castShadow><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color={joints} /></mesh>
                  {side > 0 && (
                    <group ref={scanner} position={[0, -0.3, 0.08]}>
                      <mesh><boxGeometry args={[0.17, 0.13, 0.25]} /><meshStandardMaterial color="#273a46" /></mesh>
                      <mesh position={[0, -0.02, 0.15]}><circleGeometry args={[0.06, 12]} /><meshBasicMaterial color="#8affef" /></mesh>
                      <mesh ref={scannerRing} position={[0, -0.02, 0.23]}><ringGeometry args={[0.08, 0.09, 24]} /><meshBasicMaterial color="#75f9e9" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} /></mesh>
                    </group>
                  )}
                </group>
              </group>
            ))}
          </group>
        </group>
      </group>
      <group ref={ziggy} position={[0, 2.2, 6]}>
        <mesh castShadow scale={[1.2, 0.95, 0.9]}><sphereGeometry args={[0.36, 16, 12]} /><meshStandardMaterial color="#f5ede0" roughness={0.35} /></mesh>
        <mesh position={[0, 0.015, 0.26]} scale={[1.3, 0.85, 0.45]}><sphereGeometry args={[0.26, 16, 12]} /><meshStandardMaterial color="#173340" roughness={0.25} metalness={0.4} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[side * 0.115, 0.045, 0.376]} scale={[1, 0.7, 0.3]}><sphereGeometry args={[0.066, 12, 8]} /><meshBasicMaterial color="#6deee7" /></mesh>)}
        <mesh position={[0, -0.08, 0.37]}><boxGeometry args={[0.08, 0.018, 0.012]} /><meshBasicMaterial color="#6deee7" /></mesh>
        <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.025, 0.025, 0.2, 6]} /><meshStandardMaterial color={joints} /></mesh>
        <group ref={propeller} position={[0, 0.49, 0]}>
          <mesh><boxGeometry args={[0.82, 0.025, 0.085]} /><meshStandardMaterial color={orange} /></mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.82, 0.025, 0.085]} /><meshStandardMaterial color={orange} /></mesh>
        </group>
        <mesh ref={thruster} position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.11, 0.3, 8]} /><meshBasicMaterial color="#9df3ed" transparent opacity={0.35} depthWrite={false} /></mesh>
      </group>
    </>
  );
}
