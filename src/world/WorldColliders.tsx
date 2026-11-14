"use client";

import { useMemo } from "react";
import { BallCollider, CylinderCollider, RigidBody, TrimeshCollider } from "@react-three/rapier";
import { createTerrainGeometry } from "./Terrain";
import { ROCK_DATA } from "./rockData";
import { getHeight } from "./terrainData";
import { ZONES } from "./zones";

export default function WorldColliders() {
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
    </RigidBody>
  );
}
