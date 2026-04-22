type LogoProps = {
  size?: number;
  className?: string;
  /** Render stroke-animated version used by the loader */
  animated?: boolean;
};

/**
 * finalrev brand mark. When `animated` is true, paths use the
 * stroke-draw animation defined in index.css (.logo-draw).
 */
function Logo({ size = 22, className, animated = false }: LogoProps) {
  if (animated) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 445 445"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`logo-draw ${className ?? ""}`}
        aria-hidden="true"
      >
        <path d="M335.964 145.544L109.036 275.875V145.544L222.499 78.8462L335.964 145.544Z" />
        <path d="M335.964 248.276L222.501 182.345L109.038 248.276V348.353C109.038 362.031 123.841 370.585 135.691 363.751L335.967 248.279L335.964 248.276Z" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 445 445"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M335.964 145.544L109.036 275.875V145.544L222.499 78.8462L335.964 145.544Z"
        fill="currentColor"
      />
      <path
        opacity="0.6"
        d="M335.964 248.276L222.501 182.345L109.038 248.276V348.353C109.038 362.031 123.841 370.585 135.691 363.751L335.967 248.279L335.964 248.276Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Logo;
