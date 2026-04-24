import { useMemo, useState } from "react";
import {
  AssemblyNode,
  NodeOverride,
  NodeOverrides,
} from "../lib/assemblyTree";

type BaseColorLookup = (meshIndex: number) => [number, number, number];

type Props = {
  tree: AssemblyNode;
  overrides: NodeOverrides;
  onOverrideChange: (nodeId: string, next: NodeOverride | null) => void;
  baseColorForMesh: BaseColorLookup;
};

function rgbToCss(c: [number, number, number]): string {
  return `rgb(${Math.round(c[0] * 255)}, ${Math.round(
    c[1] * 255
  )}, ${Math.round(c[2] * 255)})`;
}

function rgbToHex(c: [number, number, number]): string {
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(c[0])}${to(c[1])}${to(c[2])}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.5, 0.5, 0.5];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

/**
 * Display color for a node's swatch. We care about two things:
 *   - the actual rgb to paint in the circle
 *   - whether this color came from *this* node's override (so we can draw
 *     the "active" ring around the swatch)
 *
 * Resolution order:
 *   1. This node's own override (marked active)
 *   2. First ancestor override (inherited — not marked active)
 *   3. Base color of the first mesh in the node's subtree
 *   4. Neutral gray fallback
 */
function resolveSwatch(
  node: AssemblyNode,
  ancestorChain: string[], // strictly ancestors (not including self)
  overrides: NodeOverrides,
  baseColorForMesh: BaseColorLookup
): { color: [number, number, number]; source: "own" | "inherited" | "base" } {
  const own = overrides[node.id]?.color;
  if (own) return { color: own, source: "own" };

  for (const id of ancestorChain) {
    const c = overrides[id]?.color;
    if (c) return { color: c, source: "inherited" };
  }

  const firstMesh = findFirstMeshInSubtree(node);
  if (firstMesh !== null) {
    return { color: baseColorForMesh(firstMesh), source: "base" };
  }
  return { color: [0.83, 0.83, 0.85], source: "base" };
}

function findFirstMeshInSubtree(node: AssemblyNode): number | null {
  if (node.meshIndices.length > 0) return node.meshIndices[0];
  for (const c of node.children) {
    const m = findFirstMeshInSubtree(c);
    if (m !== null) return m;
  }
  return null;
}

function isHiddenByAncestor(
  ancestorChain: string[],
  overrides: NodeOverrides
): boolean {
  return ancestorChain.some((id) => overrides[id]?.hidden);
}

