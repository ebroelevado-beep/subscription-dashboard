"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateClient, useUpdateClient, type Client } from "@/hooks/use-clients";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  phone: z.string().max(30).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  serviceUser: z.string().max(100).optional().or(z.literal("")),
  servicePassword: z.string().max(100).optional().or(z.literal("")),
});

type FormValues = {
  name: string;
  phone?: string;
  notes?: string;
  serviceUser?: string;
  servicePassword?: string;
};

interface ClientFormDialogProps {
  mode: "create" | "edit";
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientFormDialog({ mode, client, open, onOpenChange }: ClientFormDialogProps) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { name: "", phone: "", notes: "", serviceUser: "", servicePassword: "" },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && client) {
        reset({
          name: client.name,
          phone: client.phone ?? "",
          notes: client.notes ?? "",
          serviceUser: client.serviceUser ?? "",
          servicePassword: client.servicePassword ?? "",
        });
      } else {
        reset({ name: "", phone: "", notes: "", serviceUser: "", servicePassword: "" });
      }
    }
  }, [open, mode, client, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      phone: values.phone || null,
      notes: values.notes || null,
      serviceUser: values.serviceUser || null,
      servicePassword: values.servicePassword || null,
    };
    if (mode === "edit" && client) {
      await updateMutation.mutateAsync({ id: client.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Client" : "Edit Client"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new client to your roster." : "Update this client's info."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" placeholder="John Doe" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">Phone</Label>
            <Input id="client-phone" placeholder="+34 600 000 000" {...register("phone")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="client-service-user">Service User</Label>
              <Input id="client-service-user" placeholder="user@email.com" {...register("serviceUser")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-service-pass">Service Password</Label>
              <Input id="client-service-pass" type="password" placeholder="••••••" {...register("servicePassword")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">Notes</Label>
            <textarea
              id="client-notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional notes…"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

