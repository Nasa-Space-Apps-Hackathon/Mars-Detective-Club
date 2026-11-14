"use client";

import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier, type RapierCollider, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import { canMove, useGame } from "@/store/useGame";
import Character from "./Character";
import PlayerEffects from "./PlayerEffects";
import { createWorldRuntime, type RuntimeRef } from "./runtime";
import { groundHeight, WORLD_BOUNDS } from "./worldConfig";
import { getStormCenter, sampleStorm, STORMS } from "./weather";
import { MAP_CENTER, MAP_RADIUS, SCAN_RADIUS, ZONES } from "./zones";
import { playerState, teleport as legacyTeleport } from "./playerState";
import { JUMP_SPEED, MARS_GRAVITY as GRAVITY } from "./physics";
import { SALVAGE, SALVAGE_RADIUS } from "./salvageData";
import { SHIP_TERMINAL } from "./landingPod";
import { advanceInteraction, beginInteraction, cancelInteraction, endInteraction, nearbyInteraction, useInteraction } from "@/lib/interaction";

const FRICTION = 14;
const CAPSULE_CENTER = 1.17;

export default function Player({ runtime }: { runtime: RuntimeRef }) {
  const { world, rapier } = useRapier();
  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const input = useRef({ jumpBuffer: 0, coyote: 0.1, windTime: 0, windCooldown: 0, lastPublish: 0 });

  useEffect(() => {
    const character = world.createCharacterController(0.025);
    character.setSlideEnabled(true);
    character.enableAutostep(0.2, 0.25, false);
    character.enableSnapToGround(0.18);
    character.setMaxSlopeClimbAngle(Math.PI / 4);
    character.setMinSlopeSlideAngle(Math.PI / 3);
    controller.current = character;
    return () => { controller.current = null; world.removeCharacterController(character); };
  }, [world]);

  useEffect(() => {
    const clear = () => {
      keys.current = {};
      input.current.jumpBuffer = 0;
      cancelInteraction(true);
    };
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.matches("input, textarea, select, [contenteditable=true]")) return;
      if (event.code === "Space" && event.target instanceof Element && event.target.closest("button, a")) return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code) && canMove()) event.preventDefault();
      keys.current[event.code] = true;
      if (event.code === "Space" && !event.repeat && canMove()) input.current.jumpBuffer = 0.15;
      if (event.code === "KeyE" && !event.repeat && canMove()) {
        if (runtime.current.grounded) {
          useGame.getState().setPlayer([runtime.current.position.x, runtime.current.position.z], runtime.current.orbitYaw);
          beginInteraction("keyboard");
        }
      }
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
      if (event.code === "KeyE") endInteraction("keyboard");
    };
    const teleport = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; z: number; y?: number }>).detail;
      if (!detail || !Number.isFinite(detail.x) || !Number.isFinite(detail.z)) return;
      const s = runtime.current;
      const y = detail.y ?? groundHeight(detail.x, detail.z) + 0.15;
      s.position.set(detail.x, y, detail.z);
      s.velocity.set(0, 0, 0);
      s.grounded = false;
      s.wind = 0;
      s.landing = 0;
      controlsReset();
      const translation = { x: detail.x, y: y + CAPSULE_CENTER, z: detail.z };
      body.current?.setTranslation(translation, true);
      body.current?.setNextKinematicTranslation(translation);
    };
    const controlsReset = () => {
      clear();
      input.current.windTime = 0;
      input.current.windCooldown = 0;
      input.current.coyote = 0;
    };
    Object.assign(playerState, { x: runtime.current.position.x, y: runtime.current.position.y, z: runtime.current.position.z, yaw: runtime.current.heading, speed: 0, grounded: true });
    const unsubscribe = useGame.subscribe((next, previous) => {
      if (next.phase === "menu" && previous.phase !== "menu" || next.phase === "intro" && previous.phase === "menu") {
        runtime.current = createWorldRuntime();
        const translation = { x: runtime.current.position.x, y: runtime.current.position.y + CAPSULE_CENTER, z: runtime.current.position.z };
        body.current?.setTranslation(translation, true);
        body.current?.setNextKinematicTranslation(translation);
        input.current = { jumpBuffer: 0, coyote: 0.1, windTime: 0, windCooldown: 0, lastPublish: 0 };
        clear();
      }
      if (next.paused || next.journalOpen || next.showControls || next.phase !== "explore") clear();
      if (next.activeArtifact && next.phase !== previous.phase && previous.phase === "explore") {
        const s = runtime.current;
        const [x, z] = ZONES[next.activeArtifact];
        s.heading = Math.atan2(x - s.position.x, z - s.position.z);
        s.scanning = 1;
        s.velocity.x = 0;
        s.velocity.z = 0;
      }
    });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    const visibility = () => { if (document.hidden) clear(); };
    document.addEventListener("visibilitychange", visibility);
    const dev = new URLSearchParams(window.location.search).has("dev");
    if (dev) window.addEventListener("mars:teleport", teleport);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibility);
      cancelInteraction(true);
      if (dev) window.removeEventListener("mars:teleport", teleport);
    };
  }, [runtime]);

  useBeforePhysicsStep(() => {
    const dt = Math.min(world.timestep, 0.05);
    const s = runtime.current;
    if (legacyTeleport.to) {
      const [x, z] = legacyTeleport.to;
      s.position.set(x, groundHeight(x, z) + 0.15, z);
      s.velocity.set(0, 0, 0);
      s.grounded = false;
      s.wind = 0;
      input.current.windTime = 0;
      input.current.windCooldown = 0;
      const translation = { x, y: s.position.y + CAPSULE_CENTER, z };
      body.current?.setTranslation(translation, true);
      body.current?.setNextKinematicTranslation(translation);
      legacyTeleport.to = null;
    }
    const controls = input.current;
    const game = useGame.getState();
    const playing = canMove();
    const paused = game.paused || game.journalOpen || game.showControls;
    if (!paused) s.scanning = Math.max(0, s.scanning - dt * 0.42);
    if (!playing) {
      s.speed = THREE.MathUtils.damp(s.speed, 0, 12, dt);
      Object.assign(playerState, { x: s.position.x, y: s.position.y, z: s.position.z, yaw: s.heading, speed: 0, grounded: s.grounded });
      return;
    }
    if (!body.current || !collider.current || !controller.current) return;

    s.simTime += dt;
    const oldX = s.position.x;
    const oldZ = s.position.z;
    const forward = Number(Boolean(keys.current.KeyW || keys.current.ArrowUp)) - Number(Boolean(keys.current.KeyS || keys.current.ArrowDown));
    const sideways = Number(Boolean(keys.current.KeyD || keys.current.ArrowRight)) - Number(Boolean(keys.current.KeyA || keys.current.ArrowLeft));
    const length = Math.hypot(forward, sideways) || 1;
    // Settle in place during a pickup, while allowing an intentional move/jump to cancel it.
    if (forward || sideways || controls.jumpBuffer > 0) cancelInteraction();
    const holding = useInteraction.getState().holding;
    const walkSpeed = holding ? 0 : keys.current.ShiftLeft || keys.current.ShiftRight ? 11 : 6.5;
    const desiredX = (Math.sin(s.orbitYaw) * forward - Math.cos(s.orbitYaw) * sideways) / length * walkSpeed;
    const desiredZ = (Math.cos(s.orbitYaw) * forward + Math.sin(s.orbitYaw) * sideways) / length * walkSpeed;
    const hasInput = Boolean(forward || sideways);
    const h = dt;
    {
      controls.jumpBuffer = Math.max(0, controls.jumpBuffer - h);
      controls.coyote = s.grounded ? 0.1 : Math.max(0, controls.coyote - h);
      controls.windCooldown = Math.max(0, controls.windCooldown - h);
      const wind = sampleStorm(s.position.x, s.position.z, s.simTime);
      const caught = controls.windCooldown <= 0 && wind.strength > 0.05;
      s.wind = THREE.MathUtils.damp(s.wind, caught ? wind.strength : 0, 6, h);
      controls.windTime = caught && wind.strength > 0.55 ? controls.windTime + h : Math.max(0, controls.windTime - h * 2);

      if (controls.jumpBuffer > 0 && controls.coyote > 0) {
        s.velocity.y = JUMP_SPEED;
        s.grounded = false;
        controls.jumpBuffer = 0;
        controls.coyote = 0;
      }

      const control = controls.windCooldown > 0 && !s.grounded ? 0.03 : caught ? 0.25 : s.grounded ? 1 : 0.38;
      s.velocity.x = THREE.MathUtils.damp(s.velocity.x, desiredX, FRICTION * control, h);
      s.velocity.z = THREE.MathUtils.damp(s.velocity.z, desiredZ, FRICTION * control, h);
      if (caught) {
        s.velocity.x += wind.forceX * h;
        s.velocity.z += wind.forceZ * h;
        s.velocity.y += wind.lift * h;
        if (wind.lift > GRAVITY) s.grounded = false;
      }
      if (controls.windCooldown <= 0 && caught && (controls.windTime > 1.55 || s.position.y - groundHeight(s.position.x, s.position.z) > 7)) {
        // Eject away from the nearest core, so the automatic recovery clears its influence.
        let closest = Infinity;
        let windHeading = s.heading;
        for (const storm of STORMS) {
          const center = getStormCenter(storm, s.simTime);
          const distance = Math.hypot(s.position.x - center.x, s.position.z - center.z);
          if (distance < closest) {
            closest = distance;
            windHeading = distance > 0.1 ? Math.atan2(s.position.x - center.x, s.position.z - center.z) : s.heading;
          }
        }
        s.velocity.x = Math.sin(windHeading) * 15;
        s.velocity.z = Math.cos(windHeading) * 15;
        s.velocity.y = 6;
        controls.windCooldown = 4.5;
        controls.windTime = 0;
        s.grounded = false;
      }
      s.velocity.y = THREE.MathUtils.clamp(s.velocity.y - GRAVITY * h, -20, 10);
      const character = controller.current;
      if (s.velocity.y > 0) character.disableSnapToGround();
      else character.enableSnapToGround(0.18);
      character.computeColliderMovement(collider.current, {
        x: s.velocity.x * h, y: s.velocity.y * h, z: s.velocity.z * h,
      }, rapier.QueryFilterFlags.EXCLUDE_SENSORS);
      const corrected = character.computedMovement();
      const translation = body.current.translation();
      const next = {
        x: THREE.MathUtils.clamp(translation.x + corrected.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
        y: translation.y + corrected.y,
        z: THREE.MathUtils.clamp(translation.z + corrected.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ),
      };
      const edgeX = next.x - MAP_CENTER[0];
      const edgeZ = next.z - MAP_CENTER[1];
      const edgeDistance = Math.hypot(edgeX, edgeZ);
      if (edgeDistance > MAP_RADIUS - 0.5) {
        const scale = (MAP_RADIUS - 0.5) / edgeDistance;
        next.x = MAP_CENTER[0] + edgeX * scale;
        next.z = MAP_CENTER[1] + edgeZ * scale;
      }
      body.current.setNextKinematicTranslation(next);
      s.position.set(next.x, next.y - CAPSULE_CENTER, next.z);
      const wasGrounded = s.grounded;
      s.grounded = character.computedGrounded() && s.velocity.y <= 0;
      if (s.grounded) {
        if (!wasGrounded && s.velocity.y < -2) s.landing = THREE.MathUtils.clamp(-s.velocity.y / 10, 0.5, 1);
        s.velocity.y = 0;
      } else if (s.velocity.y > 0 && corrected.y < s.velocity.y * h * 0.2) s.velocity.y = 0;
      // A recovery floor is only a failsafe for an unloaded world, not the collision solver.
      if (s.position.y < -12) {
        const reset = createWorldRuntime();
        s.position.copy(reset.position);
        s.velocity.set(0, 0, 0);
        s.grounded = true;
        body.current.setTranslation({ x: s.position.x, y: s.position.y + CAPSULE_CENTER, z: s.position.z }, true);
      }
      s.landing = Math.max(0, s.landing - h * 2.8);
    }

    s.speed = Math.hypot(s.position.x - oldX, s.position.z - oldZ) / Math.max(dt, 0.001);
    if (hasInput && s.scanning <= 0.1) {
      const heading = Math.atan2(desiredX, desiredZ);
      const difference = Math.atan2(Math.sin(heading - s.heading), Math.cos(heading - s.heading));
      s.heading += difference * (1 - Math.exp(-12 * dt));
    }
    if (useInteraction.getState().holding) {
      const target = nearbyInteraction();
      if (target && Math.hypot(target.x - s.position.x, target.z - s.position.z) > 0.1) {
        const heading = Math.atan2(target.x - s.position.x, target.z - s.position.z);
        s.heading += Math.atan2(Math.sin(heading - s.heading), Math.cos(heading - s.heading)) * (1 - Math.exp(-14 * dt));
      }
    }
    Object.assign(playerState, { x: s.position.x, y: s.position.y, z: s.position.z, yaw: s.heading, speed: s.speed, grounded: s.grounded });
    let near: ArtifactId | null = null;
    if (s.grounded) {
      for (const id of ARTIFACT_ORDER) {
        const [x, z] = ZONES[id];
        if (Math.hypot(s.position.x - x, s.position.z - z) < SCAN_RADIUS) near = id;
      }
    }
    game.setNearArtifact(near);
    const nearest = s.grounded ? SALVAGE.filter((piece) => !game.collectedSalvage.includes(piece.id))
      .map((piece) => ({ id: piece.id, distance: Math.hypot(s.position.x - piece.x, s.position.z - piece.z) }))
      .filter((piece) => piece.distance < SALVAGE_RADIUS).sort((a, b) => a.distance - b.distance)[0] : null;
    game.setNearSupplies(nearest?.id ?? null, s.grounded && Math.hypot(s.position.x - SHIP_TERMINAL.x, s.position.z - SHIP_TERMINAL.z) < SHIP_TERMINAL.radius);
    advanceInteraction(dt);
    controls.lastPublish += dt;
    if (controls.lastPublish > 0.1) {
      controls.lastPublish = 0;
      game.setPlayer([s.position.x, s.position.z], s.orbitYaw);
    }
  });

  return <>
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[runtime.current.position.x, runtime.current.position.y + CAPSULE_CENTER, runtime.current.position.z]} enabledRotations={[false, false, false]}>
      <CapsuleCollider ref={collider} args={[0.83, 0.34]} friction={0} />
    </RigidBody>
    <Character runtime={runtime} />
    <PlayerEffects runtime={runtime} />
  </>;
}
