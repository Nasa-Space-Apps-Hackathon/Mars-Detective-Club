"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./noise";
import { addColliders, type Collider } from "./playerState";
import { frostAmount, getHeight } from "./terrainData";
import { MAP_CENTER, MAP_RADIUS, PAD_RADIUS, SPAWN, ZONES } from "./zones";

interface RockData {
  x: number;
  y: number;
  z: number;
  s: number;
  rx: number;
  ry: number;
  frost: boolean;
}

const COUNT = 260;

function buildRocks(): RockData[] {
  const rnd = mulberry32(42);
  const keepClear: [number, number, number][] = [
    ...Object.values(ZONES).map(([x, z]) => [x, z, PAD_RADIUS + 2] as [number, number, number]),
    [SPAWN[0], SPAWN[1], PAD_RADIUS + 3],
  ];
  const rocks: RockData[] = [];
  let tries = 0;
  while (rocks.length < COUNT && tries++ < COUNT * 20) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * (MAP_RADIUS + 25);
    const x = MAP_CENTER[0] + Math.cos(a) * d;
    const z = MAP_CENTER[1] + Math.sin(a) * d;
    if (keepClear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue;
    // mostly small, a few big boulders
    const big = rnd() < 0.12;
    const s = big ? 1.6 + rnd() * 2.2 : 0.25 + rnd() * 0.9;
    rocks.push({ x, y: getHeight(x, z) + s * 0.25, z, s, rx: rnd() * 6, ry: rnd() * 6, frost: frostAmount(x, z) > 0.5 });
  }
  return rocks;
}

function RockBatch({ rocks, color }: { rocks: RockData[]; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    rocks.forEach((r, i) => {
      e.set(r.rx, r.ry, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(r.x, r.y, r.z), q, new THREE.Vector3(r.s, r.s * 0.75, r.s));
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [rocks]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, rocks.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} flatShading roughness={0.95} />
    </instancedMesh>
  );
}

export default function Rocks() {
  const rocks = useMemo(buildRocks, []);
  const groups = useMemo(() => {
    const rnd = mulberry32(7);
    const a: RockData[] = [];
    const b: RockData[] = [];
    const f: RockData[] = [];
    rocks.forEach((r) => (r.frost ? f : rnd() > 0.5 ? a : b).push(r));
    return { a, b, f };
  }, [rocks]);

  // big rocks block the player
  useEffect(() => {
    const list: Collider[] = rocks.filter((r) => r.s > 0.8).map((r) => ({ x: r.x, z: r.z, r: r.s * 0.95 }));
    return addColliders(list);
  }, [rocks]);

  return (
    <>
      <RockBatch rocks={groups.a} color="#8a3f22" />
      <RockBatch rocks={groups.b} color="#6b301b" />
      <RockBatch rocks={groups.f} color="#b9a39c" />
    </>
  );
}
