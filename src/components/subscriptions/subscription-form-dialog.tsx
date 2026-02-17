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

const schema = z.object({
  platformId: z.string().min(1, "Platform is required"),
  planId: z.string().min(1, "Plan is required"),
  label: z.string().min(1, "Label is required").max(100),
  startDate: z.string().min(1, "Start date is required"),
  durationMonths: z.coerce.number().int().positive("Must be at least 1 month"),
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
      return `This plan allows ${newPlan.maxSeats} seats but ${activeSeats} are currently occupied. Reduce seats first.`;
    }
    return null;
  }, [mode, subscription, selectedPlanId, plans]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Subscription" : "Edit Subscription"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new subscription instance from a plan."
              : "Update this subscription."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Platform */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <Controller
              control={control}
              name="platformId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
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
            {errors.platformId && <p className="text-sm text-destructive">{errors.platformId.message}</p>}
          </div>

          {/* Plan (filtered by platform) */}
          <div className="space-y-2">
            <Label>Plan</Label>
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
                    <SelectValue placeholder={selectedPlatformId ? "Select a plan" : "Select a platform first"} />
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
            {errors.planId && <p className="text-sm text-destructive">{errors.planId.message}</p>}
            {capacityWarning && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-2">
                <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">{capacityWarning}</p>
              </div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="sub-label">Label</Label>
            <Input
              id="sub-label"
              placeholder="e.g. Netflix - Family Account"
              {...register("label")}
            />
            {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          </div>

          {/* Start Date + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-start">Start Date</Label>
              <Input id="sub-start" type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-duration">Duration (months)</Label>
              <Input
                id="sub-duration"
                type="number"
                min="1"
                {...register("durationMonths")}
              />
              {errors.durationMonths && <p className="text-sm text-destructive">{errors.durationMonths.message}</p>}
            </div>
          </div>

          {/* Date preview */}
          {previewDate && (
            <p className="text-xs text-muted-foreground">
              Active until: <span className="font-medium text-foreground">{previewDate}</span>
            </p>
          )}

          {/* Status (edit only) */}
          {mode === "edit" && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !!capacityWarning}>
              {isPending ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
