"use client";

import dynamic from "next/dynamic";

// The 3D canvas + UI only run in the browser.
const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-night text-white">
      <p className="font-display text-2xl animate-pulse">Landing on Mars…</p>
    </div>
  ),
});

export default function Page() {
  return <Game />;
}
