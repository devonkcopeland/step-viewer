import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoaderOverlay from "./components/LoaderOverlay";
import EmptyState from "./components/EmptyState";
import DropOverlay from "./components/DropOverlay";
import ThreeCanvas from "./components/ThreeCanvas";
import ThreeEnvironment from "./components/ThreeEnvironment";
import ThreeObjectMesh from "./components/ThreeObjectMesh";
import AnnotationCanvas, {
  AnnotationCanvasHandle,
} from "./components/AnnotationCanvas";
import NavigationModeDialog from "./components/NavigationModeDialog";
import AssemblyTreePanel from "./components/AssemblyTreePanel";
import {
  DEFAULT_NAVIGATION_MODE,
  NAVIGATION_PRESETS,
  NavigationMode,
} from "./lib/navigationModes";
import {
  AssemblyNode,
  NodeOverride,
  NodeOverrides,
  buildAssemblyTree,
  buildMeshOwnership,
  effectiveMeshStyle,
} from "./lib/assemblyTree";
import {
  OcctImportJSResult,
  OcctImportMesh,
} from "../public/occt-import-js/types";

const NAV_STORAGE_KEY = "step-viewer/navigation-mode";

function loadInitialNavigationMode(): NavigationMode {
  try {
    const stored = window.localStorage.getItem(NAV_STORAGE_KEY);
    if (stored && NAVIGATION_PRESETS.some((p) => p.id === stored)) {
      return stored as NavigationMode;
    }
  } catch {
    // ignore localStorage access errors (SSR, privacy mode, etc.)
  }
  return DEFAULT_NAVIGATION_MODE;
}

/**
 * True only on the user's first visit (nothing stored yet). Must be computed
 * during render / state init — the persistence effect writes the default mode
 * on mount, so by the time any effect runs the key is already populated.
 */
function isFirstNavigationVisit(): boolean {
  try {
    return window.localStorage.getItem(NAV_STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

type LoadedObject = {
  id: number;
  color: [number, number, number];
  mesh: OcctImportMesh;
  // Pre-built on load so <Bounds> always observes real geometry with a valid
  // bounding box at first mount. Building it later (inside the mesh component
  // via a layout effect) races Bounds's own fit pass and makes some parts land
  // offscreen on first load — which is exactly the finalrev repo's approach.
  geometry: THREE.BufferGeometry;
};

function buildGeometry(mesh: OcctImportMesh): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      Array.from(mesh.attributes.position.array),
      3
    )
  );
  if (mesh.attributes.normal) {
    geom.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(
        Array.from(mesh.attributes.normal.array),
        3
      )
    );
  }
  if (mesh.index) {
    geom.setIndex(Array.from(mesh.index.array));
  }
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

function isStepFile(file: File) {
  const n = file.name.toLowerCase();
  return n.endsWith(".step") || n.endsWith(".stp");
}

