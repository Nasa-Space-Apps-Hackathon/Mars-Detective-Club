"use client";

import MarsWorld from "@/world/MarsWorld";
import StubArtifacts from "@/artifacts/StubArtifacts";
import UILayer from "@/ui/UILayer";
import LoadingScreen from "@/ui/LoadingScreen";
import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useGLTF, useProgress } from "@react-three/drei";

/** Resolve cached GLBs as well as their downloads before revealing the world. */
function ModelReadiness({ onReady }: { onReady: () => void }) {
  useGLTF("/models/viking1.glb", "/draco/");
  useGLTF("/models/opportunity.glb", "/draco/");
  useEffect(onReady, [onReady]);
  return null;
}

/** Keep an asset or WebGL failure inside the loading UI with a retry action. */
class WorldBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch() { this.props.onError(); }

  render() { return this.state.failed ? null : this.props.children; }
}

/**
 * Root of the game.
 * <MarsWorld/>     Person 1: terrain, sky, player, camera
 * <StubArtifacts/> Person 2: machines, scan, Ziggy (placeholder until real models)
 * <UILayer/>       Person 4: everything 2D
 */
export default function Game() {
  const [worldReady, setWorldReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [landed, setLanded] = useState(false);
  const [worldError, setWorldError] = useState(false);
  const active = useProgress((state) => state.active);
  const progress = useProgress((state) => state.progress);
  const errors = useProgress((state) => state.errors);
  const markWorldReady = useCallback(() => setWorldReady(true), []);
  const markModelsReady = useCallback(() => setModelsReady(true), []);
  const finishLoading = useCallback(() => setLanded(true), []);
  const markWorldError = useCallback(() => { setWorldError(true); setLanded(false); }, []);
  const ready = worldReady && modelsReady && !active && errors.length === 0 && !worldError;

  return (
    <main className="fixed inset-0 select-none" aria-busy={!landed}>
      <div className="absolute inset-0">
        <WorldBoundary onError={markWorldError}>
          <MarsWorld onReady={markWorldReady}>
            <StubArtifacts />
            <Suspense fallback={null}><ModelReadiness onReady={markModelsReady} /></Suspense>
          </MarsWorld>
        </WorldBoundary>
      </div>
      {landed && <UILayer />}
      {!landed && <LoadingScreen progress={Math.min(85, progress * 0.85) + (worldReady ? 9 : 0)} ready={ready} message={modelsReady ? "Preparing the landing zone" : "Loading the Mars expedition"} error={errors.length > 0 || worldError} onComplete={finishLoading} />}
    </main>
  );
}
