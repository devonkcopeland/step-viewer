import Logo from "./Logo";

type HeaderProps = {
  hasModel: boolean;
  onOpenClick: () => void;
  onResetClick: () => void;
  canDownload?: boolean;
  onDownloadClick?: () => void;
  annotating?: boolean;
  onAnnotateClick?: () => void;
};

function Header({
  hasModel,
  onOpenClick,
  onResetClick,
  canDownload,
  onDownloadClick,
  annotating,
  onAnnotateClick,
}: HeaderProps) {
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

        {hasModel && onAnnotateClick && (
          <button
            type="button"
            onClick={onAnnotateClick}
            title={annotating ? "Exit annotation mode" : "Draw on the view"}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              annotating
                ? "border-transparent bg-primary text-primary-foreground hover:opacity-90"
                : "border-border bg-background text-foreground hover:bg-[var(--theme-gray-100)]"
            }`}
          >
            <PencilIcon />
            {annotating ? "Done" : "Annotate"}
          </button>
        )}

        {hasModel && canDownload && onDownloadClick && (
          <button
            type="button"
            onClick={onDownloadClick}
            title="Download the current STEP file"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[var(--theme-gray-100)]"
          >
            <DownloadIcon />
            Download
          </button>
        )}

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
