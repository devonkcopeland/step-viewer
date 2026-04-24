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
      <mesh visible={visible}>
        <primitive attach="geometry" object={geometry} />
        <meshStandardMaterial
          color={colorString}
          metalness={0.05}
          roughness={0.45}
          transparent={isTransparent}
          opacity={opacity}
          // When transparent, depthWrite=false avoids self-sorting artifacts
          // where back faces of one part occlude front faces of another.
          depthWrite={!isTransparent}
          // Push the shaded surface a touch further from the camera so the
          // edge line renders cleanly on top without z-fighting.
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {edges && visible && (
        <lineSegments>
          <primitive attach="geometry" object={edges} />
          <lineBasicMaterial
            color={visual.edgeColor}
            transparent={isTransparent}
            opacity={opacity}
            // Edges should always draw on top of their own surface; test but
            // don't write so we still occlude against other geometry.
            depthWrite={false}
          />
        </lineSegments>
      )}
    </>
  );
}

export default ThreeObjectMesh;
