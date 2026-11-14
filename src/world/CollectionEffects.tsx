"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/store/useGame";
import { SALVAGE } from "./salvageData";
import { getHeight } from "./terrainData";

const POOL = 4;
const PARTICLES = 28;
const DURATION = 1.05;
const vertex = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";
const fragment = `varying vec2 vUv; uniform float fade;
void main(){ float r=length(vUv-0.5)*2.0;
float glow=pow(max(0.0,1.0-r),2.5);
gl_FragColor=vec4(mix(vec3(0.05,1.0,0.68),vec3(0.78,1.0,0.96),glow),glow*fade); }`;

/** Mint impact flash, radiating droplets, four point sparkles and an expanding ring.
 * Recreates the supplied particles.jpg in geometry, without its opaque background.
 * Fixed pools keep repeated pickups from allocating particles or leaking materials.
 */
export default function CollectionEffects() {
  const dots = useRef<THREE.InstancedMesh>(null);
  const stars = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const glows = useRef<(THREE.Mesh | null)[]>([]);
  const bursts = useRef(Array.from({ length: POOL }, () => ({ age: DURATION, x: 0, y: 0, z: 0 })));
  const dirty = useRef(true);
  const matrix = useMemo(() => new THREE.Object3D(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const radius = i % 2 ? 0.22 : 1;
      if (i === 0) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    shape.closePath();
    return shape;
  }, []);
  const uniforms = useMemo(() => Array.from({ length: POOL }, () => ({ fade: { value: 0 } })), []);

  useEffect(() => useGame.subscribe((next, previous) => {
    if (next.phase === "menu" || next.collectedSalvage.length < previous.collectedSalvage.length) {
      bursts.current.forEach((burst) => { burst.age = DURATION; });
      dirty.current = true;
      return;
    }
    for (const id of next.collectedSalvage) {
      if (previous.collectedSalvage.includes(id)) continue;
      const piece = SALVAGE.find((item) => item.id === id);
      if (!piece) continue;
      const burst = bursts.current.reduce((oldest, item) => item.age > oldest.age ? item : oldest);
      Object.assign(burst, { age: 0, x: piece.x, y: getHeight(piece.x, piece.z) + 0.4, z: piece.z });
      dirty.current = true;
    }
  }), []);

  useFrame(({ camera }, delta) => {
    if (!dots.current || !stars.current) return;
    if (!dirty.current && bursts.current.every((burst) => burst.age >= DURATION)) return;
    const game = useGame.getState();
    const frozen = game.paused || game.journalOpen || game.showControls;
    const dt = frozen ? 0 : Math.min(delta, 0.05);
    for (let b = 0; b < POOL; b++) {
      const burst = bursts.current[b];
      burst.age = Math.min(DURATION, burst.age + dt);
      const p = burst.age / DURATION;
      const alive = p < 1;
      const ring = rings.current[b];
      const glow = glows.current[b];
      if (ring) {
        ring.visible = alive;
        ring.position.set(burst.x, burst.y + 0.15, burst.z);
        ring.quaternion.copy(camera.quaternion);
        ring.scale.setScalar(0.15 + p * 1.9);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) ** 2 * 0.9;
      }
      if (glow) {
        glow.visible = alive;
        glow.position.set(burst.x, burst.y + 0.2, burst.z);
        glow.quaternion.copy(camera.quaternion);
        glow.scale.setScalar(0.7 + Math.sin(p * Math.PI) * 2.8);
        uniforms[b].fade.value = (1 - p) ** 2;
      }
      for (let i = 0; i < PARTICLES; i++) {
        const angle = i * 2.399963 + b;
        const radius = Math.sqrt((i + 0.5) / PARTICLES);
        const travel = (0.12 + p * (1.4 + radius * 1.3));
        direction.set(Math.cos(angle) * radius, 0.25 + Math.sin(i * 4.13) * 0.65, Math.sin(angle) * radius).normalize();
        matrix.position.set(burst.x + direction.x * travel, burst.y + direction.y * travel + Math.sin(p * Math.PI) * 0.45, burst.z + direction.z * travel);
        matrix.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, direction);
        const size = alive ? (1 - p) * (0.045 + (i % 4) * 0.012) : 0;
        matrix.scale.set(size, size * (1.8 + Math.sin(p * Math.PI) * 2.5), size);
        matrix.updateMatrix();
        dots.current.setMatrixAt(b * PARTICLES + i, matrix.matrix);
        // Sparkles face the camera; half the population is visible as little stars.
        matrix.quaternion.copy(camera.quaternion);
        const sparkle = i % 2 === 0 ? size * (1.4 + Math.sin(p * Math.PI) * 1.5) : 0;
        matrix.scale.setScalar(sparkle);
        matrix.updateMatrix();
        stars.current.setMatrixAt(b * PARTICLES + i, matrix.matrix);
      }
    }
    dots.current.instanceMatrix.needsUpdate = true;
    stars.current.instanceMatrix.needsUpdate = true;
    dirty.current = false;
  });

  return <group>
    <instancedMesh ref={dots} args={[undefined, undefined, POOL * PARTICLES]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#44ffce" toneMapped={false} transparent opacity={0.9} depthWrite={false} />
    </instancedMesh>
    <instancedMesh ref={stars} args={[undefined, undefined, POOL * PARTICLES]} frustumCulled={false}>
      <shapeGeometry args={[starShape]} /><meshBasicMaterial color="#c4fff4" toneMapped={false} transparent depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
    {Array.from({ length: POOL }, (_, i) => <group key={i}>
      <mesh ref={(el) => { rings.current[i] = el; }} visible={false}>
        <ringGeometry args={[0.93, 1, 48]} /><meshBasicMaterial color="#3bffcc" toneMapped={false} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={(el) => { glows.current[i] = el; }} visible={false}>
        <planeGeometry args={[1, 1]} /><shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms[i]} transparent depthWrite={false} />
      </mesh>
    </group>)}
  </group>;
}
