"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { UserCircle, Pause, Play, X, RefreshCw, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { differenceInDays, startOfDay } from "date-fns";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

type ExpiryStatus = "ok" | "expiring" | "expired";

function getExpiryStatus(activeUntil: string): {
  status: ExpiryStatus;
  label: string;
  daysText: string;
} {
  const today = startOfDay(new Date());
  const expiry = startOfDay(new Date(activeUntil));
  const diff = differenceInDays(expiry, today);

  if (diff < 0) {
    return {
      status: "expired",
      label: "Expired",
      daysText: `${Math.abs(diff)}d overdue`,
    };
  }
  if (diff === 0) {
    return { status: "expiring", label: "Today!", daysText: "Expires today" };
  }
  if (diff <= 3) {
    return {
      status: "expiring",
      label: `${diff}d left`,
      daysText: `Expires in ${diff} day${diff !== 1 ? "s" : ""}`,
    };
  }
  return {
    status: "ok",
    label: `${diff}d left`,
    daysText: `${diff} days remaining`,
  };
}

const expiryColors: Record<ExpiryStatus, string> = {
  ok: "border-l-green-500",
  expiring: "border-l-yellow-500",
  expired: "border-l-red-500",
};

const expiryBadgeVariant: Record<ExpiryStatus, "default" | "secondary" | "destructive"> = {
  ok: "default",
  expiring: "secondary",
  expired: "destructive",
};

const statusBadgeConfig: Record<
  "active" | "paused" | "cancelled",
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface SeatCardProps {
  seat: {
    id: string;
    clientId: string;
    customPrice: number;
    activeUntil: string;
    joinedAt: string;
    leftAt: string | null;
    status: "active" | "paused" | "cancelled";
    client: {
      id: string;
      name: string;
      phone: string | null;
      serviceUser?: string | null;
      servicePassword?: string | null;
    };
  };
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRenew: () => void;
}

export function SeatCard({ seat, onPause, onResume, onCancel, onRenew }: SeatCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const expiry = getExpiryStatus(seat.activeUntil);
  const hasCredentials = seat.client.serviceUser || seat.client.servicePassword;
  const isPaused = seat.status === "paused";
  const isCancelled = seat.status === "cancelled";
  const isActive = seat.status === "active";
  const statusConfig = statusBadgeConfig[seat.status];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-l-4 p-4 transition-colors ${
        isPaused
          ? "border-l-amber-500 bg-muted/40 opacity-80"
          : isCancelled
            ? "border-l-gray-400 bg-muted/30 opacity-60"
            : `hover:bg-muted/50 ${expiryColors[expiry.status]}`
      }`}
    >
      {/* Header: Client name + status badge + actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-full bg-muted">
            <UserCircle className="size-5 text-muted-foreground" />
          </div>
          <div>
            <Link
              href={`/dashboard/clients/${seat.clientId}`}
              className="font-medium text-sm hover:underline"
            >
              {seat.client.name}
            </Link>
            {seat.client.phone && (
              <p className="text-xs text-muted-foreground">{seat.client.phone}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={statusConfig.variant} className="text-[10px] h-5">
            {statusConfig.label}
          </Badge>
          {!isCancelled && (
            <>
              {/* Pause / Resume toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`size-7 ${
                        isPaused
                          ? "text-green-600 hover:text-green-700 dark:text-green-400"
                          : "text-amber-600 hover:text-amber-700 dark:text-amber-400"
                      }`}
                      onClick={isPaused ? onResume : onPause}
                    >
                      {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                      <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isPaused ? "Resume seat" : "Pause seat"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Renew — only for active seats */}
              {isActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        onClick={onRenew}
                      >
                        <RefreshCw className="size-3.5" />
                        <span className="sr-only">Renew</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Record payment</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Cancel */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={onCancel}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove from subscription</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Price</span>
        <span className="font-mono font-medium">
          {formatCurrency(Number(seat.customPrice))}
        </span>
      </div>

      {/* Expiry with color */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isPaused ? "Frozen until" : "Expires"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isPaused ? "Paused" : expiry.daysText}
          </span>
          <Badge variant={isPaused ? "secondary" : expiryBadgeVariant[expiry.status]} className="text-xs">
            {new Date(seat.activeUntil).toLocaleDateString("es-ES")}
          </Badge>
        </div>
      </div>

      {/* Credentials */}
      {hasCredentials && (
        <div className="rounded border bg-muted/30 p-2 space-y-1.5">
          {seat.client.serviceUser && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">User</span>
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs">{seat.client.serviceUser}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={() =>
                    copyToClipboard(seat.client.serviceUser!, "User")
                  }
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          )}
          {seat.client.servicePassword && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pass</span>
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs">
                  {showPassword
                    ? seat.client.servicePassword
                    : "••••••••"}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-3" />
                  ) : (
                    <Eye className="size-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={() =>
                    copyToClipboard(seat.client.servicePassword!, "Password")
                  }
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
