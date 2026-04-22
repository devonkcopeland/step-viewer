import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  OcctImportJSResult,
  OcctImportMesh,
} from "../public/occt-import-js/types";

type LoadedObject = {
  id: number;
  color: [number, number, number];
  mesh: OcctImportMesh;
};

function isStepFile(file: File) {
  const n = file.name.toLowerCase();
  return n.endsWith(".step") || n.endsWith(".stp");
}

function App() {
  const [objects, setObjects] = useState<LoadedObject[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [annotating, setAnnotating] = useState(false);
  const [annotationColor, setAnnotationColor] = useState("#ef4444");
  const [annotationWidth, setAnnotationWidth] = useState(3);

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
        const next = result.meshes.map((mesh, index) => ({
          id: index,
          color: (isOcctDefaultGray(mesh.color)
            ? DEFAULT_COLOR
            : mesh.color) as [number, number, number],
          mesh,
        }));
        setObjects(next);
        setStatus("Ready");
      } catch (err) {
        console.error(err);
        setStatus("Failed to load file");
        setFileName(null);
        setFileBlob(null);
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
    setObjects([]);
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

  const handleOpenClick = useCallback(() => {
    hiddenInputRef.current?.click();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exampleName = params.get("example");
    if (!exampleName) return;
    if (!/^[\w.\-]+\.(step|stp)$/i.test(exampleName)) {
      console.warn(`Invalid example name: ${exampleName}`);
      setStatus("Invalid example name in URL");
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
        // Vite's dev server falls back to index.html for unknown paths, so a
        // 200 OK here can still be HTML. Detect that and fail loudly.
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
  }, [handleLoadFromSource]);

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

  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto] bg-background font-sans text-foreground">
      <Header
        hasModel={hasModel}
        onOpenClick={handleOpenClick}
        onResetClick={handleReset}
        canDownload={!!fileBlob}
        onDownloadClick={handleDownload}
        annotating={annotating}
        onAnnotateClick={handleToggleAnnotate}
      />

      <main className="viewer-grid relative overflow-hidden">
        {hasModel && (
          <ThreeCanvas controlsEnabled={!annotating}>
            <ThreeEnvironment />
            {objects.map((object) => (
              <ThreeObjectMesh
                key={object.id}
                mesh={object.mesh}
                color={object.color}
              />
            ))}
          </ThreeCanvas>
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
                className="w-24 accent-[var(--theme-primary)]"
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
          <EmptyState onFileSelected={handleLoadFromFile} />
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
