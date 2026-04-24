import * as THREE from "three";
import { useMemo } from "react";
import { useTheme } from "../lib/ThemeContext";

/**
 * Renders a pre-built BufferGeometry as a shaded mesh with its true CAD edges.
 *
 * Both `geometry` (the triangle mesh) and `edges` (line segments) are
 * constructed in App.tsx at STEP-parse time. Attaching them with
 * `<primitive>` means drei's `<Bounds>` sees a fully-populated BufferGeometry
 * with a valid bounding box on the very first render — the finalrev viewer
 * does this same thing.
 *
 * Edges come from the STEP BRep face topology (see `buildEdgesFromBrepFaces`
 * in App.tsx). This is noticeably cleaner than drei's `<Edges threshold={15}>`
 * fallback because curved faces — bored holes, fillets, cylindrical walls —
 * render as a single smooth outline instead of a chain of tessellation-facet
 * segments.
 */
function ThreeObjectMesh({
  geometry,
  edges,
  color,
  opacity = 1,
  visible = true,
}: {
  geometry: THREE.BufferGeometry;
  edges: THREE.BufferGeometry | null;
  color: [number, number, number];
  opacity?: number;
  visible?: boolean;
}) {
  const colorString = useMemo(() => {
    return `rgb(${Math.round(color[0] * 255)},${Math.round(
      color[1] * 255
    )},${Math.round(color[2] * 255)})`;
  }, [color]);

  const { visual } = useTheme();

  const isTransparent = opacity < 1;

  return (
    <>
      <mesh
        visible={visible}
        // Explicit renderOrder so transparent bodies draw after opaque ones
        // even if three.js's centroid-based sort picks a different order.
        renderOrder={isTransparent ? 1 : 0}
      >
        <primitive attach="geometry" object={geometry} />
        {/*
         * `key` is the subtle trick here: toggling `transparent` on an
         * existing meshStandardMaterial doesn't always re-enter the
         * renderer's transparent pass (three.js caches pipeline state),
         * so opacity changes after the initial render can silently
         * render as fully-opaque. Recreating the material when
         * transparency toggles guarantees we enter the right path.
         *
         * `depthWrite: false` while transparent prevents the mesh from
         * writing to the depth buffer, so anything already rendered
         * (opaque bodies behind) shows through cleanly. Depth *test* is
         * still on, so the transparent body still gets occluded where
         * something opaque is in front of it.
         */}
        <meshStandardMaterial
          key={isTransparent ? "blend" : "solid"}
          color={colorString}
          metalness={0.05}
          roughness={0.45}
          transparent={isTransparent}
          opacity={opacity}
          depthWrite={!isTransparent}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {edges && visible && (
        <lineSegments renderOrder={isTransparent ? 2 : 0}>
          <primitive attach="geometry" object={edges} />
          <lineBasicMaterial
            color={visual.edgeColor}
            transparent={isTransparent}
            opacity={opacity}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </>
  );
}

export default ThreeObjectMesh;
