"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import type { LineMaterial } from "three-stdlib";
import type { ViewerSlope } from "@/lib/api";
import { DIFFICULTY } from "@/lib/utils";

type SlopesProps = {
  slopes: ViewerSlope[];
  /** Metres to lift the line above the terrain so it doesn't z-fight. */
  yOffset?: number;
};

// Animation tuning
const DRAW_DURATION_S = 1.8;   // how long each slope takes to fully draw in
const STAGGER_S = 0.07;         // delay between consecutive slopes' animation start

/**
 * Renders all slopes as polylines colored by difficulty.
 * On mount, each slope "draws in" from start to end — implemented by animating
 * `dashSize`/`gapSize` on drei <Line>'s dashed material. Staggered launches give
 * a cascading reveal across the mountain.
 */
export default function Slopes({ slopes, yOffset = 8 }: SlopesProps) {
  return (
    <>
      {slopes.map((s, i) => (
        <SlopeLine key={s.id} slope={s} yOffset={yOffset} startDelay={i * STAGGER_S} />
      ))}
    </>
  );
}

function SlopeLine({
  slope,
  yOffset,
  startDelay,
}: {
  slope: ViewerSlope;
  yOffset: number;
  startDelay: number;
}) {
  const color = DIFFICULTY[slope.difficulty]?.color ?? "#ffffff";

  // Memoize the points + total Euclidean length once per slope (doesn't change post-mount).
  const { points, totalLength } = useMemo(() => {
    const pts = slope.points.map(
      ([x, y, z]) => [x, y + yOffset, z] as [number, number, number]
    );
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      const dz = pts[i][2] - pts[i - 1][2];
      len += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return { points: pts, totalLength: len };
  }, [slope.points, yOffset]);

  const lineRef = useRef<Line2>(null);
  const startedAtRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const line = lineRef.current;
    if (!line) return;
    if (startedAtRef.current === null) {
      startedAtRef.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAtRef.current - startDelay;
    const raw = Math.max(0, Math.min(1, elapsed / DRAW_DURATION_S));
    // Cubic ease-out: fast at the start, gentle finish.
    const eased = 1 - Math.pow(1 - raw, 3);

    const material = line.material as LineMaterial;
    if (material) {
      // dashSize is the visible portion of the line; gapSize is the rest.
      // Both add up to roughly totalLength, so the dash pattern doesn't wrap.
      material.dashSize = eased * totalLength + 0.001;
      material.gapSize = (1 - eased) * totalLength + 1;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={3}
      dashed
      dashScale={1}
      dashSize={0.001}
      gapSize={totalLength + 1}
    />
  );
}
