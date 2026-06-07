"use client";

import { Line } from "@react-three/drei";
import type { ViewerSlope } from "@/lib/api";
import { DIFFICULTY } from "@/lib/utils";

type SlopesProps = {
  slopes: ViewerSlope[];
  /** Metres to lift the line above the terrain so it doesn't z-fight. */
  yOffset?: number;
};

/**
 * Renders all slopes as polylines, colored by difficulty.
 * Each slope is a thick screen-space line via drei's <Line> (meshline under the hood).
 */
export default function Slopes({ slopes, yOffset = 8 }: SlopesProps) {
  return (
    <>
      {slopes.map((s) => (
        <SlopeLine key={s.id} slope={s} yOffset={yOffset} />
      ))}
    </>
  );
}

function SlopeLine({ slope, yOffset }: { slope: ViewerSlope; yOffset: number }) {
  const color = DIFFICULTY[slope.difficulty]?.color ?? "#ffffff";
  // Lift the line a few metres above the terrain to avoid z-fighting.
  const points = slope.points.map(([x, y, z]) => [x, y + yOffset, z] as [number, number, number]);
  return <Line points={points} color={color} lineWidth={3} />;
}
