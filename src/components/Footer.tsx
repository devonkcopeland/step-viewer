import Logo from "./Logo";

type FooterProps = {
  status?: string;
};

function Footer({ status = "Ready" }: FooterProps) {
  return (
    <footer className="flex items-center justify-between gap-4 border-t border-border bg-background px-4 py-2.5 text-xs text-muted sm:px-6">
      <div className="flex items-center gap-2">
        <span className="status-dot" aria-hidden="true" />
        <span>{status}</span>
      </div>

      <a
        href="https://www.finalrev.com"
        target="_blank"
        rel="noopener noreferrer"
        title="finalrev"
        className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
      >
        <span>by</span>
        <span className="text-muted transition-colors group-hover:text-foreground">
          <Logo size={14} />
        </span>
        <span className="font-medium">finalrev</span>
      </a>
    </footer>
  );
}

export default Footer;
