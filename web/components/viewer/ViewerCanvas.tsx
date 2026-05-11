"use client";

import dynamic from "next/dynamic";

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
};

export default function ViewerCanvas({ terrainModelUrl }: ViewerCanvasProps) {
  return <Scene terrainModelUrl={terrainModelUrl} />;
}
