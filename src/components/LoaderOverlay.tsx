import Logo from "./Logo";

type LoaderOverlayProps = {
  visible: boolean;
  label?: string;
};

function LoaderOverlay({
  visible,
  label = "Parsing geometry",
}: LoaderOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Logo size={72} animated />
        <div className="text-sm text-foreground">
          {label}
          <span className="blink-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
        <div className="progress-track" />
      </div>
    </div>
  );
}

export default LoaderOverlay;
