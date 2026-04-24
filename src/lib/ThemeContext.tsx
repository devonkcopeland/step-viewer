import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_THEME_ID,
  DEFAULT_THEME_MODE,
  getTheme,
  getThemeVisual,
  THEMES,
  ThemeDefinition,
  ThemeId,
  ThemeMode,
  ThemeVisual,
} from "./themes";

/**
 * User's mode preference. "system" tracks the OS setting via
 * `prefers-color-scheme`; "light" / "dark" lock it regardless.
 */
export type ThemeModePreference = ThemeMode | "system";

const THEME_STORAGE_KEY = "step-viewer/theme";
const MODE_STORAGE_KEY = "step-viewer/theme-mode";

type ThemeContextValue = {
  /** The active theme's TS definition. */
  theme: ThemeDefinition;
  /** Resolved light/dark for the active theme (system preference resolved). */
  mode: ThemeMode;
  /** User's raw preference including "system". */
  modePreference: ThemeModePreference;
  /** The resolved visual tokens for (theme, mode), for JS-side consumers. */
  visual: ThemeVisual;
  setThemeId: (id: ThemeId) => void;
  setModePreference: (pref: ThemeModePreference) => void;
  /** Flip light ↔ dark (switches system preference to the opposite). */
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredThemeId(): ThemeId {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (v && THEMES.some((t) => t.id === v)) return v as ThemeId;
  } catch {
    // ignore
  }
  return DEFAULT_THEME_ID;
}

function readStoredModePref(): ThemeModePreference {
  try {
    const v = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return DEFAULT_THEME_MODE;
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function resolveMode(pref: ThemeModePreference): ThemeMode {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredThemeId);
  const [modePreference, setModePreferenceState] =
    useState<ThemeModePreference>(readStoredModePref);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  // Watch OS color-scheme changes while the user is on "system".
  useEffect(() => {
    if (modePreference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    // Safari <14 only supports addListener, but we don't need to bother here.
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [modePreference]);

  const mode: ThemeMode =
    modePreference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : modePreference;

  // Apply data attributes on <html>. The CSS rules in index.css key off these.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeId;
    root.dataset.mode = mode;
    // color-scheme hints native form controls + scrollbars to match.
    root.style.colorScheme = mode;
  }, [themeId, mode]);

  // Keep the <meta name="theme-color"> in sync so mobile browser chrome
  // (address bar, etc.) matches the active theme.
  useEffect(() => {
    const visual = getThemeVisual(themeId, mode);
    const meta = document.querySelector(
      'meta[name="theme-color"]'
    ) as HTMLMetaElement | null;
    if (meta) meta.setAttribute("content", visual.browserChrome);
  }, [themeId, mode]);

  // Persist.
  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // ignore (SSR / privacy mode)
    }
  }, [themeId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, modePreference);
    } catch {
      // ignore
    }
  }, [modePreference]);

  // Picking a theme from the UI lands on that theme's declared default mode
  // (so Brutalist → dark, Paper → light, etc. without an extra click). We
  // respect "system" though — if the user has explicitly asked to follow their
  // OS, the OS stays in charge of light/dark no matter which theme they pick.
  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    setModePreferenceState((prev) => {
      if (prev === "system") return prev;
      return getTheme(id).defaultMode;
    });
  }, []);
  const setModePreference = useCallback(
    (pref: ThemeModePreference) => setModePreferenceState(pref),
    []
  );
  const toggleMode = useCallback(() => {
    setModePreferenceState((prev) => {
      const resolved = resolveMode(prev);
      return resolved === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = getTheme(themeId);
    const visual = mode === "dark" ? theme.dark : theme.light;
    return {
      theme,
      mode,
      modePreference,
      visual,
      setThemeId,
      setModePreference,
      toggleMode,
    };
  }, [themeId, mode, modePreference, setThemeId, setModePreference, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
