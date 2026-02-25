"use client";

import { useCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";
import { CURRENCIES, Currency } from "@/lib/currency";
import { useUpdateSettings } from "@/hooks/use-account";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CurrencySelectorProps {
  variant?: "select" | "header";
}

export function CurrencySelector({ variant = "select" }: CurrencySelectorProps) {
  const { currency: currentCurrency, setCurrency, isGuest } = useCurrency();
  const updateSettings = useUpdateSettings();
  const t = useTranslations("settings");

  const handleCurrencyChange = async (newCurrency: string) => {
    if (isGuest) {
      setCurrency(newCurrency as Currency);
      return;
    }

    toast.loading(t("updating") || "Updating...", { id: "currency-update" });
    updateSettings.mutate(
      { currency: newCurrency },
      {
        onSuccess: () => {
          toast.success(t("currencyUpdated"), { id: "currency-update" });
          setCurrency(newCurrency as Currency);
        },
        onError: (err) => {
          console.error("Currency update failed:", err);
          toast.error(err.message || "Request failed", { id: "currency-update" });
        },
      }
    );
  };

  if (variant === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={updateSettings.isPending}>
            <span className="text-base font-medium">
              {CURRENCIES[currentCurrency]?.symbol || "€"}
            </span>
            <span className="sr-only">{t("currency")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(CURRENCIES).map(([code, { label, symbol }]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleCurrencyChange(code)}
              className={cn(currentCurrency === code && "bg-accent")}
            >
              <span className="mr-2 size-4 flex items-center justify-center font-medium">{symbol}</span>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Select value={currentCurrency} onValueChange={handleCurrencyChange} disabled={updateSettings.isPending}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("currency")} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CURRENCIES).map(([code, { label }]) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
