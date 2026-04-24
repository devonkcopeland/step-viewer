import Logo from "./Logo";
import {
  NAVIGATION_PRESETS,
  NavigationMode,
} from "../lib/navigationModes";
import { useCoarsePointer } from "../lib/pointer";

type HeaderProps = {
  hasModel: boolean;
  onResetClick: () => void;
  canDownload?: boolean;
  onDownloadClick?: () => void;
  annotating?: boolean;
  onAnnotateClick?: () => void;
  navigationMode?: NavigationMode;
  onOpenNavigationModes?: () => void;
};

/**
 * Compact top bar.
 *
 * Design goals:
 *   - Usable from ~320 px (small phone in portrait) up to desktop.
 *   - Primary actions always visible — nothing gets hidden behind a menu.
 *   - On small screens, secondary buttons collapse to icon-only (the labels
 *     are redundant with the icons and cost ~60–80 px each).
 *   - The nav-mode button is a desktop-only affordance: it configures
 *     mouse-button bindings, which don't apply on touchscreens. Hide it
 *     entirely on coarse-pointer devices.
 */
function Header({
  hasModel,
  onResetClick,
  canDownload,
  onDownloadClick,
  annotating,
  onAnnotateClick,
  navigationMode,
  onOpenNavigationModes,
}: HeaderProps) {
  const isTouch = useCoarsePointer();
  const activePreset =
    NAVIGATION_PRESETS.find((p) => p.id === navigationMode) ??
    NAVIGATION_PRESETS[0];

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 text-foreground sm:gap-2.5">
        <Logo size={22} />
        <span className="truncate text-[14px] font-semibold tracking-tight sm:text-[15px]">
          <span className="hidden min-[400px]:inline">STEP Viewer</span>
          <span className="min-[400px]:hidden">STEP</span>
        </span>
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <a
          href="https://www.finalrev.com?utm_source=step-viewer"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-xs text-muted hover:text-foreground hover:underline sm:inline"
        >
          by finalREV
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {hasModel && !isTouch && onOpenNavigationModes && (
          <button
            type="button"
            onClick={onOpenNavigationModes}
            title={activePreset.tagline}
            aria-label={`Navigation mode: ${activePreset.label}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)] sm:px-3"
          >
            <MouseIcon />
            <span className="hidden sm:inline md:hidden">Nav</span>
            <span className="hidden md:inline">
              <span className="text-muted">Nav:</span>{" "}
              <span className="font-semibold">{activePreset.label}</span>
            </span>
          </button>
        )}

        {hasModel && onAnnotateClick && (
          <IconTextButton
            onClick={onAnnotateClick}
            icon={<PencilIcon />}
            label={annotating ? "Done" : "Annotate"}
            title={annotating ? "Exit annotation mode" : "Draw on the view"}
            accent={annotating}
          />
        )}

        {hasModel && canDownload && onDownloadClick && (
          <IconTextButton
            onClick={onDownloadClick}
            icon={<DownloadIcon />}
            label="Download"
            title="Download the current STEP file"
          />
        )}

        {hasModel && (
          <IconTextButton
            onClick={onResetClick}
            icon={<ResetIcon />}
            label="Reset"
            title="Clear and return to upload"
            primary
          />
        )}
      </div>
    </header>
  );
}

/**
 * Button that shows an icon + label on desktop (sm+) and collapses to
 * icon-only on phones. The `title` attribute doubles as a tooltip on desktop
 * and the `aria-label` for screen readers when the text is hidden.
 */
function IconTextButton({
  onClick,
  icon,
  label,
  title,
  primary,
  accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
  primary?: boolean;
  accent?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:px-3";
  const variant = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : accent
      ? "border border-transparent bg-primary text-primary-foreground hover:opacity-90"
      : "border border-border bg-background text-foreground hover:bg-[var(--theme-gray-100)]";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={`${base} ${variant}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function MouseIcon() {
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
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <line x1="12" y1="7" x2="12" y2="12" />
    </svg>
  );
}

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PencilIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ResetIcon() {
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
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    </svg>
  );
}

export default Header;
