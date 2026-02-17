"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateSubscription, useUpdateSubscription, type Subscription,
} from "@/hooks/use-subscriptions";
import { usePlans } from "@/hooks/use-plans";
import { usePlatforms } from "@/hooks/use-platforms";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMonths, format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

const schema = z.object({
  platformId: z.string().min(1, "validation.platformRequired"),
  planId: z.string().min(1, "validation.planRequired"),
  label: z.string().min(1, "validation.labelRequired").max(100),
  startDate: z.string().min(1, "validation.startDateRequired"),
  durationMonths: z.coerce.number().int().positive("validation.atLeast1Month"),
  status: z.enum(["active", "paused", "cancelled"]),
});

type FormValues = z.infer<typeof schema>;

interface SubscriptionFormDialogProps {
  mode: "create" | "edit";
  subscription?: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionFormDialog({ mode, subscription, open, onOpenChange }: SubscriptionFormDialogProps) {
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const { data: platforms } = usePlatforms();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const t = useTranslations("subscriptions");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");

  const today = new Date().toISOString().split("T")[0];

  const {
    register, handleSubmit, reset, control, watch, setValue, formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      platformId: "", planId: "", label: "", startDate: today,
      durationMonths: 1, status: "active",
    },
  });

  const selectedPlatformId = watch("platformId");
  const selectedStartDate = watch("startDate");
  const selectedDuration = watch("durationMonths");

  // Fetch plans filtered by selected platform
  const { data: plans } = usePlans(selectedPlatformId || undefined);

  // Reset planId when platform changes
  const [prevPlatformId, setPrevPlatformId] = useState(selectedPlatformId);
  useEffect(() => {
    if (selectedPlatformId !== prevPlatformId) {
      setValue("planId", "");
      setPrevPlatformId(selectedPlatformId);
    }
  }, [selectedPlatformId, prevPlatformId, setValue]);

  // Compute preview date
  const previewDate = selectedStartDate && selectedDuration > 0
    ? format(addMonths(new Date(selectedStartDate), selectedDuration), "dd/MM/yyyy")
    : null;

  // Capacity warning when changing plan in edit mode
  const selectedPlanId = watch("planId");
  const capacityWarning = useMemo(() => {
    if (mode !== "edit" || !subscription || !selectedPlanId || !plans) return null;
    const newPlan = plans.find(p => p.id === selectedPlanId);
    if (!newPlan || newPlan.maxSeats == null) return null;
    const activeSeats = subscription.clientSubscriptions?.filter(
      (s: { status: string }) => s.status === "active" || s.status === "paused"
    ).length ?? 0;
    if (activeSeats > newPlan.maxSeats) {
      return t("capacityWarning", { max: newPlan.maxSeats, current: activeSeats });
    }
    return null;
  }, [mode, subscription, selectedPlanId, plans, t]);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && subscription) {
        // Find platform from existing data
        const platform = platforms?.find(p =>
          p.plans.some(pl => pl.id === subscription.planId)
        );
        reset({
          platformId: platform?.id ?? "",
          planId: subscription.planId,
          label: subscription.label,
          startDate: subscription.startDate.split("T")[0],
          durationMonths: 1,
          status: subscription.status,
        });
      } else {
        reset({
          platformId: "", planId: "", label: "", startDate: today,
          durationMonths: 1, status: "active",
        });
      }
    }
  }, [open, mode, subscription, reset, today, platforms]);

  const onSubmit = async (values: FormValues) => {
    if (mode === "edit" && subscription) {
      await updateMutation.mutateAsync({
        id: subscription.id,
        planId: values.planId,
        label: values.label,
        startDate: values.startDate,
        durationMonths: values.durationMonths,
        status: values.status,
      });
    } else {
      await createMutation.mutateAsync({
        planId: values.planId,
        label: values.label,
        startDate: values.startDate,
        durationMonths: values.durationMonths,
        status: values.status,
      });
    }
    onOpenChange(false);
  };

  const getErrorMessage = (msg?: string) => {
    if (!msg) return undefined;
    const parts = msg.split(".");
    if (parts.length === 2 && parts[0] === "validation") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return tv(parts[1] as any);
      } catch {
        return msg;
      }
    }
    return msg;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("newTitle") : t("editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("newDescription")
              : t("editDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Platform */}
          <div className="space-y-2">
            <Label>{tc("platform")}</Label>
            <Controller
              control={control}
              name="platformId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectPlatform")} />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.platformId && <p className="text-sm text-destructive">{getErrorMessage(errors.platformId.message)}</p>}
          </div>

          {/* Plan (filtered by platform) */}
          <div className="space-y-2">
            <Label>{tc("plan")}</Label>
            <Controller
              control={control}
              name="planId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedPlatformId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedPlatformId ? t("selectPlan") : t("selectPlatformFirst")} />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.platform.name} — {p.name} (€{Number(p.cost).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.planId && <p className="text-sm text-destructive">{getErrorMessage(errors.planId.message)}</p>}
            {capacityWarning && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-2">
                <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">{capacityWarning}</p>
              </div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="sub-label">{t("labelField")}</Label>
            <Input
              id="sub-label"
              placeholder={t("labelPlaceholder")}
              {...register("label")}
            />
            {errors.label && <p className="text-sm text-destructive">{getErrorMessage(errors.label.message)}</p>}
          </div>

          {/* Start Date + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-start">{t("startDate")}</Label>
              <Input id="sub-start" type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{getErrorMessage(errors.startDate.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-duration">{t("durationMonths")}</Label>
              <Input
                id="sub-duration"
                type="number"
                min="1"
                {...register("durationMonths")}
              />
              {errors.durationMonths && <p className="text-sm text-destructive">{getErrorMessage(errors.durationMonths.message)}</p>}
            </div>
          </div>

          {/* Date preview */}
          {previewDate && (
            <p className="text-xs text-muted-foreground">
              {t("activeUntil", { date: previewDate })}
            </p>
          )}

          {/* Status (edit only) */}
          {mode === "edit" && (
            <div className="space-y-2">
              <Label>{t("statusLabel")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{tc("active")}</SelectItem>
                      <SelectItem value="paused">{tc("paused")}</SelectItem>
                      <SelectItem value="cancelled">{tc("cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !!capacityWarning}>
              {isPending ? tc("saving") : mode === "create" ? tc("create") : tc("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
