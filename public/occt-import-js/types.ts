export interface OcctImportJSResult {
  success: boolean;
  root: OcctImportNode;
  meshes: OcctImportMesh[];
}

export interface OcctImportNode {
  name: string;
  meshes: number[]; // Array of indices pointing to meshes in the OcctImportJSResult.meshes array
  children: OcctImportNode[]; // Recursive structure for child nodes
}

export interface OcctImportMesh {
  name: string;
  color?: [number, number, number]; // array of r, g, b values
  brep_faces: OcctImportBrepFace[];
  attributes: {
    position: OcctImportVertexAttribute;
    normal?: OcctImportVertexAttribute;
  };
  index: {
    array: number[];
  };
}

export interface OcctImportBrepFace {
  first: number; // The first triangle index of the face
  last: number; // The last triangle index of the face
  color: number[] | null; // Array of r, g, b values
}

export interface OcctImportVertexAttribute {
  array: number[]; // Array of number triplets (for positions or normals)
}
