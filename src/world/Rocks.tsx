"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./noise";
import { addColliders, type Collider } from "./playerState";
import { ROCK_DATA, type RockData } from "./rockData";

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
  const rocks = ROCK_DATA;
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
