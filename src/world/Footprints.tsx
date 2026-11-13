"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { playerState } from "./playerState";
import { getHeight } from "./terrainData";

const MAX = 260;
const STEP = 0.9; // meters between prints

/** Boot prints left in the red dust (oldest ones get recycled). */
export default function Footprints() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const state = useRef({ lastX: NaN, lastZ: NaN, i: 0, left: false, count: 0 });
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useFrame(() => {
    const st = state.current;
    const mesh = ref.current;
    if (!mesh || !playerState.grounded) return;
    if (Number.isNaN(st.lastX)) {
      st.lastX = playerState.x;
      st.lastZ = playerState.z;
      return;
    }
    if (Math.hypot(playerState.x - st.lastX, playerState.z - st.lastZ) < STEP) return;
    st.lastX = playerState.x;
    st.lastZ = playerState.z;
    st.left = !st.left;
    const side = st.left ? 0.18 : -0.18;
    const yaw = playerState.yaw;
    const x = playerState.x + Math.cos(yaw) * side;
    const z = playerState.z - Math.sin(yaw) * side;
    e.set(-Math.PI / 2, 0, yaw);
    q.setFromEuler(e);
    v.set(x, getHeight(x, z) + 0.04, z);
    m.compose(v, q, s);
    mesh.setMatrixAt(st.i, m);
    st.i = (st.i + 1) % MAX;
    st.count = Math.min(MAX, st.count + 1);
    mesh.count = st.count;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} frustumCulled={false} count={0}>
      <planeGeometry args={[0.22, 0.38]} />
      <meshBasicMaterial color="#6e2f16" transparent opacity={0.45} depthWrite={false} />
    </instancedMesh>
  );
}
