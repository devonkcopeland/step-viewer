import { Canvas } from "@react-three/fiber";
import { Bounds, OrthographicCamera, TrackballControls } from "@react-three/drei";
import { Children, Suspense, useEffect, useState } from "react";

// BOUNDS_SETTLE_MS must be >= the Bounds maxDuration (in seconds * 1000) plus a
// small buffer, so TrackballControls remounts AFTER Bounds finishes moving the
// camera. Otherwise TrackballControls latches its internal _eye/target from the
// pre-fit camera position, causing "stuck rotation" on first load.
const BOUNDS_MAX_DURATION_S = 1;
const BOUNDS_SETTLE_MS = BOUNDS_MAX_DURATION_S * 1000 + 50;

const ThreeCanvas = ({
  children,
  controlsEnabled = true,
}: {
  children: React.ReactNode;
  controlsEnabled?: boolean;
}) => {
  // Bump this every time the rendered mesh set changes so TrackballControls
  // re-mounts with the camera state Bounds just settled on.
  const [controlsKey, setControlsKey] = useState(0);
  const childCount = Children.count(children);

  useEffect(() => {
    const id = setTimeout(
      () => setControlsKey((k) => k + 1),
      BOUNDS_SETTLE_MS
    );
    return () => clearTimeout(id);
  }, [childCount]);

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
          <OrthographicCamera
            makeDefault
            position={[5, 5, 5]}
            zoom={50}
            near={-1000}
            far={1000}
          />
          {/* TrackballControls: unrestricted free-orbit (no up-vector lockout) */}
          <TrackballControls
            key={controlsKey}
            makeDefault
            rotateSpeed={5}
            zoomSpeed={1.2}
            panSpeed={0.8}
            staticMoving
            noRotate={!controlsEnabled}
            noPan={!controlsEnabled}
            noZoom={!controlsEnabled}
          />
          <Bounds fit clip observe margin={1.2} maxDuration={BOUNDS_MAX_DURATION_S}>
            {children}
          </Bounds>
        </Canvas>
      </Suspense>
    </div>
  );
};

export default ThreeCanvas;
