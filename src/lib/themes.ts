/**
 * Theme registry.
 *
 * A theme bundles a visual "personality" (colors, fonts, radius, accent feel)
 * and ships a light + dark mode. Each theme also declares a `defaultMode` —
 * the variant it looks best in, so picking a theme from the UI lands the user
 * in that variant instead of forcing them to flip a toggle afterwards.
 *
 * CSS variables that drive the look live in `src/index.css` under
 * `[data-theme][data-mode]` selectors; this file is the TypeScript source of
 * truth for the metadata the picker UI and any JS-side consumer (e.g. the
 * Three.js edge color) needs.
 *
 * To add a theme:
 *   1. Add an entry here.
 *   2. Mirror it in `src/index.css` with matching CSS variables.
 *   3. Add its id to the THEMES array in index.html's boot script so the
 *      persisted choice survives a hard refresh.
 */
export type ThemeId = "classic" | "paper" | "terminal" | "brutalist";
export type ThemeMode = "light" | "dark";

export type ThemeVisual = {
  /** Stroke color applied to mesh silhouette edges in the 3D view. */
  edgeColor: string;
  /** Color used for the PWA/browser chrome theme-color meta tag. */
  browserChrome: string;
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  tagline: string;
  /** Variant to land on when the user picks this theme from the UI. */
  defaultMode: ThemeMode;
  /** Four swatches rendered in the picker preview, in display order. */
  previewSwatches: {
    light: [string, string, string, string];
    dark: [string, string, string, string];
  };
  light: ThemeVisual;
  dark: ThemeVisual;
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "classic",
    label: "Classic",
    tagline: "Clean, neutral, everyday.",
    defaultMode: "light",
    previewSwatches: {
      light: ["#ffffff", "#f5f5f5", "#0a0a0a", "#2563eb"],
      dark: ["#141414", "#0a0a0a", "#fafafa", "#60a5fa"],
    },
    light: {
      edgeColor: "#0a0a0a",
      browserChrome: "#ffffff",
    },
    dark: {
      edgeColor: "#d4d4d4",
      browserChrome: "#141414",
    },
  },
  {
    id: "paper",
    label: "Paper",
    tagline: "Blank white canvas. Nothing in the way.",
    defaultMode: "light",
    previewSwatches: {
      light: ["#ffffff", "#ffffff", "#171717", "#2563eb"],
      dark: ["#1a1a1a", "#111111", "#f5f5f5", "#60a5fa"],
    },
    light: {
      edgeColor: "#1a1a1a",
      browserChrome: "#ffffff",
    },
    dark: {
      edgeColor: "#e5e5e5",
      browserChrome: "#1a1a1a",
    },
  },
  {
    id: "terminal",
    label: "Terminal",
    tagline: "Phosphor green on deep black. Monospaced.",
    defaultMode: "dark",
    previewSwatches: {
      light: ["#f4f2e8", "#e8e4d2", "#1a3d1a", "#b8600e"],
      dark: ["#0d1117", "#010409", "#39d353", "#ffa657"],
    },
    light: {
      edgeColor: "#1a3d1a",
      browserChrome: "#f4f2e8",
    },
    dark: {
      edgeColor: "#39d353",
      browserChrome: "#0d1117",
    },
  },
  {
    id: "brutalist",
    label: "Brutalist",
    tagline: "Newsprint cream, scarlet red, no excuses.",
    defaultMode: "dark",
    previewSwatches: {
      light: ["#ece6d3", "#0a0a0a", "#e63946", "#e63946"],
      dark: ["#0d0d0d", "#ece6d3", "#ff4d4d", "#ff4d4d"],
    },
    light: {
      edgeColor: "#0a0a0a",
      browserChrome: "#ece6d3",
    },
    dark: {
      edgeColor: "#ece6d3",
      browserChrome: "#0d0d0d",
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "paper";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function getThemeVisual(
  id: ThemeId,
  mode: ThemeMode
): ThemeVisual {
  const theme = getTheme(id);
  return mode === "dark" ? theme.dark : theme.light;
}
