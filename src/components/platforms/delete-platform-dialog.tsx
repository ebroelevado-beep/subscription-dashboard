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
          <AlertDialogTitle>Delete &quot;{platform?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All plans and subscriptions linked to
            this platform will be permanently deleted.
            {activePlans > 0 && (
              <>
                <br />
                <br />
                <strong className="text-destructive">
                  ⚠ This platform has {activePlans} active plan
                  {activePlans > 1 ? "s" : ""}.
                </strong>
              </>
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
