/**
 * Mouse-button presets modeled after popular CAD tools.
 *
 * We go through a capture-phase pointerdown listener that rewrites
 * `controls.mouseButtons` based on (button, modifier) before TrackballControls
 * reads it, so all of these presets are the *real* bindings each CAD tool
 * uses — no more "collapsed to RMB" fallbacks.
 *
 * See `navigationBindings.ts` for the runtime that makes this work.
 */

export type NavigationMode =
  | "default"
  | "solidworks"
  | "fusion"
  | "onshape"
  | "blender"
  | "touchpad";

export type MouseButton = "LMB" | "MMB" | "RMB";
export type Modifier = "none" | "shift" | "ctrl" | "alt";
export type NavigationAction = "rotate" | "pan" | "zoom";

export type Binding = {
  button: MouseButton;
  modifier: Modifier;
};

export type NavigationBindings = {
  rotate?: Binding;
  pan?: Binding;
  /**
   * Drag-to-zoom binding (e.g. SolidWorks Shift+MMB). The mouse wheel is
   * always zoom regardless of this binding.
   */
  zoom?: Binding;
};

export type SimilarApp = {
  name: string;
  domain: string;
};

export type NavigationPreset = {
  id: NavigationMode;
  label: string;
  tagline: string;
  similarTo: SimilarApp[];
  bindings: NavigationBindings;
};

export const NAVIGATION_PRESETS: NavigationPreset[] = [
  {
    id: "default",
    label: "Default",
    tagline:
      "The standard three.js / web-3D mapping. Good baseline if you don't have a CAD preference.",
    similarTo: [
      { name: "three.js", domain: "threejs.org" },
      { name: "Sketchfab", domain: "sketchfab.com" },
    ],
    bindings: {
      rotate: { button: "LMB", modifier: "none" },
      pan: { button: "RMB", modifier: "none" },
      zoom: { button: "MMB", modifier: "none" },
    },
  },
  {
    id: "solidworks",
    label: "SolidWorks",
    tagline:
      "Middle-mouse drag to orbit, Ctrl+MMB to pan, Shift+MMB to drag-zoom — the classic MCAD layout.",
    similarTo: [
      { name: "SolidWorks", domain: "solidworks.com" },
      { name: "Creo", domain: "ptc.com" },
    ],
    bindings: {
      rotate: { button: "MMB", modifier: "none" },
      pan: { button: "MMB", modifier: "ctrl" },
      zoom: { button: "MMB", modifier: "shift" },
    },
  },
  {
    id: "fusion",
    label: "Fusion 360",
    tagline:
      "Middle-mouse drag to pan, Shift+MMB to orbit — matches Autodesk's default.",
    similarTo: [
      { name: "Fusion 360", domain: "autodesk.com" },
      { name: "Inventor", domain: "autodesk.com" },
    ],
    bindings: {
      rotate: { button: "MMB", modifier: "shift" },
      pan: { button: "MMB", modifier: "none" },
    },
  },
  {
    id: "onshape",
    label: "Onshape / Shapr3D",
    tagline:
      "Right-mouse drag to orbit, middle-mouse drag to pan — browser-native CAD style.",
    similarTo: [
      { name: "Onshape", domain: "onshape.com" },
      { name: "Shapr3D", domain: "shapr3d.com" },
    ],
    bindings: {
      rotate: { button: "RMB", modifier: "none" },
      pan: { button: "MMB", modifier: "none" },
    },
  },
  {
    id: "blender",
    label: "Blender",
    tagline:
      "Middle-mouse drag to orbit, Shift+MMB to pan, Ctrl+MMB to drag-zoom.",
    similarTo: [{ name: "Blender", domain: "blender.org" }],
    bindings: {
      rotate: { button: "MMB", modifier: "none" },
      pan: { button: "MMB", modifier: "shift" },
      zoom: { button: "MMB", modifier: "ctrl" },
    },
  },
  {
    id: "touchpad",
    label: "Touchpad",
    tagline:
      "Left-mouse drag to orbit, two-finger scroll to zoom. Best for laptop trackpads.",
    similarTo: [
      { name: "Trackpad", domain: "apple.com" },
      { name: "Magic Mouse", domain: "apple.com" },
    ],
    bindings: {
      rotate: { button: "LMB", modifier: "none" },
    },
  },
];

export const DEFAULT_NAVIGATION_MODE: NavigationMode = "default";

export function getNavigationPreset(mode: NavigationMode): NavigationPreset {
  return (
    NAVIGATION_PRESETS.find((p) => p.id === mode) ?? NAVIGATION_PRESETS[0]
  );
}

/**
 * Resolves to a **self-hosted** favicon under `/public/app-icons/{domain}.png`.
 * We intentionally do NOT hit Google's favicon service (or any third party) at
 * runtime so the app makes zero outbound requests once loaded — see the
 * privacy tooltip in `Footer.tsx`.
 *
 * To add a new domain: drop a `public/app-icons/{domain}.png` file and
 * reference it from `NAVIGATION_PRESETS`. If the file is missing the chip
 * gracefully falls back to a globe icon (see `NavigationModeDialog.tsx`).
 *
 * The `size` parameter is kept for API compatibility but is unused; the
 * bundled PNGs are all 64px.
 */
export function faviconUrl(domain: string, _size: 16 | 32 | 64 = 64): string {
  return `/app-icons/${domain}.png`;
}

/** Display strings for modifier keys. Using the macOS glyphs which are
 *  broadly recognized by CAD users on both platforms. */
export const MODIFIER_GLYPHS: Record<Modifier, string> = {
  none: "",
  shift: "⇧",
  ctrl: "⌃",
  alt: "⌥",
};

export function formatBinding(binding: Binding): string {
  const glyph = MODIFIER_GLYPHS[binding.modifier];
  return glyph ? `${glyph} ${binding.button}` : binding.button;
}
