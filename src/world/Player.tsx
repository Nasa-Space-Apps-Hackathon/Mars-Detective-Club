"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { canMove, useGame } from "@/store/useGame";
import { keys, mouse } from "./controls";
import { colliders, playerState, teleport } from "./playerState";
import { getHeight } from "./terrainData";
import { MAP_CENTER, MAP_RADIUS, SPAWN } from "./zones";

const WALK = 6.5;
const RUN = 11;
const TURN = 2.3; // rad/s
const MARS_GRAVITY = 3.71; // m/s² (38% of Earth's): jumps are floaty!
const JUMP_SPEED = 3.4;
const PLAYER_RADIUS = 0.45;

/* ───────── Captain Pebble model (low-poly astronaut) ───────── */
const SUIT = "#ff8a3d";
const WHITE = "#f4f1ec";

function PebbleModel({ legL, legR, armL, armR }: Record<"legL" | "legR" | "armL" | "armR", React.RefObject<THREE.Group | null>>) {
  return (
    <group>
      {/* legs (pivot at hip) */}
      {[
        [legL, -0.17],
        [legR, 0.17],
      ].map(([ref, x], i) => (
        <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.72, 0]}>
          <mesh position={[0, -0.33, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.4, 3, 8]} />
            <meshStandardMaterial color={WHITE} flatShading />
          </mesh>
          <mesh position={[0, -0.66, 0.06]} castShadow>
            <boxGeometry args={[0.24, 0.14, 0.34]} />
            <meshStandardMaterial color="#5b5f6e" flatShading />
          </mesh>
        </group>
      ))}
      {/* body */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.42, 4, 10]} />
        <meshStandardMaterial color={SUIT} flatShading />
      </mesh>
      <mesh position={[0, 1.12, 0.33]} castShadow>
        <boxGeometry args={[0.36, 0.26, 0.08]} />
        <meshStandardMaterial color={WHITE} flatShading />
      </mesh>
      <mesh position={[0.08, 1.15, 0.38]}>
        <circleGeometry args={[0.05, 10]} />
        <meshStandardMaterial color="#5ce1e6" emissive="#5ce1e6" emissiveIntensity={0.8} />
      </mesh>
      {/* backpack */}
      <mesh position={[0, 1.15, -0.38]} castShadow>
        <boxGeometry args={[0.55, 0.62, 0.26]} />
        <meshStandardMaterial color={WHITE} flatShading />
      </mesh>
      <mesh position={[0.18, 1.5, -0.42]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#9aa0ad" />
      </mesh>
      <mesh position={[0.18, 1.67, -0.42]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ff4d4d" emissive="#ff4d4d" emissiveIntensity={1} />
      </mesh>
      {/* arms (pivot at shoulder) */}
      {[
        [armL, -0.45],
        [armR, 0.45],
      ].map(([ref, x], i) => (
        <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 1.32, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.38, 3, 8]} />
            <meshStandardMaterial color={SUIT} flatShading />
          </mesh>
          <mesh position={[0, -0.58, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color={WHITE} flatShading />
          </mesh>
        </group>
      ))}
      {/* helmet */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <sphereGeometry args={[0.38, 14, 10]} />
        <meshStandardMaterial color={WHITE} flatShading />
      </mesh>
      <mesh position={[0, 1.8, 0.17]} scale={[1, 0.82, 0.75]}>
        <sphereGeometry args={[0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1b1f3b" metalness={0.9} roughness={0.12} />
      </mesh>
      <mesh position={[-0.09, 1.9, 0.38]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/* ───────── Player controller + camera ───────── */
export default function Player() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const phase = useGame((s) => s.phase);

  const st = useRef({
    x: SPAWN[0],
    z: SPAWN[1],
    y: getHeight(SPAWN[0], SPAWN[1]),
    vy: 0,
    yaw: Math.PI,
    walk: 0,
    camDist: 8.5,
    camPitch: 0.42,
    jumpHeld: false,
    lastPub: 0,
  });
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const smoothLook = useRef(new THREE.Vector3(SPAWN[0], 1, SPAWN[1]));

  // reset to the landing pod when a new game starts
  useEffect(() => {
    if (phase === "intro") {
      Object.assign(st.current, { x: SPAWN[0], z: SPAWN[1], y: getHeight(SPAWN[0], SPAWN[1]), vy: 0, yaw: Math.PI });
    }
  }, [phase]);

  useFrame(({ clock }, rawDt) => {
    const s = st.current;
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const active = canMove();
    if (teleport.to) {
      [s.x, s.z] = teleport.to;
      s.y = getHeight(s.x, s.z);
      s.vy = 0;
      teleport.to = null;
    }

    /* ── input → movement ── */
    let fwd = 0;
    let moving = false;
    if (active) {
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      s.yaw += turn * TURN * dt;
      if (mouse.dragging || mouse.dx) s.yaw -= mouse.dx * 0.005;
      s.camPitch = THREE.MathUtils.clamp(s.camPitch + mouse.dy * 0.003, 0.12, 1.1);
      const speed = (keys.ShiftLeft || keys.ShiftRight ? RUN : WALK) * (fwd < 0 ? 0.6 : 1);
      const nx = s.x + Math.sin(s.yaw) * fwd * speed * dt;
      const nz = s.z + Math.cos(s.yaw) * fwd * speed * dt;
      s.x = nx;
      s.z = nz;
      moving = fwd !== 0;

      // jump (fresh press only)
      const jumpKey = !!keys.Space;
      if (jumpKey && !s.jumpHeld && s.y <= getHeight(s.x, s.z) + 0.01) s.vy = JUMP_SPEED;
      s.jumpHeld = jumpKey;
    } else {
      s.jumpHeld = !!keys.Space;
    }
    mouse.dx = 0;
    mouse.dy = 0;
    if (mouse.wheel) {
      s.camDist = THREE.MathUtils.clamp(s.camDist + mouse.wheel * 0.8, 4.5, 16);
      mouse.wheel = 0;
    }

    /* ── collisions: push out of rocks/machines, stay inside the map ── */
    for (const c of colliders) {
      const dx = s.x - c.x;
      const dz = s.z - c.z;
      const min = c.r + PLAYER_RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        s.x = c.x + (dx / d) * min;
        s.z = c.z + (dz / d) * min;
      }
    }
    const ex = s.x - MAP_CENTER[0];
    const ez = s.z - MAP_CENTER[1];
    const ed = Math.hypot(ex, ez);
    if (ed > MAP_RADIUS) {
      s.x = MAP_CENTER[0] + (ex / ed) * MAP_RADIUS;
      s.z = MAP_CENTER[1] + (ez / ed) * MAP_RADIUS;
    }

    /* ── vertical: follow the ground, Mars-gravity jumps ── */
    const ground = getHeight(s.x, s.z);
    s.vy -= MARS_GRAVITY * dt;
    s.y += s.vy * dt;
    let grounded = false;
    if (s.y <= ground) {
      s.y = ground;
      s.vy = 0;
      grounded = true;
    }

    /* ── animation ── */
    const speedNow = moving && grounded ? Math.abs(fwd) * (keys.ShiftLeft || keys.ShiftRight ? RUN : WALK) : 0;
    s.walk += dt * speedNow * 1.6;
    const swing = speedNow > 0 ? Math.sin(s.walk) * (speedNow > WALK ? 0.85 : 0.6) : 0;
    const ease = (r: React.RefObject<THREE.Group | null>, target: number) => {
      if (r.current) r.current.rotation.x = THREE.MathUtils.lerp(r.current.rotation.x, target, 1 - Math.pow(0.0005, dt));
    };
    const airPose = grounded ? 0 : -0.5;
    ease(legL, swing + airPose * 0.4);
    ease(legR, -swing + airPose * 0.4);
    ease(armL, -swing * 0.8 + airPose);
    ease(armR, swing * 0.8 + airPose);
    if (root.current) {
      root.current.position.set(s.x, s.y, s.z);
      root.current.rotation.y = s.yaw;
    }
    if (body.current) {
      body.current.position.y = speedNow > 0 ? Math.abs(Math.sin(s.walk)) * 0.07 : Math.sin(t * 2) * 0.015;
      body.current.rotation.z = speedNow > 0 ? Math.sin(s.walk) * 0.04 : 0;
    }

    /* ── shared state ── */
    playerState.x = s.x;
    playerState.y = s.y;
    playerState.z = s.z;
    playerState.yaw = s.yaw;
    playerState.speed = speedNow;
    playerState.grounded = grounded;
    if (t - s.lastPub > 0.1) {
      s.lastPub = t;
      useGame.getState().setPlayer([s.x, s.z], s.yaw);
    }

    /* ── camera ── */
    if (useGame.getState().phase === "menu") {
      // slow cinematic orbit around the landing pod
      const a = t * 0.07;
      camPos.set(SPAWN[0] + Math.sin(a) * 18, 0, SPAWN[1] + Math.cos(a) * 18);
      camPos.y = getHeight(camPos.x, camPos.z) + 6.5;
      lookAt.set(SPAWN[0], s.y + 2, SPAWN[1] - 6);
    } else {
      const horiz = Math.cos(s.camPitch) * s.camDist;
      camPos.set(s.x - Math.sin(s.yaw) * horiz, s.y + 1.5 + Math.sin(s.camPitch) * s.camDist, s.z - Math.cos(s.yaw) * horiz);
      const g = getHeight(camPos.x, camPos.z) + 1.2;
      if (camPos.y < g) camPos.y = g;
      lookAt.set(s.x, s.y + 1.5, s.z);
    }
    camera.position.lerp(camPos, 1 - Math.pow(0.004, dt));
    smoothLook.current.lerp(lookAt, 1 - Math.pow(0.0005, dt));
    camera.lookAt(smoothLook.current);
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <PebbleModel legL={legL} legR={legR} armL={armL} armR={armR} />
      </group>
      {/* soft blob shadow so the player reads well on any slope */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
