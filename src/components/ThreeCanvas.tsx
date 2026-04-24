import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bounds,
  OrthographicCamera,
  TrackballControls,
} from "@react-three/drei";
import {
  Children,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_NAVIGATION_MODE,
  getNavigationPreset,
  NavigationMode,
} from "../lib/navigationModes";

/*
 * Control / Bounds pitfalls we're working around:
 *
 * 1. three-stdlib's TrackballControls has a broken ortho zoom-out guard
 *    (`zoom < maxDistance * maxDistance`). With the default
 *    `maxDistance = Infinity`, that's always true, so zoom-out is silently
 *    cancelled. Fix: keep `maxDistance` clamped to 0 so the guard is always
 *    false for any positive `object.zoom`.
 *
 * 2. drei's <Bounds clip> calls `controls.maxDistance = distance * 10` after
 *    fitting, which immediately re-triggers bug #1. Fix: don't use `clip`.
 *    We're on an OrthographicCamera with a very wide near/far range, so we
 *    don't need dynamic near/far adjustment.
 *
 * 3. TrackballControls latches its internal _eye / reset baselines at mount,
 *    using whatever camera state exists at that instant. <Bounds fit> moves
 *    the camera AFTER the controls mount, leaving them with stale baselines
 *    and causing "stuck rotation" on first load. Fix: remount the controls
 *    (via `key`) shortly after the Bounds fit animation settles.
 */

const BOUNDS_MAX_DURATION_S = 1;
const BOUNDS_SETTLE_MS = BOUNDS_MAX_DURATION_S * 1000 + 50;

type TrackballControlsImpl = {
  maxDistance: number;
  mouseButtons: { LEFT: number; MIDDLE: number; RIGHT: number };
  update: () => void;
};

const ThreeCanvas = ({
  children,
  controlsEnabled = true,
  navigationMode = DEFAULT_NAVIGATION_MODE,
}: {
  children: React.ReactNode;
  controlsEnabled?: boolean;
  navigationMode?: NavigationMode;
}) => {
  const [controlsKey, setControlsKey] = useState(0);
  const childCount = Children.count(children);
  const controlsRef = useRef<TrackballControlsImpl | null>(null);
  const preset = getNavigationPreset(navigationMode);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    c.mouseButtons = { ...preset.mouseButtons };
  }, [preset, controlsKey]);

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
          <TrackballControls
            key={controlsKey}
            ref={controlsRef}
            makeDefault
            rotateSpeed={5}
            zoomSpeed={1.8}
            panSpeed={0.8}
            staticMoving
            maxDistance={0}
            mouseButtons={preset.mouseButtons}
            noRotate={!controlsEnabled}
            noPan={!controlsEnabled}
            noZoom={!controlsEnabled}
          />
          <MaxDistanceGuard controlsRef={controlsRef} />
          {/* `observe` so Bounds auto-refits when a new model loads.
              `clip` intentionally omitted — it would overwrite
              controls.maxDistance and re-enable the zoom-out bug. */}
          <Bounds
            fit
            observe
            margin={1.2}
            maxDuration={BOUNDS_MAX_DURATION_S}
          >
            {children}
          </Bounds>
        </Canvas>
      </Suspense>
    </div>
  );
};

/**
 * Belt-and-braces: if anything ever tries to set TrackballControls.maxDistance
 * back to a positive number (e.g. a future Bounds tweak, a different control
 * helper, etc.), snap it back to 0 to keep ortho zoom-out working.
 */
function MaxDistanceGuard({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<TrackballControlsImpl | null>;
}) {
  useFrame(() => {
    const c = controlsRef.current;
    if (c && c.maxDistance !== 0) {
      c.maxDistance = 0;
    }
  });
  return null;
}

export default ThreeCanvas;
