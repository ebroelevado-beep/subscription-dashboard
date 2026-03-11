import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  const aluminumId = useId().replace(/:/g, "");
  const obsidianId = useId().replace(/:/g, "");

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
      <defs>
        <linearGradient id={aluminumId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(100% 0 0)" />
          <stop offset="100%" stopColor="oklch(92.2% 0 0)" />
        </linearGradient>
        <linearGradient id={obsidianId} x1="16" y1="12" x2="16" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(25% 0 0)" />
          <stop offset="100%" stopColor="oklch(14.5% 0 0)" />
        </linearGradient>
      </defs>
      {/* Background: Obsidian in light, Aluminum in dark */}
      <rect 
        width="48" 
        height="48" 
        rx="12" 
        className="fill-[#18181B] dark:fill-[url(#${aluminumId})]"
      />
      {/* Precision mark: White in light, Obsidian in dark */}
      <g fill="none" strokeWidth="2.8" strokeLinecap="round" className="stroke-white dark:stroke-[url(#${obsidianId})]">
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
  const aluminumId = useId().replace(/:/g, "");
  const obsidianId = useId().replace(/:/g, "");

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
      <defs>
        <linearGradient id={aluminumId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(100% 0 0)" />
          <stop offset="100%" stopColor="oklch(92.2% 0 0)" />
        </linearGradient>
        <linearGradient id={obsidianId} x1="16" y1="12" x2="16" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(25% 0 0)" />
          <stop offset="100%" stopColor="oklch(14.5% 0 0)" />
        </linearGradient>
      </defs>
      <rect 
        width="48" 
        height="48" 
        rx="12" 
        className="fill-[#18181B] dark:fill-[url(#${aluminumId})]"
      />
      <g fill="none" strokeWidth="2.8" strokeLinecap="round" className="stroke-white dark:stroke-[url(#${obsidianId})]">
        <line x1="16" y1="12" x2="16" y2="36" />
        <path d="M16 12 H26 C31 12 31 22 26 22 H16" />
        <line x1="19" y1="27" x2="33" y2="27" opacity="0.6" strokeWidth="2.2" />
        <line x1="19" y1="31.5" x2="29" y2="31.5" opacity="0.4" strokeWidth="2.2" />
        <line x1="19" y1="36" x2="25" y2="36" opacity="0.25" strokeWidth="2.2" />
      </g>
    </svg>
  );
}
