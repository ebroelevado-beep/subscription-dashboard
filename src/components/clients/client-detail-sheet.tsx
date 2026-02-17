"use client";

import { useState } from "react";
import { useClient } from "@/hooks/use-clients";
import { useRenewClient } from "@/hooks/use-renewals";
import { BulkRenewDialog, type BulkRenewSeat } from "@/components/clients/bulk-renew-dialog";
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import {
  Copy, Eye, EyeOff, RefreshCw, MessageCircle, UserCircle, AlertTriangle,
} from "lucide-react";
import { differenceInDays, startOfDay, addMonths, subMonths, format } from "date-fns";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

type ExpiryStatus = "ok" | "expiring" | "expired";

function getExpiryInfo(activeUntil: string) {
  const today = startOfDay(new Date());
  const expiry = startOfDay(new Date(activeUntil));
  const diff = differenceInDays(expiry, today);

  let status: ExpiryStatus = "ok";
  if (diff < 0) status = "expired";
  else if (diff <= 3) status = "expiring";

  return { diff, status };
}

const expiryBadge: Record<ExpiryStatus, "default" | "secondary" | "destructive"> = {
  ok: "default",
  expiring: "secondary",
  expired: "destructive",
};

// ── WhatsApp helpers ──

type Lang = "es" | "en";

