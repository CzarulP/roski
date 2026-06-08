"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2, LineMaterial } from "three-stdlib";
import * as THREE from "three";
import type { ViewerLift } from "@/lib/api";

type LiftsProps = {
  lifts: ViewerLift[];
  /** Metres above terrain for the cable line — typical pylon clearance. */
  yOffset?: number;
};

// Lifts start drawing a touch after the first slopes for cascade feel.
const LIFT_GLOBAL_DELAY_S = 0.2;
const DRAW_DURATION_S = 1.6;
const STAGGER_S = 0.06;
const SPHERE_GROWTH_S = 0.35;   // how long station spheres take to scale to full size

/**
 * Renders lifts as a cable line + pylon markers at each station.
 * Cable animates in via dashed material (same trick as slopes).
 * Station spheres scale up from 0 → 1 over the first 0.6 s of each lift's animation.
 */
export default function Lifts({ lifts, yOffset = 25 }: LiftsProps) {
  return (
    <>
      {lifts.map((l, i) => (
        <LiftLine
          key={l.id}
          lift={l}
          yOffset={yOffset}
          startDelay={LIFT_GLOBAL_DELAY_S + i * STAGGER_S}
        />
      ))}
    </>
  );
}

function LiftLine({
  lift,
  yOffset,
  startDelay,
}: {
  lift: ViewerLift;
  yOffset: number;
  startDelay: number;
}) {
  const { points, stations, totalLength } = useMemo(() => {
    const pts = lift.points.map(
      ([x, y, z]) => [x, y + yOffset, z] as [number, number, number]
    );
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      const dz = pts[i][2] - pts[i - 1][2];
      len += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    const sts = pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : pts;
    return { points: pts, stations: sts, totalLength: len };
  }, [lift.points, yOffset]);

  const lineRef = useRef<Line2>(null);
  const sphereRefs = useRef<(THREE.Mesh | null)[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (startedAtRef.current === null) {
      startedAtRef.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAtRef.current - startDelay;

    // Cable draw-in
    const line = lineRef.current;
    if (line) {
      const raw = Math.max(0, Math.min(1, elapsed / DRAW_DURATION_S));
      const eased = 1 - Math.pow(1 - raw, 3);
      const material = line.material as LineMaterial;
      if (material) {
        material.dashSize = eased * totalLength + 0.001;
        material.gapSize = (1 - eased) * totalLength + 1;
      }
    }

    // Station spheres scale-in (faster than cable so they "anchor" first)
    const sphereScale = Math.max(0, Math.min(1, elapsed / SPHERE_GROWTH_S));
    // Ease-out cubic for that satisfying "pop"
    const sphereEased = 1 - Math.pow(1 - sphereScale, 3);
    for (const m of sphereRefs.current) {
      if (m) m.scale.setScalar(sphereEased);
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color="#f1f5f9"
        lineWidth={2}
        dashed
        dashScale={1}
        dashSize={0.001}
        gapSize={totalLength + 1}
      />
      {stations.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            sphereRefs.current[i] = m;
          }}
          position={p}
          scale={0}
        >
          <sphereGeometry args={[7, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      ))}
    </group>
  );
}
