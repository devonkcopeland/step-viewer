/**
 * Mouse-button presets modeled after popular CAD tools.
 *
 * `three-stdlib`'s TrackballControls only inspects `event.button` in
 * onMouseDown, so modifier-key variants (SolidWorks Ctrl+MMB pan,
 * Fusion Shift+MMB orbit, etc.) are collapsed to pure-button equivalents
 * that a 3-button mouse user would set in each app's own navigation-type
 * preference pane.
 *
 * `mouseButtons` uses three.js's MOUSE-enum slot naming:
 *   - LEFT   -> the event.button value that triggers ROTATE
 *   - MIDDLE -> the event.button value that triggers DOLLY / ZOOM
 *   - RIGHT  -> the event.button value that triggers PAN
 * A slot set to -1 (or any value no mouse button produces) is effectively
 * disabled.
 *
 * event.button values:
 *   0 = left, 1 = middle, 2 = right
 */

export type NavigationMode =
  | "default"
  | "solidworks"
  | "fusion"
  | "touchpad";

export type MouseButtons = {
  LEFT: number;
  MIDDLE: number;
  RIGHT: number;
};

export type MouseAction = "rotate" | "pan" | "zoom" | null;

export type NavigationButtonMap = {
  left: MouseAction;
  middle: MouseAction;
  right: MouseAction;
  wheel: MouseAction;
};

export type SimilarApp = {
  name: string;
  domain: string;
};

export type NavigationPreset = {
  id: NavigationMode;
  label: string;
  description: string;
  tagline: string;
  similarTo: SimilarApp[];
  notes?: string;
  buttons: NavigationButtonMap;
  mouseButtons: MouseButtons;
};

export const NAVIGATION_PRESETS: NavigationPreset[] = [
  {
    id: "default",
    label: "Default",
    description:
      "Three.js default — LMB rotate · MMB zoom · RMB pan · wheel zoom",
    tagline: "The standard three.js / web-3D mapping. Good starting point.",
    similarTo: [
      { name: "three.js", domain: "threejs.org" },
      { name: "Sketchfab", domain: "sketchfab.com" },
    ],
    buttons: { left: "rotate", middle: "zoom", right: "pan", wheel: "zoom" },
    mouseButtons: { LEFT: 0, MIDDLE: 1, RIGHT: 2 },
  },
  {
    id: "solidworks",
    label: "SolidWorks / Blender",
    description:
      "MMB rotate · RMB pan · wheel zoom (pan modifier collapsed to RMB)",
    tagline:
      "Middle-mouse drag to orbit, right-mouse drag to pan — the classic MCAD layout.",
    similarTo: [
      { name: "SolidWorks", domain: "solidworks.com" },
      { name: "Blender", domain: "blender.org" },
      { name: "Creo", domain: "ptc.com" },
    ],
    notes:
      "SolidWorks normally uses Ctrl+MMB for pan. This app only reads the raw mouse button, so pan is remapped to RMB.",
    buttons: { left: null, middle: "rotate", right: "pan", wheel: "zoom" },
    mouseButtons: { LEFT: 1, MIDDLE: -1, RIGHT: 2 },
  },
  {
    id: "fusion",
    label: "Fusion 360 / Onshape",
    description:
      "RMB rotate · MMB pan · wheel zoom (orbit modifier collapsed to RMB)",
    tagline:
      "Middle-mouse drag to pan, right-mouse drag to orbit — matches browser-based MCAD.",
    similarTo: [
      { name: "Fusion 360", domain: "autodesk.com" },
      { name: "Onshape", domain: "onshape.com" },
      { name: "Inventor", domain: "autodesk.com" },
    ],
    notes:
      "Fusion 360 normally uses Shift+MMB for orbit. This app only reads the raw mouse button, so orbit is remapped to RMB.",
    buttons: { left: null, middle: "pan", right: "rotate", wheel: "zoom" },
    mouseButtons: { LEFT: 2, MIDDLE: -1, RIGHT: 1 },
  },
  {
    id: "touchpad",
    label: "Touchpad",
    description: "LMB rotate · wheel zoom · no middle/right bindings",
    tagline:
      "Only the left button and scroll are used — best for laptop trackpads without a real middle/right button.",
    similarTo: [
      { name: "Trackpad", domain: "apple.com" },
      { name: "Magic Mouse", domain: "apple.com" },
    ],
    notes:
      "Pan is not bound. Use two-finger scroll to zoom and left-click drag to orbit.",
    buttons: { left: "rotate", middle: null, right: null, wheel: "zoom" },
    mouseButtons: { LEFT: 0, MIDDLE: -1, RIGHT: -1 },
  },
];

export const DEFAULT_NAVIGATION_MODE: NavigationMode = "default";

export function getNavigationPreset(mode: NavigationMode): NavigationPreset {
  return (
    NAVIGATION_PRESETS.find((p) => p.id === mode) ?? NAVIGATION_PRESETS[0]
  );
}

/**
 * Google's favicon endpoint. Requires `sz` to be a supported size
 * (16 / 32 / 64). We request 64px so it stays crisp on HiDPI displays
 * when rendered at 16-18px.
 */
export function faviconUrl(domain: string, size: 16 | 32 | 64 = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain
  )}&sz=${size}`;
}
