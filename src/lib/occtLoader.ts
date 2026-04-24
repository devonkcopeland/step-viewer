import type { OcctImportJSResult } from "../../public/occt-import-js/types";

/**
 * Lazy loader for occt-import-js.
 *
 * The library ships a classic (non-module) script that registers a global
 * `window.occtimportjs` factory. Loading it from <head> at boot added ~31 KiB
 * of render-blocking JS to the critical path even though it's only needed
 * once the user actually opens a STEP file. Instead we inject it on demand
 * and cache the resolved module forever.
 *
 * `warmOcct()` lets us start that fetch early (e.g. at browser idle time or
 * right when the user begins picking a file) so there's no perceptible
 * latency when parsing kicks off, while still keeping LCP clean.
 */
export interface OcctModule {
  ReadStepFile: (
    buffer: Uint8Array,
    options: unknown
  ) => OcctImportJSResult;
}

type OcctFactory = () => Promise<OcctModule>;

declare global {
  interface Window {
    occtimportjs?: OcctFactory;
  }
}

const OCCT_SCRIPT_URL = "/occt-import-js/occt-import-js.js";

let modulePromise: Promise<OcctModule> | null = null;
let scriptPromise: Promise<void> | null = null;

function loadScriptOnce(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("occt-import-js requires a DOM"));
      return;
    }
    if (typeof window.occtimportjs === "function") {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${OCCT_SCRIPT_URL}"]`
    );
    const script = existing ?? document.createElement("script");
    const finish = () => {
      if (typeof window.occtimportjs !== "function") {
        reject(new Error("occt-import-js global missing after load"));
        return;
      }
      resolve();
    };
    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load occt-import-js")),
      { once: true }
    );
    if (!existing) {
      script.src = OCCT_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    } else if (typeof window.occtimportjs === "function") {
      // The tag was already added and finished loading before we attached
      // the listener above — resolve immediately.
      resolve();
    }
  });
  return scriptPromise;
}

/**
 * Returns the initialized OCCT module, loading and instantiating it on first
 * call. Safe to call repeatedly — subsequent calls return the cached module.
 */
export async function loadOcct(): Promise<OcctModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    await loadScriptOnce();
    const factory = window.occtimportjs;
    if (typeof factory !== "function") {
      throw new Error("occt-import-js global missing after load");
    }
    return factory();
  })();
  return modulePromise;
}

/**
 * Start downloading the script in the background. Fire-and-forget: errors
 * are swallowed here because the real `loadOcct()` call will retry/surface
 * them. Useful as an idle-time warmup so the first parse has zero network
 * wait.
 */
export function warmOcct(): void {
  if (scriptPromise || modulePromise) return;
  loadScriptOnce().catch(() => {
    // Reset so a later on-demand loadOcct() can try again.
    scriptPromise = null;
  });
}
