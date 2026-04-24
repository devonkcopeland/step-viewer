import { ReactNode, useEffect, useRef, useState } from "react";
import {
  faviconUrl,
  NAVIGATION_PRESETS,
  NavigationMode,
  NavigationPreset,
  SimilarApp,
} from "../lib/navigationModes";
import MouseDiagram, { ACTION_COLORS } from "./MouseDiagram";

type Props = {
  open: boolean;
  value: NavigationMode;
  firstVisit?: boolean;
  onChange: (mode: NavigationMode) => void;
  onClose: () => void;
};

function NavigationModeDialog({
  open,
  value,
  firstVisit = false,
  onChange,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    queueMicrotask(() => dialogRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="nav-mode-dialog-title"
    >
      <button
        type="button"
        aria-label="Close navigation modes"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {firstVisit && (
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                Welcome
              </div>
            )}
            <h2
              id="nav-mode-dialog-title"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              {firstVisit
                ? "Choose your navigation style"
                : "Navigation mode"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {firstVisit
                ? "Pick the mouse mapping that matches the CAD tool you use most."
                : "Pick the mouse mapping that matches the CAD tool you use most."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-[var(--theme-gray-100)] hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>

        <Legend />

        <div className="grid gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          {NAVIGATION_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={preset.id === value}
              onSelect={() => {
                onChange(preset.id);
                onClose();
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-border bg-[var(--theme-gray-50)] px-5 py-3 text-xs text-muted">
          <div className="flex-1">
            Modifier keys aren't wired up — hover{" "}
            <InlineInfoIcon /> on a card for quirks.
          </div>
          {firstVisit && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)]"
            >
              Keep default
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: NavigationPreset;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-[color-mix(in_srgb,var(--primary)_5%,var(--background))] ring-1 ring-[var(--primary)]"
          : "border-border bg-background hover:border-[var(--theme-gray-300)] hover:bg-[var(--theme-gray-50)]"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon />
        </span>
      )}

      <div className="shrink-0">
        <MouseDiagram
          size={64}
          left={preset.buttons.left}
          middle={preset.buttons.middle}
          right={preset.buttons.right}
          wheel={preset.buttons.wheel}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 pr-8">
          <span className="truncate text-sm font-semibold text-foreground">
            {preset.label}
          </span>
          <InfoTip content={<PresetDetails preset={preset} />} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {preset.similarTo.map((app) => (
            <AppChip key={`${app.name}-${app.domain}`} app={app} />
          ))}
        </div>
      </div>
    </button>
  );
}

function PresetDetails({ preset }: { preset: NavigationPreset }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-foreground/90">
        {preset.tagline}
      </p>
      <dl className="space-y-0.5 text-[11px] text-foreground">
        <BindingRow button="LMB" action={preset.buttons.left} />
        <BindingRow button="MMB" action={preset.buttons.middle} />
        <BindingRow button="RMB" action={preset.buttons.right} />
        <BindingRow button="Wheel" action={preset.buttons.wheel} />
      </dl>
      {preset.notes && (
        <p className="border-t border-white/10 pt-2 text-[11px] leading-relaxed text-foreground/75">
          {preset.notes}
        </p>
      )}
    </div>
  );
}

function AppChip({ app }: { app: SimilarApp }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground"
      title={app.domain}
    >
      {!failed ? (
        <img
          src={faviconUrl(app.domain, 64)}
          alt=""
          width={14}
          height={14}
          loading="lazy"
          className="h-3.5 w-3.5 rounded-sm"
          onError={() => setFailed(true)}
        />
      ) : (
        <GlobeIcon />
      )}
      {app.name}
    </span>
  );
}

function BindingRow({
  button,
  action,
}: {
  button: string;
  action: "rotate" | "pan" | "zoom" | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex w-10 justify-center rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-foreground/80">
        {button}
      </span>
      {action ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: ACTION_COLORS[action] }}
            aria-hidden="true"
          />
          <span className="font-medium capitalize">{action}</span>
        </span>
      ) : (
        <span className="text-foreground/60">—</span>
      )}
    </div>
  );
}

/**
 * Small (i) icon trigger with a hover/focus popover. Stops click propagation
 * so activating it doesn't also select the parent preset card.
 */
function InfoTip({ content }: { content: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="More info"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }
        }}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold text-muted transition-colors hover:border-[var(--theme-gray-400)] hover:text-foreground"
      >
        i
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-[var(--theme-gray-900)] px-3 py-2.5 text-[11px] text-white shadow-lg"
          style={{ color: "#ffffff" }}
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-border bg-[var(--theme-gray-900)]" />
          {content}
        </span>
      )}
    </span>
  );
}

function Legend() {
  const items: { label: string; action: "rotate" | "pan" | "zoom" }[] = [
    { label: "Rotate", action: "rotate" },
    { label: "Pan", action: "pan" },
    { label: "Zoom", action: "zoom" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border bg-[var(--theme-gray-50)] px-5 py-2.5 text-xs text-muted">
      <span className="font-medium text-foreground">Legend</span>
      {items.map((item) => (
        <span key={item.action} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: ACTION_COLORS[item.action] }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function InlineInfoIcon() {
  return (
    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-background text-[9px] font-semibold text-muted align-[-1px]">
      i
    </span>
  );
}

function GlobeIcon() {
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
      className="text-muted"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
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

export default NavigationModeDialog;
