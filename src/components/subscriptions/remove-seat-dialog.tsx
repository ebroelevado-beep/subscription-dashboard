"use client";

import { useCancelSeat } from "@/hooks/use-seats";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RemoveSeatDialogProps {
  seatId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveSeatDialog({ seatId, open, onOpenChange }: RemoveSeatDialogProps) {
  const cancelSeat = useCancelSeat();

  const handleRemove = async () => {
    if (!seatId) return;
    await cancelSeat.mutateAsync(seatId);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this seat?</AlertDialogTitle>
          <AlertDialogDescription>
            The seat will be permanently removed from this subscription.
            Financial records will be preserved for analytics.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={cancelSeat.isPending}
          >
            {cancelSeat.isPending ? "Removing…" : "Remove Seat"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
