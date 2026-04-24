import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Edges } from "@react-three/drei";
import { OcctImportMesh } from "../../public/occt-import-js/types";

// Matches the finalrev viewer's edge threshold for consistent detail level.
const EDGE_THRESHOLD_DEGREES = 15;

function ThreeObjectMesh({
  mesh,
  color,
  opacity = 1,
  visible = true,
}: {
  mesh: OcctImportMesh;
  color: [number, number, number];
  opacity?: number;
  visible?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometryLoaded, setGeometryLoaded] = useState(false);

  // Populate the BufferGeometry in useLayoutEffect (not useEffect) so that the
  // attributes are already set when any parent's layout effect runs. In
  // particular, drei's <Bounds> does box.setFromObject in its own
  // useLayoutEffect; if we wrote positions in a passive useEffect, Bounds
  // would see an empty geometry, fall back to a dummy origin-centered box,
  // and fit the camera to the wrong place — so parts whose coordinates don't
  // straddle the origin (e.g. intern-dfm-part) ended up offscreen on first
  // load.
  useLayoutEffect(() => {
    if (!meshRef?.current?.geometry) return;
    const geom = meshRef.current.geometry as THREE.BufferGeometry;
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3)
    );
    if (mesh.attributes.normal) {
      geom.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3)
      );
    }
    if (mesh.index) {
      geom.setIndex(mesh.index.array);
    }
    // Proactively compute the bounding box/sphere so any downstream code
    // that reads geometry.boundingBox (instead of iterating the position
    // attribute) gets accurate numbers without a second pass.
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    setGeometryLoaded(true);
  }, [mesh]);

  const colorString = useMemo(() => {
    return `rgb(${Math.round(color[0] * 255)},${Math.round(
      color[1] * 255
    )},${Math.round(color[2] * 255)})`;
  }, [color]);

  const isTransparent = opacity < 1;

  return (
    <mesh ref={meshRef} visible={visible}>
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
      {geometryLoaded && (
        <Edges
          scale={1}
          threshold={EDGE_THRESHOLD_DEGREES}
          color="#0a0a0a"
          lineWidth={1.2}
        />
      )}
    </mesh>
  );
}

export default ThreeObjectMesh;
