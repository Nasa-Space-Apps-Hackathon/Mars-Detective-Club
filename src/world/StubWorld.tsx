"use client";

/**
 * ⚠️ PLACEHOLDER WORLD (built by Person 4 so the UI can be tested end-to-end).
 * Person 1 replaces: terrain, sky, player, camera.
 * Person 2 replaces: machine models, scan interaction, Ziggy model.
 * Keep the store calls the same: canMove(), setPlayer(), setNearArtifact(), startScan().
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { canMove, useGame } from "@/store/useGame";
import { ARTIFACT_ORDER, type ArtifactId } from "@/store/types";
import { SCAN_RADIUS, SPAWN, ZONES } from "./zones";

const keys: Record<string, boolean> = {};

function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "KeyE") {
        const s = useGame.getState();
        if (s.nearArtifact && canMove()) s.startScan(s.nearArtifact);
      }
    };
    const up = (e: KeyboardEvent) => (keys[e.code] = false);
    const blur = () => Object.keys(keys).forEach((k) => (keys[k] = false));
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}

/* ───────────── terrain ───────────── */
function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 220, 70, 70);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const d = Math.hypot(x, z + 30);
      const h = Math.sin(x * 0.08) * Math.cos(z * 0.07) * 0.6 + Math.sin(x * 0.21 + z * 0.13) * 0.25 + Math.max(0, d - 55) * 0.18;
      p.setY(i, h);
    }
    g.computeVertexNormals();
    return g.toNonIndexed();
  }, []);
  useEffect(() => {
    geo.computeVertexNormals();
  }, [geo]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#c4643a" flatShading roughness={1} />
    </mesh>
  );
}

function Rocks() {
  const rocks = useMemo(() => {
    const r: { pos: [number, number, number]; s: number; rot: number; c: string }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      const x = (rnd() - 0.5) * 140;
      const z = (rnd() - 0.5) * 140 - 30;
      const tooClose = Object.values(ZONES).some(([zx, zz]) => Math.hypot(x - zx, z - zz) < 6) || Math.hypot(x - SPAWN[0], z - SPAWN[1]) < 5;
      if (tooClose) continue;
      r.push({ pos: [x, 0.1, z], s: 0.3 + rnd() * 1.6, rot: rnd() * 6, c: rnd() > 0.5 ? "#8a3f22" : "#6e3420" });
    }
    return r;
  }, []);
  return (
    <>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={[r.rot, r.rot * 2, 0]} scale={r.s} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={r.c} flatShading />
        </mesh>
      ))}
    </>
  );
}

/* ───────────── machines (placeholder primitives) ───────────── */
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
  const solved = useGame((s) => s.evidence.includes(id));
  const near = useGame((s) => s.nearArtifact === id);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const Model = MODELS[id];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * 0.8;
      ring.current.position.y = 4.2 + Math.sin(t * 2) * 0.2;
    }
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 3) * 0.06;
  });
  const color = solved ? "#7CFF9B" : near ? "#FFFFFF" : "#5CE1E6";
  return (
    <group position={[x, 0, z]} rotation={[0, (x + z) * 0.1, 0]}>
      <Model />
      <mesh ref={beam} position={[0, 15, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 30, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 0]}>
        <torusGeometry args={[0.6, 0.06, 8, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <ringGeometry args={[SCAN_RADIUS - 0.15, SCAN_RADIUS, 48]} />
        <meshBasicMaterial color={color} transparent opacity={near ? 0.7 : 0.25} />
      </mesh>
    </group>
  );
}

/* ───────────── player + Ziggy + camera ───────────── */
function Player() {
  const body = useRef<THREE.Group>(null);
  const ziggy = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const state = useRef({ x: SPAWN[0], z: SPAWN[1], yaw: Math.PI, lastPub: 0 });
  const camTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    const st = state.current;
    dt = Math.min(dt, 0.05);
    if (canMove()) {
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      const speed = keys.ShiftLeft ? 11 : 7;
      st.yaw += turn * 2.4 * dt;
      st.x += Math.sin(st.yaw) * fwd * speed * dt;
      st.z += Math.cos(st.yaw) * fwd * speed * dt;
      st.x = THREE.MathUtils.clamp(st.x, -60, 60);
      st.z = THREE.MathUtils.clamp(st.z, -85, 25);
    }
    const t = clock.elapsedTime;
    if (body.current) {
      body.current.position.set(st.x, 0, st.z);
      body.current.rotation.y = st.yaw;
    }
    if (ziggy.current) {
      ziggy.current.position.set(st.x + Math.sin(st.yaw + 1.2) * 1.4, 2.3 + Math.sin(t * 2.5) * 0.2, st.z + Math.cos(st.yaw + 1.2) * 1.4);
      ziggy.current.rotation.y = st.yaw + Math.sin(t) * 0.3;
    }
    // camera follow
    camTarget.set(st.x - Math.sin(st.yaw) * 8, 5.2, st.z - Math.cos(st.yaw) * 8);
    camera.position.lerp(camTarget, 1 - Math.pow(0.002, dt));
    camera.lookAt(st.x, 1.4, st.z);

    // proximity → nearArtifact
    let near: ArtifactId | null = null;
    for (const id of ARTIFACT_ORDER) {
      const [zx, zz] = ZONES[id];
      if (Math.hypot(st.x - zx, st.z - zz) < SCAN_RADIUS) near = id;
    }
    const g = useGame.getState();
    g.setNearArtifact(near);
    if (t - st.lastPub > 0.1) {
      st.lastPub = t;
      g.setPlayer([st.x, st.z], st.yaw);
    }
  });

  return (
    <>
      <group ref={body}>
        {/* Captain Pebble placeholder */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.8, 4, 10]} />
          <meshStandardMaterial color="#ff8a3d" flatShading />
        </mesh>
        <mesh position={[0, 1.75, 0]} castShadow>
          <sphereGeometry args={[0.42, 12, 10]} />
          <meshStandardMaterial color="#ffffff" flatShading />
        </mesh>
        <mesh position={[0, 1.78, 0.28]}>
          <sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#5CE1E6" metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[0, 1.0, -0.45]} castShadow>
          <boxGeometry args={[0.6, 0.7, 0.3]} />
          <meshStandardMaterial color="#e6e1d8" flatShading />
        </mesh>
      </group>
      <group ref={ziggy}>
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
    </>
  );
}

export default function StubWorld() {
  useKeyboard();
  return (
    <Canvas shadows camera={{ fov: 55, position: [0, 6, 14] }} dpr={[1, 1.75]}>
      <color attach="background" args={["#e9a77c"]} />
      <fog attach="fog" args={["#e9a77c", 30, 120]} />
      <hemisphereLight args={["#ffd8b8", "#6b2d17", 0.9]} />
      <directionalLight
        position={[30, 40, 10]}
        intensity={1.6}
        color="#fff1e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <Terrain />
      <Rocks />
      {ARTIFACT_ORDER.map((id) => (
        <Machine key={id} id={id} />
      ))}
      <Player />
    </Canvas>
  );
}
