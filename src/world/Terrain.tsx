"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getHeight, groundColor } from "./terrainData";
import { MAP_CENTER } from "./zones";

const SIZE = 420;
const SEGMENTS = 150;

/** Low-poly Mars ground built from getHeight(). */
export function createTerrainGeometry() {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    g.translate(MAP_CENTER[0], 0, MAP_CENTER[1]);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, getHeight(pos.getX(i), pos.getZ(i)));

    // flat-shaded look: every triangle gets its own vertices + one color
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    const p = flat.attributes.position;
    const n = flat.attributes.normal;
    const colors = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
      const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      const slope = 1 - Math.abs(n.getY(i));
      groundColor(cx, cz, cy, slope, c);
      for (let k = 0; k < 3; k++) c.toArray(colors, (i + k) * 3);
    }
    flat.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.dispose();
    return flat;
}

export default function Terrain() {
  const geometry = useMemo(createTerrainGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
    </mesh>
  );
}
