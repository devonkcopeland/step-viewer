import { useEffect, useState } from "react";

/**
 * True when the user's primary pointer is coarse (finger on a touchscreen).
 *
 * This is how we distinguish phones/tablets from desktops. We can't rely on
 * user-agent sniffing (iPads lie about being macOS, Chrome DevTools mobile
 * emulation doesn't change UA), and plain `"ontouchstart" in window` is too
 * broad — modern laptops with touchscreens would register as touch-only and
 * lose their mouse navigation presets.
 */
const COARSE_POINTER_QUERY = "(pointer: coarse)";

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
}

/**
 * Live-updating version. If the user plugs in a mouse, or rotates a 2-in-1
 * tablet into laptop mode, we want the UI to follow.
 */
export function useCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(isCoarsePointer);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(COARSE_POINTER_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isCoarse;
}
