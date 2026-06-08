import { create } from "zustand";
import type { ViewerSlope, ViewerLift } from "./api";

export type Selection =
  | { type: "slope"; data: ViewerSlope }
  | { type: "lift"; data: ViewerLift }
  | null;

type ViewerStore = {
  /** id of the slope/lift currently hovered, or null. */
  hoveredId: string | null;
  /** currently-selected slope or lift (drives the info panel). */
  selection: Selection;
  /** invoked by the reset-view button; overridden by ResetHandler in Scene. */
  resetView: () => void;

  setHovered: (id: string | null) => void;
  selectSlope: (slope: ViewerSlope) => void;
  selectLift: (lift: ViewerLift) => void;
  clearSelection: () => void;
};

/**
 * Shared state for the 3D viewer — hover and selection.
 *
 * Components inside the Canvas read this in `useFrame` via `useViewerStore.getState()`
 * to avoid React re-renders on every hover. UI overlays (InfoPanel) subscribe
 * normally with the hook.
 */
export const useViewerStore = create<ViewerStore>((set) => ({
  hoveredId: null,
  selection: null,
  resetView: () => {}, // no-op until ResetHandler mounts and registers a real one

  setHovered: (id) => set({ hoveredId: id }),
  selectSlope: (slope) => set({ selection: { type: "slope", data: slope } }),
  selectLift: (lift) => set({ selection: { type: "lift", data: lift } }),
  clearSelection: () => set({ selection: null }),
}));
