"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2, LineMaterial } from "three-stdlib";
import * as THREE from "three";
import type { ViewerLift } from "@/lib/api";
import { useViewerStore } from "@/lib/viewer-store";

type LiftsProps = {
  lifts: ViewerLift[];
  /** Metres above terrain for the cable line — typical pylon clearance. */
  yOffset?: number;
};

const LIFT_GLOBAL_DELAY_S = 0.2;
const DRAW_DURATION_S = 1.6;
const STAGGER_S = 0.06;
const SPHERE_GROWTH_S = 0.35;

const BASE_LINE_WIDTH = 2;
const HOVER_LINE_WIDTH = 4;
const DIMMED_OPACITY = 0.25;
const ACTIVE_OPACITY = 1.0;
const HOVER_SPHERE_SCALE = 1.5;

/**
 * Lifts as cable + endpoint spheres. Same hover/click pattern as slopes.
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

  // We want a single per-frame handler to drive cable + sphere animation +
  // hover/select visuals.
  const targetSphereScaleRef = useRef(0);

  useFrame(({ clock }) => {
    if (startedAtRef.current === null) {
      startedAtRef.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startedAtRef.current - startDelay;

    // ---- store-driven highlight state ----
    const state = useViewerStore.getState();
    const isHovered = state.hoveredId === lift.id;
    const isSelected =
      state.selection?.type === "lift" && state.selection.data.id === lift.id;
    const anyActive = state.hoveredId !== null || state.selection !== null;
    const isDimmed = anyActive && !isHovered && !isSelected;

    const targetOpacity = isDimmed ? DIMMED_OPACITY : ACTIVE_OPACITY;
    const targetWidth = isHovered || isSelected ? HOVER_LINE_WIDTH : BASE_LINE_WIDTH;

    // ---- cable ----
    const line = lineRef.current;
    if (line) {
      const raw = Math.max(0, Math.min(1, elapsed / DRAW_DURATION_S));
      const eased = 1 - Math.pow(1 - raw, 3);
      const material = line.material as LineMaterial;
      if (material) {
        material.dashSize = eased * totalLength + 0.001;
        material.gapSize = (1 - eased) * totalLength + 1;
        material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.18);
        material.transparent = true;
        material.linewidth = THREE.MathUtils.lerp(material.linewidth, targetWidth, 0.2);
      }
    }

    // ---- spheres ----
    // Initial grow-in: 0 → 1 over SPHERE_GROWTH_S.
    const growT = Math.max(0, Math.min(1, elapsed / SPHERE_GROWTH_S));
    const growEased = 1 - Math.pow(1 - growT, 3);
    const baseScale = growEased;
    const hoverBonus = isHovered || isSelected ? HOVER_SPHERE_SCALE : 1.0;
    const targetSphereScale = baseScale * hoverBonus;
    targetSphereScaleRef.current = THREE.MathUtils.lerp(
      targetSphereScaleRef.current,
      targetSphereScale,
      0.2
    );

    for (const m of sphereRefs.current) {
      if (!m) continue;
      m.scale.setScalar(targetSphereScaleRef.current);
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.transparent = true;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.18);
      }
    }
  });

  const handlePointerOver = (e: { stopPropagation(): void }) => {
    e.stopPropagation();
    useViewerStore.getState().setHovered(lift.id);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: { stopPropagation(): void }) => {
    e.stopPropagation();
    useViewerStore.getState().setHovered(null);
    document.body.style.cursor = "";
  };
  const handleClick = (e: { stopPropagation(): void }) => {
    e.stopPropagation();
    useViewerStore.getState().selectLift(lift);
  };

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color="#f1f5f9"
        lineWidth={BASE_LINE_WIDTH}
        transparent
        dashed
        dashScale={1}
        dashSize={0.001}
        gapSize={totalLength + 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {stations.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            sphereRefs.current[i] = m;
          }}
          position={p}
          scale={0}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <sphereGeometry args={[7, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      ))}
    </group>
  );
}
