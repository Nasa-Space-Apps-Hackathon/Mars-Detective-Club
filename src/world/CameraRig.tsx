"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { canMove, useGame } from "@/store/useGame";
import { publishWorldStatus, useWorldStatus } from "@/ui/WorldStatus";
import type { RuntimeRef } from "./runtime";
import { groundHeight, ROCKS } from "./worldConfig";
import { ZONES } from "./zones";
import { LANDING_POD } from "./landingPod";

/** Drei owns orbit input/damping; this rig tracks the explorer and adds restrained impact feedback. */
export default function CameraRig({ runtime }: { runtime: RuntimeRef }) {
  const { camera } = useThree();
  // Controls orbit a proxy camera so collision shortening never changes the user's chosen zoom.
  const orbitCamera = useMemo(() => camera.clone(), [camera]);
  const controls = useRef<OrbitControlsImpl>(null);
  const phase = useGame((s) => s.phase);
  const active = useGame((s) => s.phase === "explore" && !s.paused && !s.journalOpen && !s.showControls);
  const input = useRef({ reduced: false, initialized: false, lastPublish: -1, lastTime: 0, safeDistance: 8 });
  const vectors = useMemo(() => ({ focus: new THREE.Vector3(), smoothed: new THREE.Vector3(), delta: new THREE.Vector3(), offset: new THREE.Vector3(), direction: new THREE.Vector3(), desired: new THREE.Vector3() }), []);

  useEffect(() => {
    const controller = controls.current;
    if (active || !controller) return;
    // Discard pending orbit inertia on pause without applying its remaining rotation to the view.
    const savedPosition = orbitCamera.position.clone();
    const savedTarget = controller.target.clone();
    controller.enableDamping = false;
    controller.update();
    orbitCamera.position.copy(savedPosition);
    controller.target.copy(savedTarget);
    controller.enableDamping = true;
  }, [active, orbitCamera]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { input.current.reduced = media.matches; };
    preference();
    media.addEventListener("change", preference);
    const recenter = (event: KeyboardEvent) => {
      if (event.code !== "KeyR" || event.repeat || !canMove() || !controls.current) return;
      const state = runtime.current;
      const distance = THREE.MathUtils.clamp(orbitCamera.position.distanceTo(controls.current.target), 4, 12);
      orbitCamera.position.set(controls.current.target.x - Math.sin(state.heading) * distance * Math.cos(0.4), controls.current.target.y + Math.sin(0.4) * distance, controls.current.target.z - Math.cos(state.heading) * distance * Math.cos(0.4));
      controls.current.update();
    };
    window.addEventListener("keydown", recenter);
    return () => { media.removeEventListener("change", preference); window.removeEventListener("keydown", recenter); };
  }, [orbitCamera, runtime]);

  useFrame((_, delta) => {
    const controller = controls.current;
    if (!controller) return;
    const dt = Math.min(delta, 0.05);
    const state = runtime.current;
    const { focus, smoothed, offset, direction, desired } = vectors;
    const calm = input.current.reduced || useWorldStatus.getState().steadyCamera;
    focus.copy(state.position); focus.y += 1.35;
    if (!input.current.initialized || state.simTime < input.current.lastTime) {
      smoothed.copy(focus);
      controller.target.copy(focus);
      orbitCamera.position.set(focus.x - Math.sin(state.orbitYaw) * 8 * Math.cos(0.4), focus.y + Math.sin(0.4) * 8, focus.z - Math.cos(state.orbitYaw) * 8 * Math.cos(0.4));
      input.current.safeDistance = 8;
      input.current.initialized = true;
    }
    input.current.lastTime = state.simTime;
    smoothed.lerp(focus, 1 - Math.exp(-12 * dt));
    vectors.delta.copy(smoothed).sub(controller.target);
    orbitCamera.position.add(vectors.delta);
    controller.target.copy(smoothed);
    if (active || phase === "menu") controller.update();
    offset.copy(orbitCamera.position).sub(controller.target);
    state.orbitYaw = Math.atan2(-offset.x, -offset.z);
    state.orbitPitch = Math.atan2(offset.y, Math.hypot(offset.x, offset.z));
    state.cameraDistance = offset.length();
    direction.copy(offset).normalize();
    let clearDistance = state.cameraDistance;
    const shortenAroundSphere = (x: number, y: number, z: number, radius: number) => {
      const dx = x - smoothed.x;
      const dy = y - smoothed.y;
      const dz = z - smoothed.z;
      const along = dx * direction.x + dy * direction.y + dz * direction.z;
      if (along < 0 || along - radius > clearDistance) return;
      const perpendicular = dx * dx + dy * dy + dz * dz - along * along;
      if (perpendicular >= radius * radius) return;
      const near = along - Math.sqrt(radius * radius - perpendicular);
      clearDistance = Math.min(clearDistance, Math.max(0.85, near - 0.2));
    };
    for (const rock of ROCKS) {
      if (rock.s < 0.55 || rock.pos[1] + rock.s < smoothed.y - 2.5) continue;
      shortenAroundSphere(rock.pos[0], rock.pos[1], rock.pos[2], rock.s + 0.28);
    }
    for (const [x, z] of Object.values(ZONES)) shortenAroundSphere(x, groundHeight(x, z) + 1.4, z, 2.1);
    shortenAroundSphere(LANDING_POD.x, LANDING_POD.y + LANDING_POD.bodyCenterY, LANDING_POD.z, LANDING_POD.bodyBottomRadius + 0.3);
    // Test the boom against rising terrain as well as the destination camera point.
    for (let sample = 0.5; sample <= clearDistance; sample += 0.5) {
      const x = smoothed.x + direction.x * sample;
      const y = smoothed.y + direction.y * sample;
      const z = smoothed.z + direction.z * sample;
      if (y < groundHeight(x, z) + 0.4) { clearDistance = Math.max(0.85, sample - 0.5); break; }
    }
    input.current.safeDistance = clearDistance < input.current.safeDistance
      ? clearDistance
      : THREE.MathUtils.damp(input.current.safeDistance, clearDistance, 5, dt);
    desired.copy(smoothed).addScaledVector(direction, input.current.safeDistance);
    desired.y = Math.max(desired.y, groundHeight(desired.x, desired.z) + 0.45);
    camera.position.copy(desired);
    camera.lookAt(smoothed);
    if (!calm && canMove()) {
      // Offset only the view direction, so shake never feeds back into orbit input.
      const shake = state.wind * 0.035;
      focus.copy(controller.target);
      focus.x += Math.sin(state.simTime * 15) * shake;
      focus.y += Math.sin(state.simTime * 21) * shake - state.landing * 0.08;
      camera.lookAt(focus);
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = 55 + (calm ? 0 : Math.min(state.speed / 11, 1) * 4);
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
      camera.updateProjectionMatrix();
    }
    const now = performance.now();
    if (now - input.current.lastPublish > 100) {
      input.current.lastPublish = now;
      publishWorldStatus(state.wind, state.grounded, state.position.y - groundHeight(state.position.x, state.position.z));
    }
  });
  return <OrbitControls ref={controls} camera={orbitCamera} enabled={active} autoRotate={phase === "menu"} autoRotateSpeed={0.25} enablePan={false} enableDamping dampingFactor={0.12} rotateSpeed={0.55} zoomSpeed={0.65} minDistance={4} maxDistance={12} minPolarAngle={0.5} maxPolarAngle={Math.PI / 2 + 0.08} />;
}