function AssemblyTreePanel({
  tree,
  overrides,
  onOverrideChange,
  baseColorForMesh,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // Expanded node ids. Default: root and its direct children expanded so the
  // user sees the top couple of levels without any clicks.
  const initialExpanded = useMemo(() => {
    const s = new Set<string>([tree.id]);
    for (const c of tree.children) s.add(c.id);
    return s;
  }, [tree]);
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const partCount = useMemo(() => {
    let n = 0;
    const walk = (node: AssemblyNode) => {
      if (node.children.length === 0 && node.meshIndices.length > 0) n += 1;
      for (const c of node.children) walk(c);
    };
    walk(tree);
    return n;
  }, [tree]);

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-20 flex max-h-[min(70vh,640px)] w-[280px] flex-col overflow-hidden rounded-xl border border-border bg-background/92 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.15)] backdrop-blur">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="group flex items-center justify-between gap-2 border-b border-border/80 px-3 py-2 text-left transition-colors hover:bg-[var(--theme-gray-100)]"
        title={collapsed ? "Expand assembly tree" : "Collapse assembly tree"}
      >
        <div className="flex items-center gap-2">
          <HierarchyIcon />
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            Assembly
          </span>
          <span className="rounded-full bg-[var(--theme-gray-100)] px-1.5 py-0.5 text-[10px] font-medium text-muted">
            {partCount} {partCount === 1 ? "part" : "parts"}
          </span>
        </div>
        <ChevronDown
          className={`text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-1 py-1">
          <TreeRow
            node={tree}
            depth={0}
            ancestorChain={[]}
            expanded={expanded}
            toggleExpand={toggleExpand}
            overrides={overrides}
            onOverrideChange={onOverrideChange}
            activeSettingsId={activeSettingsId}
            setActiveSettingsId={setActiveSettingsId}
            baseColorForMesh={baseColorForMesh}
          />
        </div>
      )}
    </div>
  );
}

type RowProps = {
  node: AssemblyNode;
  depth: number;
  ancestorChain: string[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  overrides: NodeOverrides;
  onOverrideChange: (nodeId: string, next: NodeOverride | null) => void;
  activeSettingsId: string | null;
  setActiveSettingsId: (id: string | null) => void;
  baseColorForMesh: BaseColorLookup;
};

function TreeRow({
  node,
  depth,
  ancestorChain,
  expanded,
  toggleExpand,
  overrides,
  onOverrideChange,
  activeSettingsId,
  setActiveSettingsId,
  baseColorForMesh,
}: RowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const ownOverride = overrides[node.id];
  const isHidden = !!ownOverride?.hidden;
  const dimmedByAncestor = isHiddenByAncestor(ancestorChain, overrides);
  const effectivelyHidden = isHidden || dimmedByAncestor;

  const swatch = resolveSwatch(
    node,
    ancestorChain,
    overrides,
    baseColorForMesh
  );
  const isSettingsOpen = activeSettingsId === node.id;
  const hasCustomization =
    !!ownOverride?.color ||
    (typeof ownOverride?.opacity === "number" && ownOverride.opacity < 1);

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Write-through: if toggling back to visible and everything else is default,
    // clear the override entirely so the row doesn't show a stale "customized".
    const nextHidden = !isHidden;
    const updated: NodeOverride = { ...(ownOverride ?? {}), hidden: nextHidden };
    if (!nextHidden && !updated.color && typeof updated.opacity !== "number") {
      onOverrideChange(node.id, null);
    } else {
      // Strip `hidden: false` so the stored object stays minimal.
      if (!nextHidden) delete updated.hidden;
      onOverrideChange(node.id, updated);
    }
  };

  const handleColorChange = (hex: string) => {
    onOverrideChange(node.id, {
      ...(ownOverride ?? {}),
      color: hexToRgb(hex),
    });
  };

  const handleOpacityChange = (val: number) => {
    const next: NodeOverride = {
      ...(ownOverride ?? {}),
      opacity: val >= 1 ? undefined : val,
    };
    if (
      next.opacity === undefined &&
      !next.color &&
      !next.hidden
    ) {
      onOverrideChange(node.id, null);
    } else {
      // remove opacity key if undefined so it doesn't sit around
      if (next.opacity === undefined) delete next.opacity;
      onOverrideChange(node.id, next);
    }
  };

  const handleReset = () => {
    onOverrideChange(node.id, null);
  };

  const opacityValue =
    typeof ownOverride?.opacity === "number" ? ownOverride.opacity : 1;
  const currentHex = rgbToHex(swatch.color);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-1 py-1 transition-colors ${
          isSettingsOpen
            ? "bg-[var(--theme-gray-100)]"
            : "hover:bg-[var(--theme-gray-100)]"
        } ${effectivelyHidden ? "opacity-55" : ""}`}
      >
        <IndentGuides depth={depth} />

        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleExpand(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:bg-[var(--theme-gray-200)] hover:text-foreground"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={`transition-transform ${
                isExpanded ? "" : "-rotate-90"
              }`}
            />
          </button>
        ) : (
          <div className="h-5 w-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSettingsId(isSettingsOpen ? null : node.id);
          }}
          title="Color & opacity"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
        >
          <span
            className={`block h-3.5 w-3.5 rounded-full border ${
              swatch.source === "own"
                ? "border-[var(--theme-gray-900)] ring-1 ring-offset-1 ring-offset-background ring-[var(--theme-gray-900)]/30"
                : swatch.source === "inherited"
                ? "border-dashed border-[var(--theme-gray-500)]"
                : "border-[var(--theme-gray-300)]"
            }`}
            style={{ backgroundColor: rgbToCss(swatch.color) }}
          />
        </button>

        <button
          type="button"
          onClick={() => hasChildren && toggleExpand(node.id)}
          className="flex-1 truncate text-left text-[12.5px] font-medium text-foreground"
          title={node.name}
        >
          <span className={hasChildren ? "" : "font-normal text-foreground/90"}>
            {node.name}
          </span>
          {hasCustomization && (
            <span
              className="ml-1.5 inline-block h-1 w-1 translate-y-[-2px] rounded-full bg-primary"
              title="Customized"
            />
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleVisibility}
          title={isHidden ? "Show" : "Hide"}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-[var(--theme-gray-200)] hover:text-foreground ${
            isHidden ? "text-foreground" : ""
          }`}
        >
          {isHidden || dimmedByAncestor ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {isSettingsOpen && (
        <div
          className="mb-1 ml-1 mr-1 rounded-md border border-border/70 bg-[var(--theme-gray-50)] px-2.5 py-2"
          style={{ marginLeft: `${8 + depth * 12}px` }}
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1.5 text-[11px]">
            <label
              className="text-muted"
              htmlFor={`color-${node.id}`}
              title="Node color"
            >
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`color-${node.id}`}
                type="color"
                value={currentHex}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-5 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
              />
              <span className="font-mono text-[10.5px] text-muted">
                {currentHex.toUpperCase()}
              </span>
            </div>
            <div />

            <label
              className="text-muted"
              htmlFor={`opacity-${node.id}`}
              title="Opacity"
            >
              Opacity
            </label>
            <input
              id={`opacity-${node.id}`}
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={opacityValue}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="w-8 text-right font-mono text-[10.5px] text-muted">
              {Math.round(opacityValue * 100)}%
            </span>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={!ownOverride}
              className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)] disabled:cursor-not-allowed disabled:opacity-50"
              title="Clear overrides on this node"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              ancestorChain={[node.id, ...ancestorChain]}
              expanded={expanded}
              toggleExpand={toggleExpand}
              overrides={overrides}
              onOverrideChange={onOverrideChange}
              activeSettingsId={activeSettingsId}
              setActiveSettingsId={setActiveSettingsId}
              baseColorForMesh={baseColorForMesh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IndentGuides({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <div className="flex shrink-0" aria-hidden="true">
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          className="h-5 w-3 border-l border-border/60"
          style={{ marginRight: i === depth - 1 ? 0 : 0 }}
        />
      ))}
    </div>
  );
}

// ---------------- Icons ----------------

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.78 19.78 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.78 19.78 0 0 1-4.22 5.17" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function HierarchyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="9" width="7" height="5" rx="1" />
      <rect x="14" y="16" width="7" height="5" rx="1" />
      <path d="M10 5.5h2a2 2 0 0 1 2 2V11" />
      <path d="M14 18.5h-2a2 2 0 0 1-2-2V8" />
    </svg>
  );
}

export default AssemblyTreePanel;
