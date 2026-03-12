import { useId } from "react";

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
      {/* Background: Pure White */}
      <rect 
        width="48" 
        height="48" 
        rx="12" 
        className="fill-white shadow-sm"
      />
      {/* Precision mark: Pure Black */}
      <g fill="none" strokeWidth="2.8" strokeLinecap="round" className="stroke-black">
        {/* P stem */}
        <line x1="16" y1="12" x2="16" y2="36" />
        {/* P head */}
        <path d="M16 12 H26 C31 12 31 22 26 22 H16" />
        {/* Document lines */}
        <line x1="19" y1="27" x2="33" y2="27" opacity="0.6" strokeWidth="2.2" />
        <line x1="19" y1="31.5" x2="29" y2="31.5" opacity="0.4" strokeWidth="2.2" />
        <line x1="19" y1="36" x2="25" y2="36" opacity="0.25" strokeWidth="2.2" />
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
      <rect 
        width="48" 
        height="48" 
        rx="12" 
        className="fill-white shadow-sm"
      />
      <g fill="none" strokeWidth="2.8" strokeLinecap="round" className="stroke-black">
        <line x1="16" y1="12" x2="16" y2="36" />
        <path d="M16 12 H26 C31 12 31 22 26 22 H16" />
        <line x1="19" y1="27" x2="33" y2="27" opacity="0.6" strokeWidth="2.2" />
        <line x1="19" y1="31.5" x2="29" y2="31.5" opacity="0.4" strokeWidth="2.2" />
        <line x1="19" y1="36" x2="25" y2="36" opacity="0.25" strokeWidth="2.2" />
      </g>
    </svg>
  );
}
