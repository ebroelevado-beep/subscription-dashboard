"use client";

import { useUpdateSeat } from "@/hooks/use-seats";
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
  const updateSeat = useUpdateSeat();

  const handleRemove = async () => {
    if (!seatId) return;
    await updateSeat.mutateAsync({ id: seatId, status: "cancelled" });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this seat?</AlertDialogTitle>
          <AlertDialogDescription>
            The client will be marked as cancelled on this subscription.
            This action can be reversed later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={updateSeat.isPending}
          >
            {updateSeat.isPending ? "Removing…" : "Remove Seat"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
