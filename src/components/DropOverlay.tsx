type DropOverlayProps = {
  visible: boolean;
};

function DropOverlay({ visible }: DropOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6">
      <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-foreground/40 bg-background/70 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            Drop to open
          </div>
          <div className="mt-1 text-sm text-muted">.step or .stp files</div>
        </div>
      </div>
    </div>
  );
}

export default DropOverlay;
