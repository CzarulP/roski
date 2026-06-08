"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Mountain from "./Mountain";
import Snow from "./Snow";
import Slopes from "./Slopes";
import Lifts from "./Lifts";
import Labels from "./Labels";
import type { ViewerData } from "@/lib/api";
import { useViewerStore } from "@/lib/viewer-store";

type SceneProps = {
  /** Path to a baked-terrain .glb. When omitted, falls back to the procedural mountain. */
  terrainModelUrl?: string | null;
  /** Slopes + lifts already converted to local meters by the API. */
  viewerData?: ViewerData | null;
};

// Default camera framing — the same values used at Canvas mount.
// Exposed so the ResetView action can lerp back to it.
export const DEFAULT_CAMERA_POS: [number, number, number] = [-772, 3024, -2065];
export const DEFAULT_TARGET: [number, number, number] = [-426, 1400, 207];

/**
 * R3F scene — Phase 4c.
 *
 * Renders:
 *  - Real Straja terrain (.glb) with procedural fallback
 *  - Slopes (colored by difficulty) and lifts (cable + endpoint markers) from the API
 *  - Snow particles
 *  - In-Canvas ResetHandler that registers a smooth camera lerp with the store
 */
export default function Scene({ terrainModelUrl, viewerData }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 45, near: 1, far: 40000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      performance={{ min: 0.5 }}
      onPointerMissed={() => useViewerStore.getState().clearSelection()}
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
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={DEFAULT_TARGET}
        maxPolarAngle={Math.PI / 2 - 0.03}
        minDistance={150}
        maxDistance={18000}
      />

      <ResetHandler />
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

/**
 * Registers a reset action on the store. When invoked from outside (the floating
 * "Resetare vedere" button), starts a smooth lerp of camera + orbit target back
 * to the defaults.
 */
function ResetHandler() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as THREE.EventDispatcher & {
    target: THREE.Vector3;
    update: () => void;
  } | null;

  const animatingRef = useRef(false);
  const targetCamPos = useRef(new THREE.Vector3());
  const targetCtrlTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    useViewerStore.setState({
      resetView: () => {
        targetCamPos.current.set(...DEFAULT_CAMERA_POS);
        targetCtrlTarget.current.set(...DEFAULT_TARGET);
        animatingRef.current = true;
        // Also clear any selection so the panel doesn't linger after a reset.
        useViewerStore.getState().clearSelection();
      },
    });
  }, []);

  useFrame(() => {
    if (!animatingRef.current) return;
    camera.position.lerp(targetCamPos.current, 0.12);
    if (controls && controls.target) {
      controls.target.lerp(targetCtrlTarget.current, 0.12);
      controls.update();
    }
    // Stop once we're close enough.
    if (camera.position.distanceTo(targetCamPos.current) < 2) {
      camera.position.copy(targetCamPos.current);
      if (controls?.target) controls.target.copy(targetCtrlTarget.current);
      controls?.update();
      animatingRef.current = false;
    }
  });

  return null;
}
