import { useEffect, useRef, useState } from "react";
import { useTheme, ThemeModePreference } from "../lib/ThemeContext";
import { THEMES, ThemeDefinition, ThemeId } from "../lib/themes";

/**
 * Header-mounted theme + light/dark switcher.
 *
 * UX:
 *   - Trigger button shows a palette icon (+ "Theme" label at sm+).
 *   - Popover anchors to the right of the trigger (header lives at top-right)
 *     and has a segmented Light/Dark/System toggle over a 2×2 grid of theme
 *     preview cards. Active theme gets an outline.
 *   - Clicking a card switches theme instantly (no confirm). Clicking outside
 *     or hitting Escape closes.
 */
function ThemePicker() {
  const { theme, mode, modePreference, setThemeId, setModePreference } =
    useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // Use capture so we close the popover even if an inner handler stops
    // propagation on its own pointerdown.
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Theme: ${theme.label} (${mode})`}
        aria-label={`Theme: ${theme.label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)] sm:px-3"
      >
        <PaletteIcon />
        <span className="hidden sm:inline md:hidden">Theme</span>
        <span className="hidden md:inline">
          <span className="text-muted">Theme:</span>{" "}
          <span className="font-semibold">{theme.label}</span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Theme picker"
          className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] rounded-xl border border-border bg-background p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35),0_2px_6px_-2px_rgba(0,0,0,0.1)]"
        >
          <ModeToggle
            value={modePreference}
            onChange={setModePreference}
            resolved={mode}
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                mode={mode}
                active={t.id === theme.id}
                onPick={() => {
                  setThemeId(t.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeToggle({
  value,
  onChange,
  resolved,
}: {
  value: ThemeModePreference;
  onChange: (v: ThemeModePreference) => void;
  resolved: "light" | "dark";
}) {
  const opts: { id: ThemeModePreference; label: string; icon: JSX.Element }[] =
    [
      { id: "light", label: "Light", icon: <SunIcon /> },
      { id: "dark", label: "Dark", icon: <MoonIcon /> },
      { id: "system", label: "Auto", icon: <SystemIcon /> },
    ];
  return (
    <div
      role="radiogroup"
      aria-label="Color mode"
      className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-[var(--surface-subtle)] p-1"
    >
      {opts.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            title={
              o.id === "system"
                ? `Match system (currently ${resolved})`
                : o.label
            }
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ThemeCard({
  theme,
  mode,
  active,
  onPick,
}: {
  theme: ThemeDefinition;
  mode: "light" | "dark";
  active: boolean;
  onPick: (id: ThemeId) => void;
}) {
  const swatches = mode === "dark" ? theme.previewSwatches.dark : theme.previewSwatches.light;
  return (
    <button
      type="button"
      onClick={() => onPick(theme.id)}
      aria-pressed={active}
      title={theme.tagline}
      className={`group relative flex flex-col gap-2 overflow-hidden rounded-lg border p-2.5 text-left transition-all ${
        active
          ? "border-foreground ring-2 ring-foreground/20"
          : "border-border hover:border-foreground/50"
      }`}
    >
      {/* Preview tile: a miniature "app" using the theme's swatches. */}
      <div
        className="relative h-16 w-full overflow-hidden rounded-md"
        style={{ background: swatches[0] }}
      >
        {/* header bar */}
        <div
          className="absolute left-0 right-0 top-0 h-3 border-b"
          style={{
            background: swatches[1],
            borderColor: `color-mix(in srgb, ${swatches[2]} 20%, transparent)`,
          }}
        />
        {/* little button */}
        <div
          className="absolute right-1.5 top-4 h-2.5 w-6 rounded-[3px]"
          style={{ background: swatches[2] }}
        />
        {/* accent chip */}
        <div
          className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-full"
          style={{ background: swatches[3] }}
        />
        {/* dot-grid hint */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(circle, color-mix(in srgb, ${swatches[2]} 25%, transparent) 1px, transparent 1px)`,
            backgroundSize: "10px 10px",
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-semibold text-foreground">
          {theme.label}
        </span>
        {active && (
          <span
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
            aria-hidden="true"
          >
            <CheckIcon />
          </span>
        )}
      </div>
    </button>
  );
}

function PaletteIcon() {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-10-10-10z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default ThemePicker;
