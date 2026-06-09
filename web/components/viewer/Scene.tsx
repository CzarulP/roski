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

// Terrain bbox in scene meters — clamps the OrbitControls target so the user
// can't pan out of the resort area.
const TERRAIN_HALF_X = 2400;
const TERRAIN_HALF_Z = 2400;
const TARGET_MIN_Y = 900;
const TARGET_MAX_Y = 1900;

// Distant terrain backdrop — fetched only if the GLB exists.
const DISTANT_TERRAIN_URL = "/terrain/straja-distant.glb";

// Snow is now baked into the satellite texture (see bake-terrain.py --snow),
// so no runtime shader injection is needed.

// Camera safety floor — kept below the summit (1857 m) so users can get close,
// but high enough to prevent egregious "inside the mountain" clipping.
const CAMERA_Y_FLOOR = 1700;

export default function Scene({ terrainModelUrl, viewerData }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 45, near: 1, far: 50000 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.18,
      }}
      performance={{ min: 0.5 }}
      onPointerMissed={() => useViewerStore.getState().clearSelection()}
    >
      {/* Sky dome — clear sunny winter day:
           zenith vivid blue, horizon warm cream (golden-hour-ish without being dramatic). */}
      <SkyDome zenith="#3a82d3" horizon="#fadeb6" ground="#2a3a52" />
      {/* Fog acts as an "edge fader" — kicks in only at the very rim of the
          distant terrain (~20 km from origin) and ramps fast so the cut into
          empty sky reads as "the map ends" rather than a render boundary.
          Most of the 40 km of surrounding terrain stays clear. */}
      <fog attach="fog" args={["#f3dcb8", 19000, 24000]} />

      <hemisphereLight args={["#cfe2f6", "#262a30", 1.05]} />
      {/* Warmer, brighter sun */}
      <directionalLight position={[6000, 12000, 4000]} intensity={1.85} color="#fff4cf" />
      <directionalLight position={[-4000, 5000, -3000]} intensity={0.35} color="#dbe7fb" />

      {terrainModelUrl ? (
        <Suspense fallback={<Mountain />}>
          <Terrain url={terrainModelUrl} />
          {/* Lower-res surrounding terrain. Suspense gracefully waits for it
              and its own ErrorBoundary keeps the viewer alive if the GLB is missing. */}
          <Suspense fallback={null}>
            <DistantTerrain url={DISTANT_TERRAIN_URL} />
          </Suspense>
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
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.41}
        minDistance={400}
        // Tightened so the user stays focused on the resort and the distant
        // low-res terrain is always at the horizon, never centre-stage.
        maxDistance={6500}
      />

      <CameraBounds />
      <ResetHandler />
    </Canvas>
  );
}

/** Main terrain mesh — the high-detail Straja model. */
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

/**
 * Low-detail surrounding terrain — a hole-punched ring around the main resort
 * model (centre ±3 km is excluded in the bake). Fog dissolves far edges into
 * the sky.
 */
function DistantTerrain({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material as THREE.MeshStandardMaterial | undefined;
      if (!mat) return;
      // Cheaper sampling for the distant tiles — no anisotropy.
      if (mat.map) {
        mat.map.anisotropy = 4;
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
