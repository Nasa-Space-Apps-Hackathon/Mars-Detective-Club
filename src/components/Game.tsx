"use client";

import StubWorld from "@/world/StubWorld";
import UILayer from "@/ui/UILayer";

/**
 * Root of the game.
 * <StubWorld/> is the placeholder 3D scene. Person 1 + 2 swap it for the real world.
 * <UILayer/> is Person 4's overlay (everything 2D).
 */
export default function Game() {
  return (
    <main className="fixed inset-0 select-none">
      <div className="absolute inset-0">
        <StubWorld />
      </div>
      <UILayer />
    </main>
  );
}
