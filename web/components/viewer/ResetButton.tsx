"use client";

import { Compass } from "lucide-react";
import { useViewerStore } from "@/lib/viewer-store";

/**
 * Floating button — bottom-right of the viewer. Lerps the camera back to its
 * default framing via the resetView action registered by ResetHandler.
 */
export default function ResetButton() {
  const resetView = useViewerStore((s) => s.resetView);

  return (
    <button
      type="button"
      onClick={() => resetView()}
      className="absolute bottom-4 right-4 z-20 pointer-events-auto inline-flex items-center gap-2 h-10 px-4 rounded-full bg-card/85 hover:bg-card backdrop-blur border border-border hover:border-accent/40 text-sm transition shadow-lg"
      title="Resetare vedere"
    >
      <Compass className="w-4 h-4" />
      Resetare vedere
    </button>
  );
}
