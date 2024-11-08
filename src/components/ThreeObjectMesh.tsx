import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Edges } from "@react-three/drei";
import { OcctImportMesh } from "../../public/occt-import-js/types";

function ThreeObjectMesh({
  mesh,
  color,
}: {
  mesh: OcctImportMesh;
  color: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometryLoaded, setGeometryLoaded] = useState(false);

  useEffect(() => {
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
    setGeometryLoaded(true);
  }, [mesh]);

  const colorString = useMemo(() => {
    return `rgb(${color[0] * 255},${color[1] * 255},${color[2] * 255})`;
  }, [color]);

  return (
    <mesh ref={meshRef}>
      <meshStandardMaterial color={colorString} />
      {geometryLoaded && <Edges scale={1} threshold={40} color="lightgray" />}
    </mesh>
  );
}

export default ThreeObjectMesh;
