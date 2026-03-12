import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Pearfect S.L. logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <line x1="16" y1="12" x2="16" y2="36" />
          <path d="M16 12 H26 C31 12 31 22 26 22 H16" />
          <line x1="19" y1="27" x2="33" y2="27" opacity="0.6" strokeWidth="2.2" />
          <line x1="19" y1="31.5" x2="29" y2="31.5" opacity="0.4" strokeWidth="2.2" />
          <line x1="19" y1="36" x2="25" y2="36" opacity="0.25" strokeWidth="2.2" />
        </g>
      </svg>
    </div>
  );
}

export function LogoMark({ size = 20, className = "" }: LogoProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Pearfect S.L."
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <line x1="16" y1="12" x2="16" y2="36" />
          <path d="M16 12 H26 C31 12 31 22 26 22 H16" />
          <line x1="19" y1="27" x2="33" y2="27" opacity="0.6" strokeWidth="2.2" />
          <line x1="19" y1="31.5" x2="29" y2="31.5" opacity="0.4" strokeWidth="2.2" />
          <line x1="19" y1="36" x2="25" y2="36" opacity="0.25" strokeWidth="2.2" />
        </g>
      </svg>
    </div>
  );
}
