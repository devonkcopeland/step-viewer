import { useState } from "react";
import FileUploadBox from "./components/FileUploadBox";
import {
  OcctImportJSResult,
  OcctImportMesh,
} from "../public/occt-import-js/types";
import ThreeCanvas from "./components/ThreeCanvas";
import ThreeObjectMesh from "./components/ThreeObjectMesh";
import ThreeEnvironment from "./components/ThreeEnvironment";

function App() {
  const [objects, setObjects] = useState<
    {
      id: number;
      color: [number, number, number];
      mesh: OcctImportMesh;
    }[]
  >([]);
  const handleLoadFromFile = async (file: File | Blob) => {
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

  return (
    <div className="h-screen w-screen relative">
      {objects.length === 0 ? (
        <FileUploadBox onFileLoad={handleLoadFromFile} />
      ) : (
        <>
          <button
            onClick={() => setObjects([])}
            className="absolute z-50 top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
          >
            Reset
          </button>
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
        </>
      )}
    </div>
  );
}

export default App;
