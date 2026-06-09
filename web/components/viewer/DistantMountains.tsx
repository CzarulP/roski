"use client";

import { useMemo } from "react";
import * as THREE from "three";

type RingProps = {
  /** Inner ring is closer, outer ring further. Two rings → parallax depth. */
  count?: number;
  radius?: number;
  baseY?: number;
  minHeight?: number;
  maxHeight?: number;
  peakColor?: string;
  baseColor?: string;
  opacity?: number;
  seed?: number;
};

/**
 * Procedural ring of low-poly triangular mountain silhouettes around the
 * scene. Vertex colors go base→peak (rock-grey → snow-blue), and fog blends
 * them into the sky for proper aerial perspective.
 *
 * Two rings at different radii are rendered in <DistantMountains/> below
 * for a sense of depth without the cost of any real geometry.
 */
function Ring({
  count = 80,
  radius = 11000,
  baseY = 600,
  minHeight = 700,
  maxHeight = 1700,
  peakColor = "#d3dbe6",
  baseColor = "#4d5a72",
  opacity = 0.85,
  seed = 1,
}: RingProps) {
  const geometry = useMemo(() => {
    // Deterministic PRNG so the silhouette doesn't change between renders.
    let s = seed * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const positions: number[] = [];
    const colors: number[] = [];
    const angleStep = (Math.PI * 2) / count;

    const peakC = new THREE.Color(peakColor);
    const baseC = new THREE.Color(baseColor);

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const halfAngle = angleStep * 0.5 * (0.75 + rand() * 0.5);
      const height = minHeight + rand() * (maxHeight - minHeight);
      const peakRadius = radius * (0.92 + rand() * 0.16);
      const baseRadius = peakRadius * (1.02 + rand() * 0.06);

      const lx = Math.cos(angle - halfAngle) * baseRadius;
      const lz = Math.sin(angle - halfAngle) * baseRadius;
      const px = Math.cos(angle) * peakRadius;
      const pz = Math.sin(angle) * peakRadius;
      const rx = Math.cos(angle + halfAngle) * baseRadius;
      const rz = Math.sin(angle + halfAngle) * baseRadius;

      positions.push(lx, baseY, lz);
      positions.push(px, baseY + height, pz);
      positions.push(rx, baseY, rz);

      colors.push(baseC.r, baseC.g, baseC.b);
      colors.push(peakC.r, peakC.g, peakC.b);
      colors.push(baseC.r, baseC.g, baseC.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [count, radius, baseY, minHeight, maxHeight, peakColor, baseColor, seed]);

  return (
    <mesh geometry={geometry} renderOrder={-2}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        fog
        depthWrite={false}
      />
    </mesh>
  );
}

export default function DistantMountains() {
  return (
    <group>
      {/* Inner ring: closer, darker, taller — reads as nearby mid-range peaks */}
      <Ring
        count={70}
        radius={9500}
        baseY={650}
        minHeight={650}
        maxHeight={1600}
        peakColor="#cdd6e1"
        baseColor="#3f4b5f"
        opacity={0.92}
        seed={1}
      />
      {/* Outer ring: further out, hazier, smaller heights — gives parallax depth */}
      <Ring
        count={90}
        radius={13500}
        baseY={550}
        minHeight={500}
        maxHeight={1300}
        peakColor="#dde4ec"
        baseColor="#6a778a"
        opacity={0.55}
        seed={7}
      />
    </group>
  );
}
