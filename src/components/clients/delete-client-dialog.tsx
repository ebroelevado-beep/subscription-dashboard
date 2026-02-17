"use client";

import { useDeleteClient, type Client } from "@/hooks/use-clients";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ client, open, onOpenChange }: DeleteClientDialogProps) {
  const deleteMutation = useDeleteClient();

  const handleDelete = async () => {
    if (!client) return;
    await deleteMutation.mutateAsync(client.id);
    onOpenChange(false);
  };

  const activeSeats = client?.clientSubscriptions.filter((cs) => cs.status === "active").length ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{client?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
            {activeSeats > 0 && (
              <> This client has <strong>{activeSeats} active seat{activeSeats > 1 ? "s" : ""}</strong> that will also be removed.</>
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
