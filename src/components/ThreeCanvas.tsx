import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bounds,
  Center,
  OrbitControls,
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
import * as THREE from "three";
import {
  DEFAULT_NAVIGATION_MODE,
  getNavigationPreset,
  NavigationMode,
} from "../lib/navigationModes";
import {
  buttonFromEvent,
  matchAction,
  modifierFromEvent,
  mouseButtonsForAction,
  TrackballMouseButtons,
} from "../lib/navigationBindings";
import { useCoarsePointer } from "../lib/pointer";

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
 *
 * 4. TrackballControls ignores modifier keys (ctrlKey/shiftKey/altKey) so
 *    presets like SolidWorks Ctrl+MMB pan or Fusion Shift+MMB orbit can't be
 *    expressed through `mouseButtons` alone. Fix: `ModifierAwareBindings`
 *    listens for pointerdown in the capture phase and rewrites
 *    `controls.mouseButtons` based on (button, modifier) BEFORE
 *    TrackballControls's own pointerdown handler reads it.
 *
 * 5. three-stdlib's TrackballControls explicitly ignores touch events — its
 *    `onPointerDown` has a `switch (pointerType) { case "mouse": case "pen" }`
 *    and does nothing for `"touch"`. On phones/tablets the control is dead.
 *    Fix: swap to OrbitControls on coarse-pointer devices. OrbitControls has
 *    native touch support (one-finger orbit, two-finger pinch-zoom + pan) and
 *    works great with OrthographicCamera too.
 */

const BOUNDS_MAX_DURATION_S = 1;
const BOUNDS_SETTLE_MS = BOUNDS_MAX_DURATION_S * 1000 + 50;

type TrackballControlsImpl = {
  maxDistance: number;
  mouseButtons: TrackballMouseButtons;
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
  const isTouch = useCoarsePointer();
  // Changes whenever the mesh set changes. DesktopControls uses this to
  // re-latch its internal baselines after Bounds animates to the new geometry.
  const sceneKey = Children.count(children);

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
          {/*
           * `near` / `far` are measured along the camera's forward axis from
           * the camera's own position. After <Bounds fit>, drei places the
           * camera at `distance = maxSize * 4 * margin` along the view
           * direction — for a 250mm part that's already ~1200 units, and for
           * larger assemblies it can easily exceed 10 000. If the geometry
           * ends up beyond `far`, the whole model clips away and the canvas
           * renders empty (this was the "some solids don't show up" bug).
           *
           * We use an over-provisioned symmetric range so Bounds can push the
           * camera as far out as it wants without clipping. Ortho projection
           * doesn't suffer from a wide near/far the way perspective does, so
           * there's no depth-precision cost to being generous here.
           */}
          <OrthographicCamera
            makeDefault
            position={[5, 5, 5]}
            zoom={50}
            near={-100000}
            far={100000}
          />
          {isTouch ? (
            <TouchControls enabled={controlsEnabled} />
          ) : (
            <DesktopControls
              enabled={controlsEnabled}
              navigationMode={navigationMode}
              sceneKey={sceneKey}
            />
          )}
          {/* `observe` so Bounds auto-refits when a new model loads.
              `clip` intentionally omitted — it would overwrite
              controls.maxDistance and re-enable the zoom-out bug.
              <Center> keeps the model at the local origin so camera orbit
              feels natural regardless of the authoring coordinate system. */}
          <Bounds
            fit
            observe
            margin={1.2}
            maxDuration={BOUNDS_MAX_DURATION_S}
          >
            <Center>{children}</Center>
          </Bounds>
        </Canvas>
      </Suspense>
    </div>
  );
};

/**
 * Desktop/mouse path: TrackballControls with all the modifier-key and
 * zoom-out fixes. Extracted so the touch/desktop branches can remount
 * cleanly (they use completely different control classes).
 */
