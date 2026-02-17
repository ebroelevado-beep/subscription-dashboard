"use client";

import { useDeleteSubscription, type Subscription } from "@/hooks/use-subscriptions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";

interface DeleteSubscriptionDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSubscriptionDialog({ subscription, open, onOpenChange }: DeleteSubscriptionDialogProps) {
  const t = useTranslations("subscriptions");
  const tc = useTranslations("common");
  const deleteMutation = useDeleteSubscription();

  const handleDelete = async () => {
    if (!subscription) return;
    await deleteMutation.mutateAsync(subscription.id);
    onOpenChange(false);
  };

  const seatCount = subscription?.clientSubscriptions.length ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle", { name: subscription?.label ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
            {seatCount > 0 && (
              <> {t("deleteActiveSeats", { count: seatCount })}</>
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
