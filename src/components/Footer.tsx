import { useState } from "react";
import Logo from "./Logo";

type FooterProps = {
  status?: string;
};

function Footer({ status = "Ready" }: FooterProps) {
  return (
    <footer className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-border bg-background px-4 py-2.5 text-xs text-muted sm:px-6">
      <div className="flex items-center gap-2">
        <span className="status-dot" aria-hidden="true" />
        <span>{status}</span>
      </div>

      <PrivacyBadge />

      <a
        href="https://www.finalrev.com"
        target="_blank"
        rel="noopener noreferrer"
        title="finalrev"
        className="group inline-flex items-center justify-self-end gap-1.5 text-muted transition-colors hover:text-foreground"
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

/**
 * Small center-of-footer badge asserting the "nothing leaves your device"
 * guarantee. Hover (or focus) expands a tooltip with the details. This is a
 * claim we can back up — see the audit in `faviconUrl()` and `main.tsx`:
 *
 *  - CAD files are parsed in-browser via occt-import-js (WASM).
 *  - No `fetch`/`XHR`/`sendBeacon` call ever touches file bytes.
 *  - Fonts are bundled via @fontsource (no Google Fonts CDN).
 *  - App-icon favicons are bundled under /public/app-icons/ (no Google
 *    favicon service).
 *  - The app still makes ONE third-party call: Vercel Analytics (page views
 *    only, never CAD data). We surface that honestly in the tooltip.
 */
function PrivacyBadge() {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex justify-self-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Privacy details"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-[var(--theme-gray-100)] hover:text-foreground focus:outline-none focus-visible:bg-[var(--theme-gray-100)] focus-visible:text-foreground"
      >
        <LockIcon />
        <span className="hidden sm:inline">Your CAD stays on your device</span>
        <span className="sm:hidden">Private</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-[320px] -translate-x-1/2 rounded-lg border border-border bg-[var(--theme-gray-900)] px-3 py-2.5 text-[11px] leading-relaxed text-white shadow-xl"
          style={{ color: "#ffffff" }}
        >
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-[var(--theme-gray-900)]" />
          <strong className="block text-white">Private by default</strong>
          <span className="mt-1 block text-white/85">
            STEP files are parsed and rendered entirely in your browser using
            WebAssembly. We never upload your CAD files, their geometry, or
            any derivative of them to any server.
          </span>
          <span className="mt-2 block text-white/70">
            Fonts and app-icon favicons are bundled with the app — no Google
            Fonts or Google favicon requests. The only third-party call is
            anonymous page-view analytics (Vercel), which never sees your
            files.
          </span>
        </span>
      )}
    </span>
  );
}

function LockIcon() {
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
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default Footer;
