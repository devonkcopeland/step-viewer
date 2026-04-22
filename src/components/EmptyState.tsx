import React, { useRef } from "react";

type EmptyStateProps = {
  onFileSelected: (file: File) => void;
};

function EmptyState({ onFileSelected }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
      <div className="pointer-events-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-background/90 px-8 py-10 text-center shadow-sm backdrop-blur">
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
      </div>
    </div>
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

export default EmptyState;
