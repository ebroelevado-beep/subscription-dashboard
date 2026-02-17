interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pearfect S.L. logo"
    >
      {/* Background rounded square */}
      <rect width="48" height="48" rx="12" fill="currentColor" />
      {/* Stylized P with ledger lines */}
      <g fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        {/* Vertical bar of P */}
        <line x1="16" y1="12" x2="16" y2="36" />
        {/* P curve */}
        <path d="M16 12 H28 C33 12 33 22 28 22 H16" />
        {/* Ledger lines */}
        <line x1="20" y1="28" x2="34" y2="28" opacity="0.5" />
        <line x1="20" y1="32" x2="30" y2="32" opacity="0.35" />
        <line x1="20" y1="36" x2="26" y2="36" opacity="0.2" />
      </g>
    </svg>
  );
}

export function LogoMark({ size = 20, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pearfect S.L."
    >
      <rect width="48" height="48" rx="12" fill="currentColor" />
      <g fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="16" y1="12" x2="16" y2="36" />
        <path d="M16 12 H28 C33 12 33 22 28 22 H16" />
        <line x1="20" y1="28" x2="34" y2="28" opacity="0.5" />
        <line x1="20" y1="32" x2="30" y2="32" opacity="0.35" />
        <line x1="20" y1="36" x2="26" y2="36" opacity="0.2" />
      </g>
    </svg>
  );
}
