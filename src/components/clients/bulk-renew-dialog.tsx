"use client";

import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, CheckSquare, Square } from "lucide-react";
import { addMonths, startOfDay, format, differenceInDays } from "date-fns";
import { useRenewBulkClients } from "@/hooks/use-renewals";
import { useTranslations } from "next-intl";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}


export interface BulkRenewSeat {
  id: string;
  customPrice: number;
  activeUntil: string;
  status: string;
  platformName: string;
  planName: string;
  subscriptionLabel: string;
}

interface BulkRenewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  seats: BulkRenewSeat[];
}

export function BulkRenewDialog({
  open,
  onOpenChange,
  clientName,
  seats,
}: BulkRenewDialogProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const bulkMut = useRenewBulkClients();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [months, setMonths] = useState(1);

  // Reset selection when dialog opens
  const renewableSeats = useMemo(
    () => seats.filter((s) => s.status === "active"),
    [seats]
  );

  // Initialize all selected when the dialog opens with new seats
  useState(() => {
    setSelectedIds(new Set(renewableSeats.map((s) => s.id)));
  });

  // When seats change, reset to all selected
  const seatIds = renewableSeats.map((s) => s.id).join(",");
  useMemo(() => {
    setSelectedIds(new Set(renewableSeats.map((s) => s.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatIds]);

  const toggleSeat = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === renewableSeats.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(renewableSeats.map((s) => s.id)));
    }
  };

  const today = startOfDay(new Date());

  // Compute preview per seat
  const previews = useMemo(() => {
    return renewableSeats.map((seat) => {
      const currentExpiry = startOfDay(new Date(seat.activeUntil));
      const isLapsed = currentExpiry < today;
      const newExpiry = addMonths(currentExpiry, months);
      const diff = differenceInDays(currentExpiry, today);
      return { ...seat, currentExpiry, newExpiry, isLapsed, daysLeft: diff };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renewableSeats, months]);

  // Total
  const selectedTotal = previews
    .filter((p) => selectedIds.has(p.id))
    .reduce((sum, p) => sum + p.customPrice * months, 0);

  const selectedCount = selectedIds.size;

  const handleConfirm = () => {
    if (selectedCount === 0) return;

    const items = previews
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        clientSubscriptionId: p.id,
        amountPaid: p.customPrice * months,
      }));

    bulkMut.mutate(
      { items, months, clientName },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const allSelected = selectedIds.size === renewableSeats.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5 text-primary" />
            {t("renewAllTitle")} — {clientName}
          </DialogTitle>
          <DialogDescription>
            {t("renewAllDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Months input */}
        <div className="space-y-2">
          <Label htmlFor="bulk-months">{t("monthsToRenew")}</Label>
          <Input
            id="bulk-months"
            type="number"
            min={1}
            max={12}
            value={months}
            onChange={(e) => setMonths(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
          />
        </div>

        <Separator />

        {/* Select all toggle */}
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={toggleAll}
        >
          {allSelected ? (
            <CheckSquare className="size-4 text-primary" />
          ) : (
            <Square className="size-4" />
          )}
          {allSelected ? tc("deselectAll") : tc("selectAll")}
        </button>

        {/* Seat list */}
        <div className="space-y-2">
          {previews.map((seat) => {
            const isSelected = selectedIds.has(seat.id);
            return (
              <button
                key={seat.id}
                type="button"
                onClick={() => toggleSeat(seat.id)}
                className={`w-full text-left rounded-lg border p-3 space-y-1.5 transition-all duration-150 ${
                  isSelected
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "opacity-50 border-muted"
                }`}
              >
                {/* Row 1: checkbox + name + price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckSquare className="size-4 text-primary shrink-0" />
                    ) : (
                      <Square className="size-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-medium">
                      {seat.platformName} — {seat.planName}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold">
                    {formatCurrency(seat.customPrice * months)}
                  </span>
                </div>

                {/* Row 2: expiry info */}
                <div className="flex items-center justify-between pl-6 text-xs text-muted-foreground">
                  <span>{seat.subscriptionLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={seat.isLapsed ? "text-destructive font-medium" : ""}>
                      {format(seat.currentExpiry, "dd/MM/yy")}
                      {seat.isLapsed && ` (${tc("lapsed")})`}
                    </span>
                    <span>→</span>
                    <Badge
                      variant="default"
                      className="text-[10px] h-4 bg-green-600 hover:bg-green-600"
                    >
                      {format(seat.newExpiry, "dd/MM/yy")}
                    </Badge>
                  </div>
                </div>

                {/* Row 3: price per month hint */}
                {months > 1 && (
                  <p className="text-[10px] text-muted-foreground pl-6">
                    {formatCurrency(seat.customPrice)}{t("perMonth")} × {months}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {tc("totalCount", { count: selectedCount })}
          </span>
          <span className="text-lg font-bold font-mono">
            {formatCurrency(selectedTotal)}
          </span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0 || bulkMut.isPending}
            onClick={handleConfirm}
          >
            {bulkMut.isPending
              ? tc("processing")
              : t("renewServicesAction", { count: selectedCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
