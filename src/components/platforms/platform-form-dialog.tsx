"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreatePlatform,
  useUpdatePlatform,
  type Platform,
} from "@/hooks/use-platforms";
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
import { useTranslations } from "next-intl";

const schema = z.object({
  name: z.string().min(1, "validation.nameRequired").max(100),
});

type FormValues = z.infer<typeof schema>;

interface PlatformFormDialogProps {
  mode: "create" | "edit";
  platform?: Platform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformFormDialog({
  mode,
  platform,
  open,
  onOpenChange,
}: PlatformFormDialogProps) {
  const t = useTranslations("platforms");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const createMutation = useCreatePlatform();
  const updateMutation = useUpdatePlatform();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  // Reset form when dialog opens / platform changes
  useEffect(() => {
    if (open) {
      reset({ name: mode === "edit" && platform ? platform.name : "" });
    }
  }, [open, mode, platform, reset]);

  const onSubmit = async (values: FormValues) => {
    if (mode === "edit" && platform) {
      await updateMutation.mutateAsync({ id: platform.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onOpenChange(false);
  };

  const getErrorMessage = (key?: string) => {
    if (!key) return undefined;
    const parts = key.split(".");
    if (parts.length === 2 && parts[0] === "validation") {
      return tv(parts[1] as "nameRequired" | "required");
    }
    return key;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addTitle") : t("editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("addDescription")
              : t("editDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">{tc("name")}</Label>
            <Input
              id="platform-name"
              placeholder={t("namePlaceholder")}
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{getErrorMessage(errors.name.message)}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? tc("saving")
                : mode === "create"
                  ? tc("create")
                  : tc("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
