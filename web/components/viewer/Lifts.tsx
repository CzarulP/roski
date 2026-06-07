"use client";

import { Line } from "@react-three/drei";
import type { ViewerLift } from "@/lib/api";

type LiftsProps = {
  lifts: ViewerLift[];
  /** Metres above terrain for the cable line — typical pylon clearance. */
  yOffset?: number;
};

/**
 * Renders lifts as a cable line + pylon markers at each endpoint.
 * Phase 2e is intentionally simple — straight-line cable.
 * Catenary curves and pylons-along-the-way come in later polish.
 */
export default function Lifts({ lifts, yOffset = 25 }: LiftsProps) {
  return (
    <>
      {lifts.map((l) => (
        <LiftLine key={l.id} lift={l} yOffset={yOffset} />
      ))}
    </>
  );
}

function LiftLine({ lift, yOffset }: { lift: ViewerLift; yOffset: number }) {
  const points = lift.points.map(([x, y, z]) => [x, y + yOffset, z] as [number, number, number]);
  // Spheres only at start (base) and end (top) stations — not at every intermediate
  // OSM vertex (some lifts have 14-18 mapped points).
  const stations = points.length >= 2 ? [points[0], points[points.length - 1]] : points;

  return (
    <group>
      <Line points={points} color="#f1f5f9" lineWidth={2} />
      {stations.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[7, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      ))}
    </group>
  );
}
