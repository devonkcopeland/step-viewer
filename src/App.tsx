import { useEffect, useRef, useState } from "react";
import FileUploadBox from "./components/FileUploadBox";
import {
  OcctImportJSResult,
  OcctImportMesh,
} from "../public/occt-import-js/types";
import ThreeCanvas from "./components/ThreeCanvas";
import ThreeObjectMesh from "./components/ThreeObjectMesh";
import ThreeEnvironment from "./components/ThreeEnvironment";
import AnnotationCanvas, {
  AnnotationCanvasHandle,
} from "./components/AnnotationCanvas";

const EXAMPLES: Record<string, string> = {
  "intern-dfm-part": "/examples/intern-dfm-part-23892389231.step",
  "scanner-holder": "/examples/scanner-holder-9238924898423.step",
};

function App() {
  const [objects, setObjects] = useState<
    {
      id: number;
      color: [number, number, number];
      mesh: OcctImportMesh;
    }[]
  >([]);
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    blob: Blob;
  } | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const [annotationColor, setAnnotationColor] = useState("#ef4444");
  const [annotationWidth, setAnnotationWidth] = useState(3);
  const annotationRef = useRef<AnnotationCanvasHandle>(null);

  const handleLoadFromFile = async (file: File | Blob, name?: string) => {
    const fileName =
      name ?? (file instanceof File ? file.name : "model.step");
    setCurrentFile({ name: fileName, blob: file });
    // @ts-ignore - typecript not recognizing import in index.html
    occtimportjs().then(async (occt) => {
      let buffer = await file.arrayBuffer();
      let fileBuffer = new Uint8Array(buffer);
      let result: OcctImportJSResult = occt.ReadStepFile(fileBuffer, null);
      const objects = result.meshes.map((mesh, index) => {
        return {
          id: index,
          color: mesh.color ?? [1, 1, 1],
          mesh: mesh,
        };
      });
      setObjects(objects);
    });
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const url = URL.createObjectURL(currentFile.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setObjects([]);
    setCurrentFile(null);
    setAnnotating(false);
  };

  const toggleAnnotating = () => {
    setAnnotating((prev) => {
      if (prev) annotationRef.current?.clear();
      return !prev;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exampleName = params.get("example");
    if (!exampleName) return;
    const examplePath = EXAMPLES[exampleName];
    if (!examplePath) {
      console.warn(`Unknown example: ${exampleName}`);
      return;
    }
    fetch(examplePath)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${examplePath}`);
        return res.blob();
      })
      .then((blob) =>
        handleLoadFromFile(blob, examplePath.split("/").pop())
      )
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="h-screen w-screen relative">
      {objects.length === 0 ? (
        <FileUploadBox onFileLoad={handleLoadFromFile} />
      ) : (
        <>
          <div className="absolute z-50 top-2 right-2 flex gap-2 items-center">
            {annotating && (
              <div className="flex items-center gap-2 bg-white/90 px-2 py-1 rounded-md shadow">
                <input
                  type="color"
                  value={annotationColor}
                  onChange={(e) => setAnnotationColor(e.target.value)}
                  className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
                  title="Color"
                />
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={annotationWidth}
                  onChange={(e) =>
                    setAnnotationWidth(Number(e.target.value))
                  }
                  className="w-24"
                  title="Line width"
                />
                <button
                  onClick={() => annotationRef.current?.clear()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded-md text-sm"
                >
                  Clear
                </button>
              </div>
            )}
            <button
              onClick={toggleAnnotating}
              className={`p-2 rounded-md text-white ${
                annotating
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {annotating ? "Done" : "Annotate"}
            </button>
            {currentFile && (
              <button
                onClick={handleDownload}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md"
              >
                Download
              </button>
            )}
            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
            >
              Reset
            </button>
          </div>
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
          {annotating && (
            <AnnotationCanvas
              ref={annotationRef}
              color={annotationColor}
              lineWidth={annotationWidth}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
