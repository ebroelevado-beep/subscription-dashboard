"use client";

import { useDeleteSubscription, type Subscription } from "@/hooks/use-subscriptions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteSubscriptionDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSubscriptionDialog({ subscription, open, onOpenChange }: DeleteSubscriptionDialogProps) {
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
          <AlertDialogTitle>Delete &quot;{subscription?.label}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
            {seatCount > 0 && (
              <> This subscription has <strong>{seatCount} active seat{seatCount > 1 ? "s" : ""}</strong> that will also be removed.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
