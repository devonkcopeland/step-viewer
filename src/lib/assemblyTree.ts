import {
  OcctImportJSResult,
  OcctImportNode,
} from "../../public/occt-import-js/types";

/**
 * Normalized, UI-friendly view of the assembly tree produced by occt-import-js.
 *
 * occt's raw tree has:
 *   - optional / sometimes-blank names
 *   - mesh references as indices into a flat meshes array
 *
 * We add:
 *   - stable path-based ids (so React state can key off them even if names
 *     collide across branches)
 *   - sensible fallback names
 *   - a separate "subassembly vs part" distinction — a node is a part if it
 *     owns meshes and has no children; a subassembly otherwise.
 */
export type AssemblyNode = {
  id: string;
  name: string;
  meshIndices: number[];
  children: AssemblyNode[];
};

export type NodeOverride = {
  color?: [number, number, number];
  opacity?: number;
  hidden?: boolean;
};

export type NodeOverrides = Record<string, NodeOverride>;

export type EffectiveMeshStyle = {
  color: [number, number, number];
  opacity: number;
  visible: boolean;
};

const ROOT_ID = "/";

function sanitizeName(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function buildAssemblyTree(
  result: OcctImportJSResult,
  rootFallbackName: string
): AssemblyNode {
  const build = (
    node: OcctImportNode,
    path: string,
    fallbackName: string
  ): AssemblyNode => {
    const children = (node.children ?? []).map((child, i) =>
      build(child, `${path}/${i}`, `Part ${i + 1}`)
    );
    return {
      id: path === "" ? ROOT_ID : path,
      name: sanitizeName(node.name, fallbackName),
      meshIndices: [...(node.meshes ?? [])],
      children,
    };
  };
  return build(result.root, "", rootFallbackName);
}

/** Flat count of parts (leaf-owning-meshes) in the tree. */
export function countParts(tree: AssemblyNode): number {
  let count = 0;
  const walk = (node: AssemblyNode) => {
    if (node.children.length === 0 && node.meshIndices.length > 0) {
      count += 1;
    } else {
      // subassemblies can still directly own meshes; count those as one part too
      if (node.meshIndices.length > 0 && node.children.length > 0) count += 1;
    }
    for (const c of node.children) walk(c);
  };
  walk(tree);
  return count;
}

/**
 * Map each mesh index to its ancestor chain, leaf-first.
 *
 * Example: for a mesh owned by node `/1/2`, the chain is
 * ["/1/2", "/1", "/"].
 *
 * Leaf-first ordering means the first defined override in the chain wins,
 * which is what a user expects: setting a color on the innermost node you
 * clicked should take precedence over an enclosing subassembly's override.
 */
export function buildMeshOwnership(tree: AssemblyNode): Map<number, string[]> {
  const map = new Map<number, string[]>();
  const walk = (node: AssemblyNode, ancestors: string[]) => {
    const chain = [node.id, ...ancestors];
    for (const idx of node.meshIndices) {
      map.set(idx, chain);
    }
    for (const child of node.children) walk(child, chain);
  };
  walk(tree, []);
  return map;
}

/**
 * Compute the effective render style for a single mesh.
 *
 * - `color` / `opacity`: first defined override wins, walking leaf→root.
 * - `visible`: hidden if *any* ancestor (including the leaf node itself) is
 *   hidden. Hiding a subassembly hides everything inside it, even if a child
 *   is individually marked visible.
 */
export function effectiveMeshStyle(
  meshIndex: number,
  ownership: Map<number, string[]>,
  overrides: NodeOverrides,
  baseColor: [number, number, number]
): EffectiveMeshStyle {
  const chain = ownership.get(meshIndex) ?? [];
  let color: [number, number, number] | undefined;
  let opacity: number | undefined;
  let hidden = false;

  for (const nodeId of chain) {
    const o = overrides[nodeId];
    if (!o) continue;
    if (o.hidden) hidden = true;
    if (color === undefined && o.color) color = o.color;
    if (opacity === undefined && typeof o.opacity === "number") {
      opacity = o.opacity;
    }
  }

  return {
    color: color ?? baseColor,
    opacity: typeof opacity === "number" ? opacity : 1,
    visible: !hidden,
  };
}

/**
 * Deterministic pre-order traversal for rendering the panel.
 * Skipping the implicit root is handy when the root is just the file itself.
 */
export function flattenForDisplay(tree: AssemblyNode): AssemblyNode[] {
  const out: AssemblyNode[] = [];
  const walk = (n: AssemblyNode) => {
    out.push(n);
    for (const c of n.children) walk(c);
  };
  walk(tree);
  return out;
}

/** Convenience: "is this node itself rendered?" (directly owns mesh geometry) */
export function nodeHasOwnMeshes(node: AssemblyNode): boolean {
  return node.meshIndices.length > 0;
}
