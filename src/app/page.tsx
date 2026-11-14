"use client";

import dynamic from "next/dynamic";
import LoadingScreen from "@/ui/LoadingScreen";

// The 3D canvas + UI only run in the browser.
const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Page() {
  return <Game />;
}
