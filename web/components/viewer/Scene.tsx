"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Mountain from "./Mountain";
import Snow from "./Snow";

type SceneProps = {
  /** Path to a baked-terrain .glb. When omitted, falls back to the procedural mountain. */
  terrainModelUrl?: string | null;
};

/**
 * R3F scene — Phase 2d + polish.
 *
 * OrbitControls target is the heart of the resort (~426 m west, 207 m south of
 * the terrain origin, ~1400 m elevation) — chosen so rotation feels like
 * spinning the mountain, not orbiting it from afar.
 *
 * Coordinate system: GLB is centered on the resort origin (lat, lon).
 * Vertex Y values are *absolute elevation in metres above sea level*.
 * For Straja the terrain spans Y ≈ 718..1859 m, X/Z ≈ ±3000 m.
 */
export default function Scene({ terrainModelUrl }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [2100, 2900, 2700], fov: 45, near: 1, far: 40000 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#152339"]} />
      <fog attach="fog" args={["#152339", 8000, 20000]} />

      {/* Cool sky / warm sun — gives the terrain depth */}
      <hemisphereLight args={["#a8c2e3", "#1a2030", 0.7]} />
      <directionalLight position={[6000, 12000, 4000]} intensity={1.6} color="#fff2d6" />
      <directionalLight position={[-4000, 5000, -3000]} intensity={0.3} color="#b6cae8" />

      {terrainModelUrl ? (
        <Suspense fallback={<Mountain />}>
          <Terrain url={terrainModelUrl} />
        </Suspense>
      ) : (
        <Mountain />
      )}

      <Snow />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        target={[-426, 1400, 207]}
        maxPolarAngle={Math.PI / 2 - 0.03}
        minDistance={150}
        maxDistance={18000}
      />
    </Canvas>
  );
}

/** Loaded GLB terrain. Suspends until the file is parsed. */
function Terrain({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshStandardMaterial | undefined;
        if (mat?.map) {
          mat.map.anisotropy = 16;
          mat.map.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}
