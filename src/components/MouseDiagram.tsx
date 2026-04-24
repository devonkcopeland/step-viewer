import {
  NavigationAction,
  NavigationBindings,
} from "../lib/navigationModes";

export type MouseAction = NavigationAction | null;

type Props = {
  left?: MouseAction;
  middle?: MouseAction;
  right?: MouseAction;
  wheel?: MouseAction;
  /** Small modifier glyphs rendered near the corresponding button
   *  (e.g. "⇧", "⌃") when the binding requires a modifier. */
  leftModifier?: string;
  middleModifier?: string;
  rightModifier?: string;
  size?: number;
};

const ACTION_COLORS: Record<NavigationAction, string> = {
  rotate: "#3b82f6", // blue
  pan: "#10b981", // emerald
  zoom: "#f59e0b", // amber
};

const ACTION_LETTERS: Record<NavigationAction, string> = {
  rotate: "R",
  pan: "P",
  zoom: "Z",
};

/** Resolve a `NavigationBindings` object into the props the diagram consumes.
 *  Wheel is always zoom for our presets. */
export function diagramPropsFromBindings(bindings: NavigationBindings): {
  left: MouseAction;
  middle: MouseAction;
  right: MouseAction;
  wheel: MouseAction;
  leftModifier: string;
  middleModifier: string;
  rightModifier: string;
} {
  const buttonMap: Record<"LMB" | "MMB" | "RMB", MouseAction> = {
    LMB: null,
    MMB: null,
    RMB: null,
  };
  const modMap: Record<"LMB" | "MMB" | "RMB", string> = {
    LMB: "",
    MMB: "",
    RMB: "",
  };
  const modGlyph: Record<string, string> = {
    shift: "⇧",
    ctrl: "⌃",
    alt: "⌥",
    none: "",
  };
  const pairs: Array<[NavigationAction, NavigationBindings[keyof NavigationBindings]]> =
    [
      ["rotate", bindings.rotate],
      ["pan", bindings.pan],
      ["zoom", bindings.zoom],
    ];
  // When multiple actions share the same button (e.g. SolidWorks MMB + Ctrl+MMB),
  // show the *no-modifier* binding in the diagram so the visual matches the
  // "click without thinking" behavior. Fall back to the first bound action.
  for (const [action, binding] of pairs) {
    if (!binding) continue;
    const current = buttonMap[binding.button];
    const currentMod = modMap[binding.button];
    const shouldReplace =
      current === null ||
      (currentMod !== "" && binding.modifier === "none");
    if (shouldReplace) {
      buttonMap[binding.button] = action;
      modMap[binding.button] = modGlyph[binding.modifier];
    }
  }
  return {
    left: buttonMap.LMB,
    middle: buttonMap.MMB,
    right: buttonMap.RMB,
    wheel: "zoom",
    leftModifier: modMap.LMB,
    middleModifier: modMap.MMB,
    rightModifier: modMap.RMB,
  };
}

function fillFor(action: MouseAction): string {
  return action ? ACTION_COLORS[action] : "transparent";
}

function letterFor(action: MouseAction): string {
  return action ? ACTION_LETTERS[action] : "";
}

/**
 * Simple stylized mouse illustration. Highlights LMB / MMB / RMB / wheel with
 * action colors and a single-letter glyph (R/P/Z) so users can see at a glance
 * which button does what for the active navigation preset.
 */
function MouseDiagram({
  left = null,
  middle = null,
  right = null,
  wheel = null,
  leftModifier = "",
  middleModifier = "",
  rightModifier = "",
  size = 96,
}: Props) {
  const w = size;
  const h = Math.round(size * 1.4);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 80 112"
      fill="none"
      role="img"
      aria-label="Mouse button mapping"
    >
      <defs>
        <clipPath id="mouse-body-clip">
          <path d="M40 4 C18 4 10 20 10 44 V78 C10 98 24 108 40 108 C56 108 70 98 70 78 V44 C70 20 62 4 40 4 Z" />
        </clipPath>
      </defs>

      {/* Body outline */}
      <path
        d="M40 4 C18 4 10 20 10 44 V78 C10 98 24 108 40 108 C56 108 70 98 70 78 V44 C70 20 62 4 40 4 Z"
        fill="#ffffff"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />

      {/* Button region fills (clipped to the body shape) */}
      <g clipPath="url(#mouse-body-clip)">
        {/* Left button */}
        <rect
          x="10"
          y="4"
          width="26"
          height="44"
          fill={fillFor(left)}
          opacity={left ? 0.85 : 0}
        />
        {/* Right button */}
        <rect
          x="44"
          y="4"
          width="26"
          height="44"
          fill={fillFor(right)}
          opacity={right ? 0.85 : 0}
        />
        {/* Middle button (behind the wheel) */}
        <rect
          x="34"
          y="4"
          width="12"
          height="44"
          fill={fillFor(middle)}
          opacity={middle ? 0.85 : 0}
        />
      </g>

      {/* Top separators */}
      <line
        x1="36"
        y1="6"
        x2="36"
        y2="48"
        stroke="#9ca3af"
        strokeWidth="1"
      />
      <line
        x1="44"
        y1="6"
        x2="44"
        y2="48"
        stroke="#9ca3af"
        strokeWidth="1"
      />
      <line
        x1="10"
        y1="48"
        x2="70"
        y2="48"
        stroke="#9ca3af"
        strokeWidth="1"
      />

      {/* Scroll wheel */}
      <rect
        x="37"
        y="12"
        width="6"
        height="20"
        rx="3"
        fill={wheel ? fillFor(wheel) : "#d1d5db"}
        stroke="#6b7280"
        strokeWidth="0.75"
        opacity={wheel ? 0.95 : 1}
      />
      {/* Wheel grip lines */}
      <line x1="37" y1="18" x2="43" y2="18" stroke="#6b7280" strokeWidth="0.5" />
      <line x1="37" y1="22" x2="43" y2="22" stroke="#6b7280" strokeWidth="0.5" />
      <line x1="37" y1="26" x2="43" y2="26" stroke="#6b7280" strokeWidth="0.5" />

      {/* Letter labels */}
      {left && (
        <text
          x="23"
          y="32"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="white"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {letterFor(left)}
        </text>
      )}
      {right && (
        <text
          x="57"
          y="32"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="white"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {letterFor(right)}
        </text>
      )}
      {middle && !wheel && (
        <text
          x="40"
          y="62"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill={fillFor(middle)}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {letterFor(middle)}
        </text>
      )}

      {/* Modifier glyphs (shift/ctrl/alt) floating above the relevant
          button — only shown when the binding requires a modifier. */}
      {leftModifier && (
        <text
          x="23"
          y="14"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill={fillFor(left)}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {leftModifier}
        </text>
      )}
      {rightModifier && (
        <text
          x="57"
          y="14"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill={fillFor(right)}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {rightModifier}
        </text>
      )}
      {middleModifier && (
        <text
          x="40"
          y="40"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill={fillFor(middle)}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {middleModifier}
        </text>
      )}

      {/* Wheel indicator arrow when wheel has an action */}
      {wheel && (
        <g transform="translate(62, 22)" opacity="0.85">
          <path
            d="M0 -4 L3 0 L0 4"
            fill="none"
            stroke={fillFor(wheel)}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M0 -4 L-3 0 L0 4"
            fill="none"
            stroke={fillFor(wheel)}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

export { ACTION_COLORS };
export default MouseDiagram;
