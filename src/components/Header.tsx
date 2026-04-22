import Logo from "./Logo";

type HeaderProps = {
  hasModel: boolean;
  onOpenClick: () => void;
  onResetClick: () => void;
};

function Header({ hasModel, onOpenClick, onResetClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2.5 text-foreground">
        <Logo size={22} />
        <span className="text-[15px] font-semibold tracking-tight">
          STEP Viewer
        </span>
        <span className="mx-1 h-4 w-px bg-border" />
        <span className="text-xs text-muted">occt-import-js</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenClick}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)]"
        >
          <UploadIcon />
          Open STEP
        </button>

        {hasModel && (
          <button
            type="button"
            onClick={onResetClick}
            title="Clear and return to upload"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ResetIcon />
            Reset
          </button>
        )}
      </div>
    </header>
  );
}

function UploadIcon() {
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
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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
