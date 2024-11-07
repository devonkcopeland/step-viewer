import { Environment, GizmoHelper, GizmoViewport } from "@react-three/drei";

const ThreeEnvironment = () => {
  return (
    <>
      <GizmoHelper alignment="bottom-right">
        <GizmoViewport labelColor="white" />
      </GizmoHelper>
      <ambientLight intensity={0.5} />
      <Environment preset="city" />
    </>
  );
};

export default ThreeEnvironment;
