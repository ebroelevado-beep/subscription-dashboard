import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 animate-fade-in",
        className,
      )}
    >
      {/* Decorative ring + icon */}
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl scale-150" />
        <div className="relative flex items-center justify-center size-16 rounded-full bg-muted/80 border border-border/50">
          <Icon className="size-7 text-muted-foreground/70" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs text-center">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
