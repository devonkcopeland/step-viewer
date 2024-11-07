import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Suspense } from "react";

const ThreeCanvas = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full flex-col">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            Loading...
          </div>
        }
      >
        <Canvas
          shadows
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
          }}
        >
          <OrthographicCamera makeDefault />
          <OrbitControls makeDefault enableDamping dampingFactor={0.3} />
          <Bounds fit clip observe margin={1.2} maxDuration={1}>
            {children}
          </Bounds>
        </Canvas>
      </Suspense>
    </div>
  );
};

export default ThreeCanvas;
