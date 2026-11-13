"use client";

import MarsWorld from "@/world/MarsWorld";
import StubArtifacts from "@/artifacts/StubArtifacts";
import UILayer from "@/ui/UILayer";

/**
 * Root of the game.
 * <MarsWorld/>     Person 1: terrain, sky, player, camera
 * <StubArtifacts/> Person 2: machines, scan, Ziggy (placeholder until real models)
 * <UILayer/>       Person 4: everything 2D
 */
export default function Game() {
  return (
    <main className="fixed inset-0 select-none">
      <div className="absolute inset-0">
        <MarsWorld>
          <StubArtifacts />
        </MarsWorld>
      </div>
      <UILayer />
    </main>
  );
}
