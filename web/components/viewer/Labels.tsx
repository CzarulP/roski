"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import type { ViewerSlope, ViewerLift } from "@/lib/api";
import { DIFFICULTY } from "@/lib/utils";

type LabelsProps = {
  slopes: ViewerSlope[];
  lifts: ViewerLift[];
  /** Metres to raise the label above the line. */
  yOffset?: number;
};

// Animation tuning
const BUBBLE_BASE_DELAY = 0.4;   // wait for slopes to start drawing in
const BUBBLE_STAGGER = 0.04;      // gap between consecutive bubble-ins (random-ordered)

/**
 * Floating name chips for slopes and lifts.
 *
 * Slopes: one chip at the polyline midpoint.
 * Lifts:  two chips — one at entry station, one at exit station.
 *
 * Each chip animates in with a "bubble" pop (scale 0 → overshoot 1.18 → settle 1)
 * via CSS keyframes. Order is randomly shuffled on each mount so the reveal
 * feels organic rather than mechanically left-to-right.
 */
export default function Labels({ slopes, lifts, yOffset = 30 }: LabelsProps) {
  const uniqueSlopes = dedupByName(slopes);
  const uniqueLifts = dedupByName(lifts);

  // Each slope gets 1 slot; each lift gets 2 (entry + exit). Shuffled.
  const animationDelays = useMemo(() => {
    const totalSlots = uniqueSlopes.length + uniqueLifts.length * 2;
    const slots = Array.from(
      { length: totalSlots },
      (_, i) => BUBBLE_BASE_DELAY + i * BUBBLE_STAGGER
    );
    // Fisher-Yates shuffle so the order is random each session.
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
        return (
          <Html
            key={`s-${s.id}`}
            position={pos}
            center
            wrapperClass="pointer-events-none select-none"
          >
            <div
              className="label-bubble-in"
              style={{ animationDelay: `${slopeDelays[i]}s` }}
            >
              <div className="flex items-center gap-1.5 bg-zinc-900/85 text-zinc-100 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {s.name}
              </div>
            </div>
          </Html>
        );
      })}

      {uniqueLifts.flatMap((l, i) => {
        if (l.points.length < 2) return [];
        const entry = l.points[0];
        const exit = l.points[l.points.length - 1];
        const liftOffset = yOffset + 35;
        return [
          { point: entry, key: `l-${l.id}-entry`, delay: liftEntryDelays[i] },
          { point: exit, key: `l-${l.id}-exit`, delay: liftExitDelays[i] },
        ].map(({ point, key, delay }) => (
          <Html
            key={key}
            position={[point[0], point[1] + liftOffset, point[2]]}
            center
            wrapperClass="pointer-events-none select-none"
          >
            <div
              className="label-bubble-in"
              style={{ animationDelay: `${delay}s` }}
            >
              <div className="flex items-center gap-1.5 bg-zinc-900/85 text-amber-300 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow border border-amber-300/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {l.name}
              </div>
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
