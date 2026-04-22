import { Environment, GizmoHelper, GizmoViewport } from "@react-three/drei";

const ThreeEnvironment = () => {
  return (
    <>
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["#e53935", "#43a047", "#1e88e5"]}
          labelColor="white"
        />
      </GizmoHelper>
      <ambientLight intensity={0.5} />
      <Environment preset="city" />
    </>
  );
};

export default ThreeEnvironment;