function DesktopControls({
  enabled,
  navigationMode,
  sceneKey,
}: {
  enabled: boolean;
  navigationMode: NavigationMode;
  sceneKey: number;
}) {
  const [controlsKey, setControlsKey] = useState(0);
  const controlsRef = useRef<TrackballControlsImpl | null>(null);
  const preset = getNavigationPreset(navigationMode);

  // Remount the controls after Bounds settles so their internal
  // reset/eye baselines match the post-fit camera state. Re-runs on scene
  // changes so loading a second file relatches baselines against the new fit.
  useEffect(() => {
    const id = setTimeout(
      () => setControlsKey((k) => k + 1),
      BOUNDS_SETTLE_MS
    );
    return () => clearTimeout(id);
  }, [sceneKey]);

  return (
    <>
      <TrackballControls
        key={controlsKey}
        ref={controlsRef}
        makeDefault
        rotateSpeed={5}
        zoomSpeed={1.8}
        panSpeed={0.8}
        staticMoving
        maxDistance={0}
        noRotate={!enabled}
        noPan={!enabled}
        noZoom={!enabled}
      />
      <MaxDistanceGuard controlsRef={controlsRef} />
      <ModifierAwareBindings
        controlsRef={controlsRef}
        preset={preset}
        enabled={enabled}
      />
    </>
  );
}

/**
 * Touch/phone/tablet path: OrbitControls with its native gestures.
 *
 * OrbitControls maps:
 *   - 1-finger drag → rotate
 *   - 2-finger pinch → zoom
 *   - 2-finger drag → pan
 *
 * which is exactly what a user expects from a 3D viewer on a phone. We bump
 * `rotateSpeed` a bit because fingers can't cover as much screen per unit of
 * time as a mouse can.
 */
function TouchControls({ enabled }: { enabled: boolean }) {
  return (
    <OrbitControls
      makeDefault
      enabled={enabled}
      enablePan
      enableZoom
      enableRotate={enabled}
      enableDamping
      dampingFactor={0.15}
      rotateSpeed={1}
      zoomSpeed={1.2}
      panSpeed={1}
      // Allow full vertical orbit so the user can look at the model from
      // any angle, same as TrackballControls on desktop.
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      // Fingers can't "middle click" to drag-zoom, so map the touch gestures
      // explicitly (this is OrbitControls' default too, but being explicit
      // documents the intent).
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}

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

/**
 * Adds modifier-key support to TrackballControls. Captures pointerdown on
 * the WebGL canvas *before* TrackballControls's own (bubble-phase) handler
 * runs, inspects (button, modifier), and rewrites
 * `controls.mouseButtons` so the underlying control dispatches the intended
 * action.
 *
 * Also handles the context menu: if a binding uses RMB, we suppress the
 * browser's default context menu so right-drag works.
 */
function ModifierAwareBindings({
  controlsRef,
  preset,
  enabled,
}: {
  controlsRef: React.MutableRefObject<TrackballControlsImpl | null>;
  preset: ReturnType<typeof getNavigationPreset>;
  enabled: boolean;
}) {
  const { gl } = useThree();
  // Keep a ref to the latest preset so listeners always read current bindings
  // without needing to re-bind the event listener.
  const presetRef = useRef(preset);
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;

    // Fast-path: only react to events that are going to hit the canvas,
    // filtering out pointerdowns elsewhere on the page.
    const isForCanvas = (e: Event) => e.target === canvas;

    const onPointerDown = (e: Event) => {
      if (!isForCanvas(e)) return;
      const controls = controlsRef.current;
      if (!controls) return;

      const pe = e as PointerEvent;
      const button = buttonFromEvent(pe);
      if (button === null) return;

      const modifier = modifierFromEvent(pe);
      const action = matchAction(presetRef.current.bindings, button, modifier);
      controls.mouseButtons = mouseButtonsForAction(pe.button, action);
    };

    // Right-click context menu would otherwise pop up during an RMB-drag
    // rotate/pan and kill the drag mid-motion.
    const onContextMenu = (e: Event) => {
      if (!isForCanvas(e)) return;
      e.preventDefault();
    };

    // Register on window in capture phase so we run *before* TrackballControls'
    // pointerdown listener on the canvas (which is in the target phase).
    // Capture-phase listeners on ancestor nodes always fire before any
    // listener on the target element.
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    canvas.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl, controlsRef, enabled]);

  return null;
}

export default ThreeCanvas;
