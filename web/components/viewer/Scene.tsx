"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Mountain from "./Mountain";
import Snow from "./Snow";
import Slopes from "./Slopes";
import Lifts from "./Lifts";
import Labels from "./Labels";
import type { ViewerData } from "@/lib/api";

type SceneProps = {
  /** Path to a baked-terrain .glb. When omitted, falls back to the procedural mountain. */
  terrainModelUrl?: string | null;
  /** Slopes + lifts already converted to local meters by the API. */
  viewerData?: ViewerData | null;
};

/**
 * R3F scene — Phase 2e.
 *
 * Renders:
 *  - Real Straja terrain (.glb) with procedural fallback
 *  - Slopes (colored by difficulty) and lifts (cable + endpoint markers) from the API
 *  - Snow particles
 *
 * Coordinate system: GLB and overlays share the same local ENU frame, both
 * projected from the same resort origin (terrainOriginLat/Lon in the DB).
 */
export default function Scene({ terrainModelUrl, viewerData }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}                              // was [1,2]; cuts Retina fragment cost ~30%
      camera={{ position: [2100, 2900, 2700], fov: 45, near: 1, far: 40000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      performance={{ min: 0.5 }}                  // R3F throttles dpr if FPS drops
    >
      <color attach="background" args={["#152339"]} />
      <fog attach="fog" args={["#152339", 8000, 20000]} />

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

      {viewerData && (
        <>
          <Slopes slopes={viewerData.slopes} />
          <Lifts lifts={viewerData.lifts} />
          <Labels slopes={viewerData.slopes} lifts={viewerData.lifts} />
        </>
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
