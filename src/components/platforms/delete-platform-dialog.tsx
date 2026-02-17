"use client";

import { useDeletePlatform, type Platform } from "@/hooks/use-platforms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";

interface DeletePlatformDialogProps {
  platform: Platform | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePlatformDialog({
  platform,
  open,
  onOpenChange,
}: DeletePlatformDialogProps) {
  const t = useTranslations("platforms");
  const tc = useTranslations("common");
  const deleteMutation = useDeletePlatform();

  const handleDelete = async () => {
    if (!platform) return;
    await deleteMutation.mutateAsync(platform.id);
    onOpenChange(false);
  };

  const activePlans = platform?.plans.filter((p) => p.isActive).length ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle", { name: platform?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
            {activePlans > 0 && (
              <>
                <br />
                <br />
                <strong className="text-destructive">
                  {t("deleteActivePlans", { count: activePlans })}
                </strong>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? tc("deleting") : tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
