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
import SkyDome from "./SkyDome";
import type { ViewerData } from "@/lib/api";
import { useViewerStore } from "@/lib/viewer-store";

type SceneProps = {
  /** Path to a baked-terrain .glb. When omitted, falls back to the procedural mountain. */
  terrainModelUrl?: string | null;
  /** Slopes + lifts already converted to local meters by the API. */
  viewerData?: ViewerData | null;
};

// Default camera framing — the same values used at Canvas mount.
export const DEFAULT_CAMERA_POS: [number, number, number] = [-772, 3024, -2065];
export const DEFAULT_TARGET: [number, number, number] = [-426, 1400, 207];

// Terrain bbox in scene meters (the GLB is 6 km × 6 km centered on origin).
const TERRAIN_HALF_X = 2800;
const TERRAIN_HALF_Z = 2800;
const TARGET_MIN_Y = 900;
const TARGET_MAX_Y = 1900;

// Snow is now baked into the satellite texture (see bake-terrain.py --snow),
// so no runtime shader injection is needed.

// Camera safety floor — kept below the summit (1857 m) so users can get close,
// but high enough to prevent egregious "inside the mountain" clipping.
const CAMERA_Y_FLOOR = 1700;

export default function Scene({ terrainModelUrl, viewerData }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 45, near: 1, far: 40000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      performance={{ min: 0.5 }}
      onPointerMissed={() => useViewerStore.getState().clearSelection()}
    >
      {/* Sky dome — gradient sphere acting as atmospheric backdrop.
          Fog colour matches the horizon stop so far terrain fades into sky. */}
      <SkyDome zenith="#1a2740" horizon="#a8b5ca" ground="#1e2940" />
      <fog attach="fog" args={["#a8b5ca", 5500, 18000]} />

      <hemisphereLight args={["#cfd9e6", "#1a2030", 0.85]} />
      <directionalLight position={[6000, 12000, 4000]} intensity={1.4} color="#fff2d6" />
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
        // 14°–74° from up — more freedom than the hard-locked version, still no horizontal
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.41}
        minDistance={400}
        maxDistance={12000}
      />

      <CameraBounds />
      <ResetHandler />
    </Canvas>
  );
}

/** Terrain mesh + snow tint shader injection. */
function Terrain({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material as THREE.MeshStandardMaterial | undefined;
      if (!mat) return;

      if (mat.map) {
        mat.map.anisotropy = 16;
        mat.map.needsUpdate = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

/** Per-frame clamping so the user can't pan/orbit the camera into the mountain. */
function CameraBounds() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  useFrame(() => {
    if (!controls?.target) return;
    const t = controls.target;
    t.x = THREE.MathUtils.clamp(t.x, -TERRAIN_HALF_X, TERRAIN_HALF_X);
    t.z = THREE.MathUtils.clamp(t.z, -TERRAIN_HALF_Z, TERRAIN_HALF_Z);
    t.y = THREE.MathUtils.clamp(t.y, TARGET_MIN_Y, TARGET_MAX_Y);
    // Hard Y floor so the camera always stays above the summit + buffer.
    if (camera.position.y < CAMERA_Y_FLOOR) {
      camera.position.y = CAMERA_Y_FLOOR;
      controls.update();
    }
  });
  return null;
}

/** Smooth lerp back to the default camera framing on resetView(). */
function ResetHandler() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;

  const animatingRef = useRef(false);
  const targetCamPos = useRef(new THREE.Vector3());
  const targetCtrlTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    useViewerStore.setState({
      resetView: () => {
        targetCamPos.current.set(...DEFAULT_CAMERA_POS);
        targetCtrlTarget.current.set(...DEFAULT_TARGET);
        animatingRef.current = true;
        useViewerStore.getState().clearSelection();
      },
    });
  }, []);

  useFrame(() => {
    if (!animatingRef.current) return;
    camera.position.lerp(targetCamPos.current, 0.12);
    if (controls?.target) {
      controls.target.lerp(targetCtrlTarget.current, 0.12);
      controls.update();
    }
    if (camera.position.distanceTo(targetCamPos.current) < 2) {
      camera.position.copy(targetCamPos.current);
      if (controls?.target) controls.target.copy(targetCtrlTarget.current);
      controls?.update();
      animatingRef.current = false;
    }
  });

  return null;
}
