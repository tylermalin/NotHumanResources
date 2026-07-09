// (not)Human Resources brand marks.
//
// The logotype is styled text: grey parentheses, kinetic-green "not", and the
// wordmark in the inherited color (off-white on dark, dark on light). The (!)
// app-icon mark is an inline SVG — grey brackets around a green exclamation.

const BRACKET = "#676b78"; // slate-grey parentheses
const GREEN = "#2fe06a"; // brand kinetic green

export function AppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17 9 C 10 18, 10 30, 17 39"
        stroke={BRACKET}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M31 9 C 38 18, 38 30, 31 39"
        stroke={BRACKET}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M22.1 12 L25.9 12 L24.95 29 L23.05 29 Z" fill={GREEN} />
      <circle cx="24" cy="33.4" r="2.4" fill={GREEN} />
    </svg>
  );
}

export function Logotype({ className = "" }: { className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span style={{ color: BRACKET }}>(&nbsp;</span>
      <span style={{ color: GREEN }} className="font-medium">
        not
      </span>
      <span style={{ color: BRACKET }}>&nbsp;)</span>
      <span> HumanResources</span>
    </span>
  );
}

export function Logo({
  className = "",
  iconClassName = "h-6 w-6",
  showIcon = true,
}: {
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && <AppIcon className={`${iconClassName} shrink-0`} />}
      <Logotype />
    </span>
  );
}