function buildWhatsAppUrl(
  phone: string,
  name: string,
  seats: { customPrice: number; activeUntil: string; platformName: string }[],
  lang: Lang
) {
  const totalPrice = seats.reduce((s, x) => s + x.customPrice, 0);
  const services = [...new Set(seats.map((s) => s.platformName))].join(", ");

  // Use the closest deadline
  const today = startOfDay(new Date());
  const daysArr = seats.map((s) => differenceInDays(startOfDay(new Date(s.activeUntil)), today));
  const minDays = Math.min(...daysArr);

  let daysText: string;
  if (lang === "es") {
    daysText =
      minDays < 0
        ? `con ${Math.abs(minDays)} día${Math.abs(minDays) !== 1 ? "s" : ""} de retraso`
        : `te quedan ${minDays} día${minDays !== 1 ? "s" : ""} para pagar`;
  } else {
    daysText =
      minDays < 0
        ? `overdue by ${Math.abs(minDays)} day${Math.abs(minDays) !== 1 ? "s" : ""}`
        : `you have ${minDays} day${minDays !== 1 ? "s" : ""} left to pay`;
  }

  const priceStr = formatCurrency(totalPrice);

  const msg =
    lang === "es"
      ? `Hola ${name}, ${daysText} ${priceStr} por ${services}. Gracias de parte del equipo de Pearfect S.L.`
      : `Hello ${name}, ${daysText} ${priceStr} for ${services}. Thanks from the Pearfect S.L. team.`;

  // Clean phone: remove spaces, dashes, ensure starts with +
  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// ── Component ──

interface ClientDetailSheetProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailSheet({ clientId, open, onOpenChange }: ClientDetailSheetProps) {
  const { data: client, isLoading } = useClient(clientId ?? undefined);
  const renewMut = useRenewClient();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState<Lang>("es");
  const [bulkRenewOpen, setBulkRenewOpen] = useState(false);

  // Renew dialog state
  const [renewSeat, setRenewSeat] = useState<{
    id: string;
    customPrice: number;
    activeUntil: string;
    clientName: string;
  } | null>(null);
  const [renewAmount, setRenewAmount] = useState(0);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewNotes, setRenewNotes] = useState("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const openRenewDialog = (seat: {
    id: string;
    customPrice: number;
    activeUntil: string;
  }) => {
    setRenewSeat({
      ...seat,
      clientName: client?.name ?? "Client",
    });
    setRenewAmount(Number(seat.customPrice));
    setRenewMonths(1);
    setRenewNotes("");
  };

  const handleRenewMonthsChange = (newMonths: number) => {
    let clamped = Math.max(-12, Math.min(12, newMonths));
    if (clamped === 0) clamped = newMonths > 0 ? 1 : -1;
    setRenewMonths(clamped);
    const seatPrice = renewSeat ? Number(renewSeat.customPrice) : 0;
    if (clamped > 0) {
      setRenewAmount(Number((seatPrice * clamped).toFixed(2)));
    } else {
      setRenewAmount(0);
    }
  };

  const handleRenew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewSeat) return;
    renewMut.mutate(
      { seatId: renewSeat.id, amountPaid: renewAmount, months: renewMonths, notes: renewNotes || null },
      { onSuccess: () => setRenewSeat(null) }
    );
  };

  // Renew preview
  const currentExpiry = renewSeat ? startOfDay(new Date(renewSeat.activeUntil)) : new Date();
  const today = startOfDay(new Date());
  const isRenewCorrection = renewMonths < 0;
  let newExpiry: Date;
  if (isRenewCorrection) {
    newExpiry = subMonths(currentExpiry, Math.abs(renewMonths));
  } else {
    const baseDate = currentExpiry >= today ? currentExpiry : today;
    newExpiry = addMonths(baseDate, renewMonths);
  }
  const isLapsed = renewSeat ? currentExpiry < today : false;
  const resultInPast = newExpiry < today;

  // Active seats for WhatsApp
  const activeSeats = client?.clientSubscriptions.filter((cs) => cs.status === "active") ?? [];
  const canSendReminder = client?.phone && activeSeats.length > 0;

  const handleSendReminder = () => {
    if (!client?.phone || activeSeats.length === 0) return;
    const waData = activeSeats.map((cs) => ({
      customPrice: Number(cs.customPrice),
      activeUntil: cs.activeUntil,
      platformName: cs.subscription.plan.platform.name,
    }));
    const url = buildWhatsAppUrl(client.phone, client.name, waData, lang);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetTitle className="sr-only">Client Details</SheetTitle>
          <SheetDescription className="sr-only">
            Manage seats, renewals, and send reminders for this client.
          </SheetDescription>

          {isLoading || !client ? (
            <div className="space-y-4 pt-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-5 pt-2">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-full bg-muted">
                    <UserCircle className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{client.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {client.phone ?? "No phone"} · {client.notes ?? "No notes"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credentials */}
              {(client.serviceUser || client.servicePassword) && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credentials</p>
                  {client.serviceUser && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">User</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-sm">{client.serviceUser}</code>
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => copyToClipboard(client.serviceUser!, "User")}>
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {client.servicePassword && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pass</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-sm">
                          {showPasswords["global"] ? client.servicePassword : "••••••••"}
                        </code>
                        <Button variant="ghost" size="icon" className="size-6"
                          onClick={() => setShowPasswords((p) => ({ ...p, global: !p.global }))}>
                          {showPasswords["global"] ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => copyToClipboard(client.servicePassword!, "Password")}>
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp Reminder */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] dark:bg-[#25D366]/15 dark:hover:bg-[#25D366] transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:shadow-[#25D366]/20"
                  onClick={handleSendReminder}
                  disabled={!canSendReminder}
                >
                  <MessageCircle className="mr-2 size-4" />
                  Send Reminder
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-mono text-xs"
                        onClick={() => setLang(lang === "es" ? "en" : "es")}
                      >
                        {lang === "es" ? "🇪🇸 ES" : "🇬🇧 EN"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {lang === "es" ? "Switch to English" : "Cambiar a español"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {!canSendReminder && client.phone && activeSeats.length === 0 && (
                <p className="text-xs text-muted-foreground">No active seats to remind about.</p>
              )}
              {!client.phone && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Add a phone number to enable WhatsApp reminders.</p>
              )}

              {/* Seats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Seats ({client.clientSubscriptions.length})
                  </p>
                  {activeSeats.length >= 2 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setBulkRenewOpen(true)}
                    >
                      <RefreshCw className="mr-1.5 size-3" />
                      Renew All
                    </Button>
                  )}
                </div>

                {client.clientSubscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No seats assigned.</p>
                ) : (
                  client.clientSubscriptions.map((cs) => {
                    const expiry = getExpiryInfo(cs.activeUntil);
                    const isPaused = cs.status === "paused";
                    const isCancelled = cs.status === "cancelled";

                    return (
                      <div
                        key={cs.id}
                        className={`rounded-lg border p-3 space-y-2 transition-colors ${
                          isCancelled
                            ? "opacity-50 bg-muted/20"
                            : isPaused
                              ? "opacity-80 bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                              : ""
                        }`}
                      >
                        {/* Service info */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              href={`/dashboard/subscriptions/${cs.subscription.id}`}
                              className="text-sm font-medium hover:underline"
                              onClick={() => onOpenChange(false)}
                            >
                              {cs.subscription.plan.platform.name} — {cs.subscription.plan.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{cs.subscription.label}</p>
                          </div>
                          <Badge variant={
                            cs.status === "active" ? "default" :
                            cs.status === "paused" ? "secondary" : "destructive"
                          } className="text-[10px] h-5">
                            {cs.status}
                          </Badge>
                        </div>

                        {/* Price & Expiry */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-mono">{formatCurrency(Number(cs.customPrice))}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {isPaused
                                ? "Frozen"
                                : expiry.diff < 0
                                  ? `${Math.abs(expiry.diff)}d overdue`
                                  : expiry.diff === 0
                                    ? "Today!"
                                    : `${expiry.diff}d left`}
                            </span>
                            <Badge variant={isPaused ? "secondary" : expiryBadge[expiry.status]} className="text-[10px]">
                              {format(new Date(cs.activeUntil), "dd/MM/yyyy")}
                            </Badge>
                          </div>
                        </div>

                        {/* Renew button — only for active seats */}
                        {cs.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => openRenewDialog({
                              id: cs.id,
                              customPrice: Number(cs.customPrice),
                              activeUntil: cs.activeUntil,
                            })}
                          >
                            <RefreshCw className="mr-2 size-3.5" />
                            Renew
                          </Button>
                        )}

                        {/* Recent renewals */}
                        {cs.renewalLogs.length > 0 && (
                          <div className="border-t pt-2 mt-1">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              Recent Payments
                            </p>
                            {cs.renewalLogs.slice(0, 3).map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{format(new Date(r.paidOn), "dd/MM/yyyy")}</span>
                                <span className="font-mono">{formatCurrency(Number(r.amountPaid))}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Renew Dialog */}
      <Dialog open={!!renewSeat} onOpenChange={(o) => { if (!o) setRenewSeat(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRenewCorrection ? "Correction" : "Renew"} — {renewSeat?.clientName ?? "Client"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenew} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="renew-amount">Amount Received (€)</Label>
              <Input
                id="renew-amount"
                type="number"
                step="0.01"
                value={renewAmount}
                onChange={(e) => setRenewAmount(Number(e.target.value))}
              />
              {renewMonths > 1 && renewSeat && (
                <p className="text-xs text-muted-foreground">
                  Auto-calculated: {Number(renewSeat.customPrice).toFixed(2)} × {renewMonths} months
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="renew-months">Months</Label>
              <Input
                id="renew-months"
                type="number"
                min={-12}
                max={12}
                value={renewMonths}
                onChange={(e) => handleRenewMonthsChange(Number(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Positive = extend, negative = correction
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="renew-notes">Notes (optional)</Label>
              <Input
                id="renew-notes"
                value={renewNotes}
                onChange={(e) => setRenewNotes(e.target.value)}
                placeholder="e.g. Paid via Bizum"
              />
            </div>

            {/* Preview */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current expiry</span>
                <span className={isLapsed ? "text-destructive font-medium" : ""}>
                  {format(currentExpiry, "dd/MM/yyyy")}
                  {isLapsed && " (lapsed)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New expiry</span>
                <span className={`font-semibold ${resultInPast ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                  {format(newExpiry, "dd/MM/yyyy")}
                </span>
              </div>
              {isLapsed && renewMonths > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Lapsed — renewal starts from today instead of the old expiry.
                </p>
              )}
            </div>

            {resultInPast && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span>This will set the expiry to a past date. The seat will show as <strong>expired</strong>.</span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewSeat(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renewMut.isPending} variant={isRenewCorrection ? "destructive" : "default"}>
                {renewMut.isPending ? "Processing…" : isRenewCorrection ? "Apply Correction" : "Confirm Renewal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Renew Dialog */}
      {client && (
        <BulkRenewDialog
          open={bulkRenewOpen}
          onOpenChange={setBulkRenewOpen}
          clientName={client.name}
          seats={client.clientSubscriptions.map((cs): BulkRenewSeat => ({
            id: cs.id,
            customPrice: Number(cs.customPrice),
            activeUntil: cs.activeUntil,
            status: cs.status,
            platformName: cs.subscription.plan.platform.name,
            planName: cs.subscription.plan.name,
            subscriptionLabel: cs.subscription.label,
          }))}
        />
      )}
    </>
  );
}
