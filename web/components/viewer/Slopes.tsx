"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import type { LineMaterial } from "three-stdlib";
import * as THREE from "three";
import type { ViewerSlope } from "@/lib/api";
import { DIFFICULTY } from "@/lib/utils";
import { useViewerStore } from "@/lib/viewer-store";

type SlopesProps = {
  slopes: ViewerSlope[];
  /** Metres to lift the line above the terrain so it doesn't z-fight. */
  yOffset?: number;
};

// Animation tuning
const DRAW_DURATION_S = 1.8;
const STAGGER_S = 0.07;

const BASE_LINE_WIDTH = 3;
const HOVER_LINE_WIDTH = 5.5;
const DIMMED_OPACITY = 0.22;
const ACTIVE_OPACITY = 1.0;

/**
 * All slopes as polylines, colored by difficulty.
 * - Cubic ease-out draw-in animation on mount (staggered per index)
 * - Hover thickens + brightens; other slopes dim
 * - Click opens the InfoPanel via viewer store
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
    const eased = 1 - Math.pow(1 - raw, 3);

    const material = line.material as LineMaterial;
    if (!material) return;

    // Draw-in
    material.dashSize = eased * totalLength + 0.001;
    material.gapSize = (1 - eased) * totalLength + 1;

    // Hover/select state — read directly from store to avoid re-renders.
    const state = useViewerStore.getState();
    const isHovered = state.hoveredId === slope.id;
    const isSelected =
      state.selection?.type === "slope" && state.selection.data.id === slope.id;
    const anyActive = state.hoveredId !== null || state.selection !== null;
    const isDimmed = anyActive && !isHovered && !isSelected;

    const targetOpacity = isDimmed ? DIMMED_OPACITY : ACTIVE_OPACITY;
    const targetWidth = isHovered || isSelected ? HOVER_LINE_WIDTH : BASE_LINE_WIDTH;

    // Smooth lerp toward target
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.18);
    material.transparent = true;
    material.linewidth = THREE.MathUtils.lerp(material.linewidth, targetWidth, 0.2);
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={BASE_LINE_WIDTH}
      transparent
      dashed
      dashScale={1}
      dashSize={0.001}
      gapSize={totalLength + 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        useViewerStore.getState().setHovered(slope.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        useViewerStore.getState().setHovered(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        useViewerStore.getState().selectSlope(slope);
      }}
    />
  );
}
