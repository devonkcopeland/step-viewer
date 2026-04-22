import { Canvas } from "@react-three/fiber";
import { Bounds, PerspectiveCamera, TrackballControls } from "@react-three/drei";
import { Suspense } from "react";

const ThreeCanvas = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full flex-col">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
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
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />
          {/* TrackballControls: unrestricted free-orbit (no up-vector lockout) */}
          <TrackballControls
            makeDefault
            rotateSpeed={3.2}
            zoomSpeed={1.2}
            panSpeed={0.8}
            staticMoving={false}
            dynamicDampingFactor={0.15}
          />
          <Bounds fit clip observe margin={1.2} maxDuration={1}>
            {children}
          </Bounds>
        </Canvas>
      </Suspense>
    </div>
  );
};

export default ThreeCanvas;
