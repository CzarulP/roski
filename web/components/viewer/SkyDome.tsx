"use client";

import { useMemo } from "react";
import * as THREE from "three";

type SkyDomeProps = {
  radius?: number;
  zenith?: string;
  horizon?: string;
  ground?: string;
};

/**
 * Large backside-rendered sphere with a 3-stop vertical gradient:
 *   zenith → horizon → (a touch of) ground tint.
 * Acts as a soft atmospheric backdrop so the scene no longer ends in a
 * flat fill color. The fog colour in Scene.tsx should match the horizon
 * stop so distant terrain fades into the sky.
 */
export default function SkyDome({
  radius = 22000,
  zenith = "#1a2740",
  horizon = "#a8b5ca",
  ground = "#1e2940",
}: SkyDomeProps) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color(zenith) },
        uHorizon: { value: new THREE.Color(horizon) },
        uGround: { value: new THREE.Color(ground) },
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uGround;
        varying vec3 vWorldDir;
        void main() {
          float h = vWorldDir.y;            // -1 = below, 0 = horizon, 1 = zenith
          // Soft horizon band, then ramp to zenith
          float topMix = smoothstep(0.0, 0.55, h);
          vec3 sky = mix(uHorizon, uZenith, topMix);
          // Below horizon: blend horizon → ground (rarely visible since we clamp polar angle)
          float belowMix = smoothstep(0.0, -0.3, h);
          vec3 col = mix(sky, uGround, belowMix);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, [zenith, horizon, ground]);

  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[radius, 48, 24]} />
    </mesh>
  );
}
