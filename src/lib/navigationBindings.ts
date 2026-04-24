import {
  Binding,
  MouseButton,
  Modifier,
  NavigationAction,
  NavigationBindings,
} from "./navigationModes";

/**
 * three-stdlib's TrackballControls uses this shape. Each key is the
 * `event.button` *value* that should trigger that action slot:
 *   - LEFT slot   -> the button number that triggers ROTATE
 *   - MIDDLE slot -> the button number that triggers ZOOM  (drag-dolly)
 *   - RIGHT slot  -> the button number that triggers PAN
 * A slot set to -1 is effectively disabled (no button reports -1).
 */
export type TrackballMouseButtons = {
  LEFT: number;
  MIDDLE: number;
  RIGHT: number;
};

export const DISABLED_BUTTONS: TrackballMouseButtons = {
  LEFT: -1,
  MIDDLE: -1,
  RIGHT: -1,
};

export function modifierFromEvent(e: PointerEvent | MouseEvent): Modifier {
  // Priority order matches what CAD apps use when multiple modifiers are
  // held — shift beats ctrl beats alt. In practice only one is held at a
  // time for navigation.
  if (e.shiftKey) return "shift";
  if (e.ctrlKey) return "ctrl";
  if (e.altKey) return "alt";
  return "none";
}

export function buttonFromEvent(
  e: PointerEvent | MouseEvent
): MouseButton | null {
  switch (e.button) {
    case 0:
      return "LMB";
    case 1:
      return "MMB";
    case 2:
      return "RMB";
    default:
      return null;
  }
}

export function rawButtonValue(button: MouseButton): number {
  switch (button) {
    case "LMB":
      return 0;
    case "MMB":
      return 1;
    case "RMB":
      return 2;
  }
}

/**
 * Walk the preset's bindings and return the action whose binding matches
 * (button, modifier), or null if nothing matches (e.g. Ctrl+LMB on a
 * preset that doesn't bind it — we intentionally do nothing rather than
 * fall through to some default).
 */
export function matchAction(
  bindings: NavigationBindings,
  button: MouseButton,
  modifier: Modifier
): NavigationAction | null {
  const entries: Array<[NavigationAction, Binding | undefined]> = [
    ["rotate", bindings.rotate],
    ["pan", bindings.pan],
    ["zoom", bindings.zoom],
  ];
  for (const [action, binding] of entries) {
    if (
      binding &&
      binding.button === button &&
      binding.modifier === modifier
    ) {
      return action;
    }
  }
  return null;
}

/**
 * Build a TrackballMouseButtons mapping so that the given `rawButton` (the
 * event.button value we just saw) triggers the given action inside
 * TrackballControls. All other slots are disabled so no other pending
 * action can fire.
 */
export function mouseButtonsForAction(
  rawButton: number,
  action: NavigationAction | null
): TrackballMouseButtons {
  const mb: TrackballMouseButtons = { ...DISABLED_BUTTONS };
  if (action === "rotate") mb.LEFT = rawButton;
  else if (action === "zoom") mb.MIDDLE = rawButton;
  else if (action === "pan") mb.RIGHT = rawButton;
  return mb;
}
