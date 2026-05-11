"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SnowProps = {
  /** Number of snowflakes. 3000 is a comfortable desktop default. */
  count?: number;
  /** Half-extent of the spawn box in metres (snow appears within ±area on X and Z). */
  area?: number;
  /** Max Y where flakes are (re)spawned, metres ASL. */
  ceiling?: number;
  /** Y below which flakes are recycled back up to the ceiling. */
  floor?: number;
  /** Vertical fall speed, m/s. Each flake also gets ±20% variance. */
  fallSpeed?: number;
};

/**
 * GPU-cheap snow particle system — a single Points mesh whose vertex positions
 * are mutated each frame. Flakes that fall below `floor` respawn at `ceiling`
 * with a fresh XZ position so the loop is invisible.
 */
export default function Snow({
  count = 3000,
  area = 3500,
  ceiling = 3000,
  floor = 600,
  fallSpeed = 80,
}: SnowProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Initial positions — uniformly within the spawn box, full height range.
  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area * 2;
      pos[i * 3 + 1] = floor + Math.random() * (ceiling - floor);
      pos[i * 3 + 2] = (Math.random() - 0.5) * area * 2;
    }
    return pos;
  }, [count, area, ceiling, floor]);

  // Per-flake velocity (constant for lifetime). Slight horizontal drift.
  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      vel[i * 3] = (Math.random() - 0.5) * 8;
      vel[i * 3 + 1] = -fallSpeed * (0.8 + Math.random() * 0.4);
      vel[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return vel;
  }, [count, fallSpeed]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const posAttr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      arr[ix] += velocities[ix] * delta;
      arr[ix + 1] += velocities[ix + 1] * delta;
      arr[ix + 2] += velocities[ix + 2] * delta;

      // Respawn when below floor or drifted out of the box.
      if (
        arr[ix + 1] < floor ||
        arr[ix] < -area || arr[ix] > area ||
        arr[ix + 2] < -area || arr[ix + 2] > area
      ) {
        arr[ix] = (Math.random() - 0.5) * area * 2;
        arr[ix + 1] = ceiling;
        arr[ix + 2] = (Math.random() - 0.5) * area * 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[initialPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={6}
        color="#ffffff"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
