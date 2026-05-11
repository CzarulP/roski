"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

type MountainProps = {
  /** Width/depth of the terrain in scene units (meters). */
  size?: number;
  /** Grid subdivisions per side. Higher = smoother but heavier. */
  segments?: number;
  /** Vertical scale of noise contribution. */
  heightScale?: number;
  /** Strength of the central radial mound (gives it a mountain shape, not just bumps). */
  moundStrength?: number;
  /** Seed for deterministic terrain. Change to get a different mountain. */
  seed?: number;
};

/**
 * Procedural mountain — a heightmap-displaced plane (Phase 2b placeholder).
 * Combines multi-octave simplex fBm with a radial mound bias so the shape
 * actually looks like a mountain rather than a noisy field.
 * Replaced by the real Blender-baked Straja GLB in Phase 2d.
 */
export default function Mountain({
  size = 200,
  segments = 200,
  heightScale = 25,
  moundStrength = 35,
  seed = 2,
}: MountainProps) {
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    const prng = mulberry32(seed);
    const noise = createNoise2D(prng);

    const half = size / 2;
    const positions = geom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Fractal Brownian motion: 3 octaves of noise at decreasing amplitude
      const n =
        0.6 * noise(x * 0.012, y * 0.012) +
        0.3 * noise(x * 0.035, y * 0.035) +
        0.1 * noise(x * 0.09, y * 0.09);

      // Radial falloff — value is highest at center, fades to zero at edges
      const r = Math.min(1, Math.hypot(x, y) / half);
      const mound = Math.max(0, 1 - r * r);

      // Z because the plane is built XY-up; we'll rotate to make Y-up below
      const h = n * heightScale + mound * moundStrength;
      positions.setZ(i, h);
    }
    positions.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }, [size, segments, heightScale, moundStrength, seed]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#cfd6e2"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

/** Tiny deterministic PRNG so `seed` actually changes the terrain. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
