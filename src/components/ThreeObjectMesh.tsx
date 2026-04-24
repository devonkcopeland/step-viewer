import * as THREE from "three";
import { useMemo } from "react";
import { Edges } from "@react-three/drei";
import { useTheme } from "../lib/ThemeContext";

const EDGE_THRESHOLD_DEGREES = 15;

/**
 * Renders a pre-built BufferGeometry as a shaded mesh with silhouette edges.
 *
 * Geometry is constructed in App.tsx at STEP-parse time (see `buildGeometry`
 * there) and passed in via `geometry`. Attaching it with `<primitive>` means
 * drei's `<Bounds>` sees a fully-populated BufferGeometry with a valid
 * bounding box on the very first render — the finalrev viewer does this same
 * thing, and it's what makes camera fitting reliable for any part no matter
 * how far from the origin it was authored.
 */
function ThreeObjectMesh({
  geometry,
  color,
  opacity = 1,
  visible = true,
}: {
  geometry: THREE.BufferGeometry;
  color: [number, number, number];
  opacity?: number;
  visible?: boolean;
}) {
  const colorString = useMemo(() => {
    return `rgb(${Math.round(color[0] * 255)},${Math.round(
      color[1] * 255
    )},${Math.round(color[2] * 255)})`;
  }, [color]);

  // Edge color follows the active theme so silhouette edges stay visible on
  // both light backdrops (ivory / paper) and dark ones (blueprint / brutalist
  // dark). Sourced from the TS theme registry so we don't have to re-read CSS
  // vars from the Three.js render loop.
  const { visual } = useTheme();

  const isTransparent = opacity < 1;

  return (
    <mesh visible={visible}>
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial
        color={colorString}
        metalness={0.05}
        roughness={0.45}
        transparent={isTransparent}
        opacity={opacity}
        // When transparent, depthWrite=false avoids self-sorting artifacts
        // where the back faces of one part occlude the front faces of another.
        depthWrite={!isTransparent}
      />
      <Edges
        scale={1}
        threshold={EDGE_THRESHOLD_DEGREES}
        color={visual.edgeColor}
        lineWidth={1.2}
      />
    </mesh>
  );
}

export default ThreeObjectMesh;
