"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePlan, useUpdatePlan, type Plan } from "@/hooks/use-plans";
import { usePlatforms } from "@/hooks/use-platforms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const schema = z.object({
  platformId: z.string().min(1, "Platform is required"),
  name: z.string().min(1, "Name is required").max(100),
  cost: z.coerce.number().min(0, "Cost must be ≥ 0"),
  maxSeats: z.union([
    z.coerce.number().int().positive(),
    z.literal("").transform(() => undefined),
  ]).optional(),
  isActive: z.boolean().default(true),
});

type FormValues = {
  platformId: string;
  name: string;
  cost: number;
  maxSeats?: number;
  isActive: boolean;
};

interface PlanFormDialogProps {
  mode: "create" | "edit";
  plan?: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanFormDialog({
  mode,
  plan,
  open,
  onOpenChange,
}: PlanFormDialogProps) {
  const { data: platforms } = usePlatforms();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      platformId: "",
      name: "",
      cost: 0,
      maxSeats: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && plan) {
        reset({
          platformId: plan.platformId,
          name: plan.name,
          cost: Number(plan.cost),
          maxSeats: plan.maxSeats ?? undefined,
          isActive: plan.isActive,
        });
      } else {
        reset({
          platformId: "",
          name: "",
          cost: 0,
          maxSeats: undefined,
          isActive: true,
        });
      }
    }
  }, [open, mode, plan, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      maxSeats: values.maxSeats ?? null,
    };

    if (mode === "edit" && plan) {
      await updateMutation.mutateAsync({ id: plan.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Plan" : "Edit Plan"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define a new plan template with pricing and seat limits."
              : "Update this plan's details."}
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
                    <SelectValue placeholder="Select a platform…" />
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
            {errors.platformId && (
              <p className="text-sm text-destructive">
                {errors.platformId.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input
              id="plan-name"
              placeholder="e.g. Premium, Family, Basic…"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Cost + Max Seats row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-cost">My Cost (€)</Label>
              <Input
                id="plan-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("cost")}
              />
              {errors.cost && (
                <p className="text-sm text-destructive">
                  {errors.cost.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="plan-seats">Max Seats</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Leave empty for unlimited seats
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="plan-seats"
                type="number"
                min="1"
                placeholder="∞"
                {...register("maxSeats")}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive plans won&apos;t appear in new subscriptions
              </p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : mode === "create"
                  ? "Create"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
