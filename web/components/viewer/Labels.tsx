"use client";

import { Html } from "@react-three/drei";
import type { ViewerSlope, ViewerLift } from "@/lib/api";
import { DIFFICULTY } from "@/lib/utils";

type LabelsProps = {
  slopes: ViewerSlope[];
  lifts: ViewerLift[];
  /** Metres to raise the label above the line. */
  yOffset?: number;
};

/**
 * Floating name chips for slopes and lifts.
 *
 * Slopes: one chip at the polyline midpoint.
 * Lifts:  one chip at the entry (start) and one at the exit (end) — never the
 *         middle, so users can read which lift starts/ends where.
 *
 * Perf-conscious: no `occlude` (would raycast against the 178k-tri terrain
 * every frame, per label). Slopes are deduplicated by name so multi-segment
 * OSM ways don't pile up identical chips.
 */
export default function Labels({ slopes, lifts, yOffset = 30 }: LabelsProps) {
  const uniqueSlopes = dedupByName(slopes);
  const uniqueLifts = dedupByName(lifts);

  return (
    <>
      {uniqueSlopes.map((s) => {
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
            <div className="flex items-center gap-1.5 bg-zinc-900/85 text-zinc-100 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              {s.name}
            </div>
          </Html>
        );
      })}

      {uniqueLifts.flatMap((l) => {
        if (l.points.length < 2) return [];
        const entry = l.points[0];
        const exit = l.points[l.points.length - 1];
        // Lift labels sit a bit higher so they don't collide with slope labels.
        const liftOffset = yOffset + 35;
        return [
          { kind: "entry", point: entry, key: `l-${l.id}-entry`, lift: l },
          { kind: "exit", point: exit, key: `l-${l.id}-exit`, lift: l },
        ].map(({ point, key, lift }) => (
          <Html
            key={key}
            position={[point[0], point[1] + liftOffset, point[2]]}
            center
            wrapperClass="pointer-events-none select-none"
          >
            <div className="flex items-center gap-1.5 bg-zinc-900/85 text-amber-300 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow border border-amber-300/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {lift.name}
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
