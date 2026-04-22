import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoaderOverlay from "./components/LoaderOverlay";
import EmptyState from "./components/EmptyState";
import DropOverlay from "./components/DropOverlay";
import ThreeCanvas from "./components/ThreeCanvas";
import ThreeEnvironment from "./components/ThreeEnvironment";
import ThreeObjectMesh from "./components/ThreeObjectMesh";
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
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Ready");

  const dragCounter = useRef(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleLoadFromFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setStatus("Parsing geometry…");
    try {
      // @ts-ignore - global injected by occt-import-js.js in index.html
      const occt = await occtimportjs();
      const buffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(buffer);
      const result: OcctImportJSResult = occt.ReadStepFile(fileBuffer, null);
      if (!result.success) {
        throw new Error("Failed to parse STEP file");
      }
      const next = result.meshes.map((mesh, index) => ({
        id: index,
        color: (mesh.color ?? [1, 1, 1]) as [number, number, number],
        mesh,
      }));
      setObjects(next);
      setStatus("Ready");
    } catch (err) {
      console.error(err);
      setStatus("Failed to load file");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setObjects([]);
    setFileName(null);
    setStatus("Ready");
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
      />

      <main className="viewer-grid relative overflow-hidden">
        {hasModel && (
          <ThreeCanvas>
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
