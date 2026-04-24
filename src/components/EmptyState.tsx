import React, { useRef } from "react";

type EmptyStateProps = {
  onFileSelected: (file: File) => void;
  onExampleSelected?: (name: string) => void;
};

type Example = {
  /** File in `public/examples/`. */
  filename: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** One-line hint about what the part is. */
  hint: string;
};

const EXAMPLES: Example[] = [
  {
    filename: "manifold.step",
    label: "Manifold",
    hint: "Machined hydraulic block",
  },
  {
    filename: "rocket.step",
    label: "Rocket",
    hint: "Multi-part assembly",
  },
  {
    filename: "house.step",
    label: "House",
    hint: "Architectural massing model",
  },
];

function EmptyState({ onFileSelected, onExampleSelected }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
      <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-background/90 px-8 py-10 text-center shadow-sm backdrop-blur">
        <div className="flex items-center justify-center">
          <UploadCloudIcon />
        </div>
        <div>
          <div className="text-base font-semibold text-foreground">
            Drop a STEP file to begin
          </div>
          <div className="mt-1 text-sm text-muted">
            Drag &amp; drop a .step or .stp file anywhere — or choose one below.
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".step,.stp,.STEP,.STP"
          className="hidden"
          onChange={handleInputChange}
        />

        {onExampleSelected && (
          <div className="mt-2 flex w-full flex-col items-stretch gap-2 border-t border-border pt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">
              Or try an example
            </div>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <ExampleLink
                  key={ex.filename}
                  example={ex}
                  onSelect={onExampleSelected}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExampleLink({
  example,
  onSelect,
}: {
  example: Example;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(example.filename)}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/20 hover:bg-[var(--theme-gray-100)]"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <CubeIcon />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {example.label}
          </span>
          <span className="truncate text-xs text-muted">{example.hint}</span>
        </span>
      </span>
      <ArrowIcon />
    </button>
  );
}

function UploadCloudIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted"
      aria-hidden="true"
    >
      <path d="M16 16l-4-4-4 4" />
      <path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      <path d="M16 16l-4-4-4 4" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted"
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ArrowIcon() {
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
      className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default EmptyState;
