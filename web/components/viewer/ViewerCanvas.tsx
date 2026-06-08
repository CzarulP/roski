"use client";

import dynamic from "next/dynamic";
import type { ViewerData } from "@/lib/api";
import InfoPanel from "./InfoPanel";
import ResetButton from "./ResetButton";
import Legend from "./Legend";

// Three.js needs `window`; lazy-load on the client only.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
      Se încarcă vizualizarea 3D…
    </div>
  ),
});

type ViewerCanvasProps = {
  terrainModelUrl?: string | null;
  viewerData?: ViewerData | null;
};

export default function ViewerCanvas({ terrainModelUrl, viewerData }: ViewerCanvasProps) {
  return (
    <>
      <Scene terrainModelUrl={terrainModelUrl} viewerData={viewerData} />
      <InfoPanel />
      <Legend />
      <ResetButton />
    </>
  );
}
