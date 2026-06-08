"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import type { ViewerSlope, ViewerLift } from "@/lib/api";
import { DIFFICULTY } from "@/lib/utils";
import { useViewerStore } from "@/lib/viewer-store";
import { cn } from "@/lib/utils";

type LabelsProps = {
  slopes: ViewerSlope[];
  lifts: ViewerLift[];
  /** Metres to raise the label above the line. */
  yOffset?: number;
};

// Animation tuning
const BUBBLE_BASE_DELAY = 0.4;
const BUBBLE_STAGGER = 0.04;

/**
 * Floating name chips for slopes and lifts.
 *
 * Each chip dims to 22% opacity when any *other* slope/lift is hovered or
 * selected, mirroring the line-dimming behaviour in the 3D scene.
 *
 * The hover state is read via a Zustand subscription at this parent, so only
 * one component re-renders per hover change (children re-receive props).
 */
export default function Labels({ slopes, lifts, yOffset = 30 }: LabelsProps) {
  const uniqueSlopes = dedupByName(slopes);
  const uniqueLifts = dedupByName(lifts);

  // Subscribing here means Labels re-renders on hover/select/filter changes;
  // children re-render with new isDimmed / isHidden props.
  const hoveredId = useViewerStore((s) => s.hoveredId);
  const selectionId = useViewerStore((s) => s.selection?.data.id ?? null);
  const filters = useViewerStore((s) => s.filters);
  const anyActive = hoveredId !== null || selectionId !== null;

  const animationDelays = useMemo(() => {
    const totalSlots = uniqueSlopes.length + uniqueLifts.length * 2;
    const slots = Array.from(
      { length: totalSlots },
      (_, i) => BUBBLE_BASE_DELAY + i * BUBBLE_STAGGER
    );
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    return slots;
  }, [uniqueSlopes.length, uniqueLifts.length]);

  let slotIndex = 0;
  const slopeDelays = uniqueSlopes.map(() => animationDelays[slotIndex++]);
  const liftEntryDelays = uniqueLifts.map(() => animationDelays[slotIndex++]);
  const liftExitDelays = uniqueLifts.map(() => animationDelays[slotIndex++]);

  return (
    <>
      {uniqueSlopes.map((s, i) => {
        const mid = polylineMidpoint(s.points);
        const pos: [number, number, number] = [mid[0], mid[1] + yOffset, mid[2]];
        const color = DIFFICULTY[s.difficulty]?.color ?? "#ffffff";
        const isActive = s.id === hoveredId || s.id === selectionId;
        const isDimmed = anyActive && !isActive;
        const isHidden = !filters[s.difficulty as keyof typeof filters];
        return (
          <Html
            key={`s-${s.id}`}
            position={pos}
            center
            wrapperClass="select-none"
          >
            <div
              className="label-bubble-in"
              style={{ animationDelay: `${slopeDelays[i]}s` }}
            >
              <button
                type="button"
                onPointerOver={(e) => {
                  e.stopPropagation();
                  useViewerStore.getState().setHovered(s.id);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  useViewerStore.getState().setHovered(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  useViewerStore.getState().selectSlope(s);
                }}
                className={cn(
                  "flex items-center gap-1.5 bg-zinc-900/85 hover:bg-zinc-800/95 text-zinc-100 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-200",
                  isDimmed && "opacity-25",
                  isHidden && "opacity-0 pointer-events-none scale-50"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {s.name}
              </button>
            </div>
          </Html>
        );
      })}

      {uniqueLifts.flatMap((l, i) => {
        if (l.points.length < 2) return [];
        const entry = l.points[0];
        const exit = l.points[l.points.length - 1];
        const liftOffset = yOffset + 35;
        const isActive = l.id === hoveredId || l.id === selectionId;
        const isDimmed = anyActive && !isActive;
        const isHidden = !filters.lifts;
        return [
          { point: entry, key: `l-${l.id}-entry`, delay: liftEntryDelays[i] },
          { point: exit, key: `l-${l.id}-exit`, delay: liftExitDelays[i] },
        ].map(({ point, key, delay }) => (
          <Html
            key={key}
            position={[point[0], point[1] + liftOffset, point[2]]}
            center
            wrapperClass="select-none"
          >
            <div
              className="label-bubble-in"
              style={{ animationDelay: `${delay}s` }}
            >
              <button
                type="button"
                onPointerOver={(e) => {
                  e.stopPropagation();
                  useViewerStore.getState().setHovered(l.id);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  useViewerStore.getState().setHovered(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  useViewerStore.getState().selectLift(l);
                }}
                className={cn(
                  "flex items-center gap-1.5 bg-zinc-900/85 hover:bg-zinc-800/95 text-amber-300 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow border border-amber-300/30 hover:border-amber-300/60 cursor-pointer transition-all duration-200",
                  isDimmed && "opacity-25",
                  isHidden && "opacity-0 pointer-events-none scale-50"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {l.name}
              </button>
            </div>
          </Html>
        ));
      })}
    </>
  );
}

/** Pick the longest polyline for each unique name. Skips truly-unnamed items. */
function dedupByName<T extends { name: string | null; points: [number, number, number][] }>(items: T[]): T[] {
  const byName = new Map<string, T>();
  for (const it of items) {
    const key = it.name?.trim();
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing || it.points.length > existing.points.length) {
      byName.set(key, it);
    }
  }
  return Array.from(byName.values());
}

/** Index-midpoint of a polyline. Good enough for label placement. */
function polylineMidpoint(points: [number, number, number][]): [number, number, number] {
  if (points.length === 0) return [0, 0, 0];
  if (points.length === 1) return points[0];
  return points[Math.floor(points.length / 2)];
}
