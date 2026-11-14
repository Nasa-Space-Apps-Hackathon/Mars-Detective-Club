"use client";

import { useMemo } from "react";
import { BallCollider, ConvexHullCollider, CuboidCollider, CylinderCollider, RigidBody, TrimeshCollider } from "@react-three/rapier";
import { createTerrainGeometry } from "./Terrain";
import { ROCK_DATA } from "./rockData";
import { getHeight } from "./terrainData";
import { ZONES } from "./zones";
import { LANDING_POD, POD_LEGS, podHullVertices, podLocalToWorld } from "./landingPod";

export default function WorldColliders() {
  const podHull = useMemo(podHullVertices, []);
  const pod = LANDING_POD;
  const flag = podLocalToWorld(-4.3, 2, 0.6);
  const terrain = useMemo(() => {
    const geometry = createTerrainGeometry();
    const vertices = new Float32Array(geometry.attributes.position.array);
    const indices = Uint32Array.from({ length: vertices.length / 3 }, (_, i) => i);
    geometry.dispose();
    return { vertices, indices };
  }, []);
  return (
    <RigidBody type="fixed" colliders={false} friction={0.9}>
      <TrimeshCollider args={[terrain.vertices, terrain.indices]} />
      {ROCK_DATA.filter((rock) => rock.s > 0.55).map((rock, i) => (
        <BallCollider key={i} args={[rock.s * 0.86]} position={[rock.x, rock.y, rock.z]} />
      ))}
      {Object.entries(ZONES).map(([id, [x, z]]) => (
        <CylinderCollider key={id} args={[1.4, 1.8]} position={[x, getHeight(x, z) + 1.4, z]} />
      ))}
      <group position={[pod.x, pod.y, pod.z]} rotation={[0, pod.rotation, 0]}>
        <ConvexHullCollider args={[podHull]} />
        <CylinderCollider args={[pod.baseHeight / 2, pod.baseRadius]} position={[0, pod.baseCenterY, 0]} />
        <CuboidCollider args={[0.65, 0.7, 0.325]} position={[0, 0.72, pod.terminalZ]} />
        <CuboidCollider args={[1.25, 0.35, 0.1]} position={[0, 2.07, pod.terminalZ - 0.25]} />
        {POD_LEGS.map(({ x, z, angle }, index) => (
          <group key={index} position={[x, 0, z]}>
            <CylinderCollider args={[0.825, 0.2]} position={[0, 0.65, 0]} rotation={[Math.sin(angle) * 0.45, 0, -Math.cos(angle) * 0.45]} />
            <CylinderCollider args={[0.12, 0.55]} position={[0, 0.12, 0]} />
          </group>
        ))}
      </group>
      <CylinderCollider args={[2, 0.055]} position={[flag.x, flag.y, flag.z]} />
      <CuboidCollider args={[0.06, 0.9, 0.06]} position={[-4, getHeight(-4, 30) + 0.9, 30]} rotation={[0, 0.5, 0]} />
    </RigidBody>
  );
}