function App() {
  const [objects, setObjects] = useState<LoadedObject[]>([]);
  const [assemblyTree, setAssemblyTree] = useState<AssemblyNode | null>(null);
  const [nodeOverrides, setNodeOverrides] = useState<NodeOverrides>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [annotating, setAnnotating] = useState(false);
  const [annotationColor, setAnnotationColor] = useState("#ef4444");
  const [annotationWidth, setAnnotationWidth] = useState(3);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>(
    loadInitialNavigationMode
  );
  const [isFirstVisit, setIsFirstVisit] = useState(isFirstNavigationVisit);
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(isFirstVisit);

  useEffect(() => {
    try {
      window.localStorage.setItem(NAV_STORAGE_KEY, navigationMode);
    } catch {
      // ignore
    }
  }, [navigationMode]);

  const dragCounter = useRef(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const annotationRef = useRef<AnnotationCanvasHandle>(null);

  const handleLoadFromSource = useCallback(
    async (source: File | Blob, name: string) => {
      setFileName(name);
      setFileBlob(source);
      setLoading(true);
      setStatus("Parsing geometry…");
      try {
        // @ts-ignore - global injected by occt-import-js.js in index.html
        const occt = await occtimportjs();
        const buffer = await source.arrayBuffer();
        const fileBuffer = new Uint8Array(buffer);
        const result: OcctImportJSResult = occt.ReadStepFile(fileBuffer, null);
        if (!result.success) {
          throw new Error("Failed to parse STEP file");
        }
        const DEFAULT_COLOR: [number, number, number] = [0.88, 0.9, 0.92];
        const isOcctDefaultGray = (c?: number[]) =>
          !c ||
          (Math.abs(c[0] - c[1]) < 0.01 &&
            Math.abs(c[1] - c[2]) < 0.01 &&
            c[0] < 0.85);
        const next: LoadedObject[] = result.meshes.map((mesh, index) => ({
          id: index,
          color: (isOcctDefaultGray(mesh.color)
            ? DEFAULT_COLOR
            : mesh.color) as [number, number, number],
          mesh,
          geometry: buildGeometry(mesh),
        }));
        // Dispose previous geometries to release GPU/CPU memory when loading a
        // second file in the same session.
        setObjects((prev) => {
          for (const obj of prev) obj.geometry.dispose();
          return next;
        });
        setAssemblyTree(buildAssemblyTree(result, name));
        setNodeOverrides({});
        setStatus("Ready");
      } catch (err) {
        console.error(err);
        setStatus("Failed to load file");
        setFileName(null);
        setFileBlob(null);
        setAssemblyTree(null);
        setNodeOverrides({});
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleLoadFromFile = useCallback(
    (file: File) => handleLoadFromSource(file, file.name),
    [handleLoadFromSource]
  );

  const handleReset = useCallback(() => {
    setObjects((prev) => {
      for (const obj of prev) obj.geometry.dispose();
      return [];
    });
    setAssemblyTree(null);
    setNodeOverrides({});
    setFileName(null);
    setFileBlob(null);
    setStatus("Ready");
    setAnnotating(false);
  }, []);

  const handleDownload = useCallback(() => {
    if (!fileBlob || !fileName) return;
    const url = URL.createObjectURL(fileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [fileBlob, fileName]);

  const handleToggleAnnotate = useCallback(() => {
    setAnnotating((prev) => {
      if (prev) annotationRef.current?.clear();
      return !prev;
    });
  }, []);

  const handleHiddenInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!isStepFile(file)) {
          setStatus("Only .step / .stp files are supported");
          e.target.value = "";
          return;
        }
        void handleLoadFromFile(file);
      }
      e.target.value = "";
    },
    [handleLoadFromFile]
  );

  const handleLoadExample = useCallback(
    (exampleName: string) => {
      if (!/^[\w.\-]+\.(step|stp)$/i.test(exampleName)) {
        console.warn(`Invalid example name: ${exampleName}`);
        setStatus("Invalid example name");
        return;
      }
      const url = `/examples/${exampleName}`;
      setStatus(`Loading example ${exampleName}…`);
      fetch(url)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Example not found (HTTP ${res.status}): ${url}`);
          }
          const contentType = res.headers.get("content-type") ?? "";
          const blob = await res.blob();
          // Vite's dev server falls back to index.html for unknown paths, so
          // a 200 OK here can still be HTML. Detect that and fail loudly.
          if (contentType.includes("text/html")) {
            throw new Error(
              `Example file missing at ${url} (server returned HTML fallback). ` +
              `Place "${exampleName}" in public/examples/.`
            );
          }
          const head = await blob.slice(0, 16).text();
          const looksLikeStep = /^(ISO-10303-21|\s*\/\*|HEADER)/i.test(head);
          if (!looksLikeStep) {
            throw new Error(
              `File at ${url} does not look like a STEP file (got: ${JSON.stringify(
                head.slice(0, 12)
              )}).`
            );
          }
          return blob;
        })
        .then((blob) => handleLoadFromSource(blob, exampleName))
        .catch((err) => {
          console.error(err);
          setStatus(
            err instanceof Error
              ? err.message
              : `Could not load example: ${exampleName}`
          );
        });
    },
    [handleLoadFromSource]
  );

  // Kick off the example load when the URL carries ?example=<name> on first
  // mount. Direct clicks from the empty state reuse `handleLoadExample`
  // without touching the URL, avoiding a full page reload.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exampleName = params.get("example");
    if (exampleName) handleLoadExample(exampleName);
  }, [handleLoadExample]);

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      const hasFiles = Array.from(e.dataTransfer.types).includes("Files");
      if (!hasFiles) return;
      e.preventDefault();
      dragCounter.current += 1;
      setDragActive(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      const hasFiles = Array.from(e.dataTransfer.types).includes("Files");
      if (!hasFiles) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setDragActive(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragActive(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isStepFile(file)) {
        setStatus("Only .step / .stp files are supported");
        return;
      }
      void handleLoadFromFile(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleLoadFromFile]);

  const hasModel = objects.length > 0;

  // Mesh-index → ancestor chain; recomputed only when the tree changes (per
  // file load), so the per-frame render cost of applying overrides is just a
  // small dictionary lookup per mesh.
  const meshOwnership = useMemo(
    () =>
      assemblyTree ? buildMeshOwnership(assemblyTree) : new Map<number, string[]>(),
    [assemblyTree]
  );

  // Base color lookup the tree panel uses to show each node's default swatch
  // when the node has no override. Stable across re-renders as long as the
  // object list doesn't change.
  const baseColorForMesh = useCallback(
    (meshIndex: number): [number, number, number] => {
      const obj = objects[meshIndex];
      return obj?.color ?? [0.88, 0.9, 0.92];
    },
    [objects]
  );

  // Effective render style per object, after applying tree overrides.
  const renderObjects = useMemo(() => {
    if (!assemblyTree) {
      return objects.map((o) => ({
        ...o,
        renderColor: o.color,
        renderOpacity: 1,
        renderVisible: true,
      }));
    }
    return objects.map((o) => {
      const style = effectiveMeshStyle(
        o.id,
        meshOwnership,
        nodeOverrides,
        o.color
      );
      return {
        ...o,
        renderColor: style.color,
        renderOpacity: style.opacity,
        renderVisible: style.visible,
      };
    });
  }, [objects, assemblyTree, meshOwnership, nodeOverrides]);

  const handleOverrideChange = useCallback(
    (nodeId: string, next: NodeOverride | null) => {
      setNodeOverrides((prev) => {
        const copy = { ...prev };
        if (
          next === null ||
          (!next.color && !next.hidden && typeof next.opacity !== "number")
        ) {
          delete copy[nodeId];
        } else {
          copy[nodeId] = next;
        }
        return copy;
      });
    },
    []
  );

  const showAssemblyPanel = !!assemblyTree && hasModel;

  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto] bg-background font-sans text-foreground">
      <Header
        hasModel={hasModel}
        onResetClick={handleReset}
        canDownload={!!fileBlob}
        onDownloadClick={handleDownload}
        annotating={annotating}
        onAnnotateClick={handleToggleAnnotate}
        navigationMode={navigationMode}
        onOpenNavigationModes={() => setNavigationDialogOpen(true)}
      />

      <NavigationModeDialog
        open={navigationDialogOpen}
        value={navigationMode}
        firstVisit={isFirstVisit}
        onChange={setNavigationMode}
        onClose={() => {
          setNavigationDialogOpen(false);
          setIsFirstVisit(false);
        }}
      />

      <main className="viewer-grid relative overflow-hidden">
        {hasModel && (
          <ThreeCanvas
            controlsEnabled={!annotating}
            navigationMode={navigationMode}
          >
            <ThreeEnvironment />
            {renderObjects.map((object) => (
              <ThreeObjectMesh
                key={object.id}
                geometry={object.geometry}
                color={object.renderColor}
                opacity={object.renderOpacity}
                visible={object.renderVisible}
              />
            ))}
          </ThreeCanvas>
        )}

        {hasModel && showAssemblyPanel && assemblyTree && (
          <AssemblyTreePanel
            // Remount the panel when the user loads a different file so
            // internal UI state (expanded set, currently-open settings row)
            // doesn't leak across unrelated trees.
            key={fileName ?? "assembly"}
            tree={assemblyTree}
            overrides={nodeOverrides}
            onOverrideChange={handleOverrideChange}
            baseColorForMesh={baseColorForMesh}
          />
        )}

        {hasModel && annotating && (
          <>
            <AnnotationCanvas
              ref={annotationRef}
              color={annotationColor}
              lineWidth={annotationWidth}
            />
            <div className="absolute right-4 top-4 z-40 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur">
              <input
                type="color"
                value={annotationColor}
                onChange={(e) => setAnnotationColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                title="Stroke color"
              />
              <input
                type="range"
                min={1}
                max={20}
                value={annotationWidth}
                onChange={(e) => setAnnotationWidth(Number(e.target.value))}
                className="w-24 accent-primary"
                title="Stroke width"
              />
              <span className="w-5 text-center text-xs text-muted">
                {annotationWidth}
              </span>
              <button
                type="button"
                onClick={() => annotationRef.current?.clear()}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)]"
              >
                Clear
              </button>
            </div>
          </>
        )}

        {!hasModel && !loading && (
          <EmptyState
            onFileSelected={handleLoadFromFile}
            onExampleSelected={handleLoadExample}
          />
        )}

        {fileName && hasModel && (
          <div className="pointer-events-none absolute bottom-4 left-4 z-10 inline-flex max-w-[60%] items-center gap-2 truncate rounded-lg border border-border bg-background/80 px-3 py-1.5 text-xs text-foreground shadow-sm backdrop-blur">
            <span className="truncate font-medium">{fileName}</span>
          </div>
        )}

        <DropOverlay visible={dragActive} />
        <LoaderOverlay visible={loading} />

        <input
          ref={hiddenInputRef}
          type="file"
          accept=".step,.stp,.STEP,.STP"
          className="hidden"
          onChange={handleHiddenInputChange}
        />
      </main>

      <Footer status={status} />
    </div>
  );
}

export default App;
