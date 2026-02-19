"use client";

import { useState } from "react";
import type { Client } from "@/hooks/use-clients";
import { ClientFormDialog } from "./client-form-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";
import { ClientDetailSheet } from "./client-detail-sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { differenceInDays, startOfDay } from "date-fns";
import { useTranslations } from "next-intl";

type ClientStatus = "paid" | "due" | "expired" | "none";

function getClientStatus(client: Client): ClientStatus {
  const activeSeats = client.clientSubscriptions.filter((cs) => cs.status === "active");
  if (activeSeats.length === 0) return "none";

  const today = startOfDay(new Date());
  let hasExpired = false;
  let hasDue = false;

  for (const seat of activeSeats) {
    const diff = differenceInDays(startOfDay(new Date(seat.activeUntil)), today);
    if (diff < 0) hasExpired = true;
    else if (diff <= 3) hasDue = true;
  }

  if (hasExpired) return "expired";
  if (hasDue) return "due";
  return "paid";
}

const statusConfig = (t: any) => ({
  paid: { label: t("status.paid"), variant: "default" as const },
  due: { label: t("status.due"), variant: "secondary" as const },
  expired: { label: t("status.expired"), variant: "destructive" as const },
  none: { label: t("status.none"), variant: "outline" as const },
});

function getServicesSummary(client: Client): string {
  const active = client.clientSubscriptions.filter((cs) => cs.status === "active" || cs.status === "paused");
  if (active.length === 0) return "—";
  const names = [...new Set(active.map((cs) => cs.subscription.plan.platform.name))];
  return names.join(", ");
}

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
}

export function ClientsTable({ clients, isLoading }: ClientsTableProps) {
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [sheetClientId, setSheetClientId] = useState<string | null>(null);
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const config = statusConfig(t);

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{tc("platform")}</TableHead>
              <TableHead className="text-center">{t("activeSeats")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto rounded-full" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed">
        <EmptyState
          icon={Users}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{tc("platform")}</TableHead>
              <TableHead className="text-center">{t("activeSeats")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => {
              const activeSeats = c.clientSubscriptions.filter(
                (cs) => cs.status === "active"
              ).length;
              const status = getClientStatus(c);
              const sc = config[status];
              const services = getServicesSummary(c);

              return (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => setSheetClientId(c.id)}
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {services}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={activeSeats > 0 ? "default" : "secondary"}>
                      {activeSeats}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={sc.variant}>
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => { e.stopPropagation(); setEditClient(c); }}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">{tc("edit")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteClient(c); }}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">{tc("delete")}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ClientFormDialog
        mode="edit"
        client={editClient ?? undefined}
        open={!!editClient}
        onOpenChange={(open: boolean) => {
          if (!open) setEditClient(null);
        }}
      />

      <DeleteClientDialog
        client={deleteClient}
        open={!!deleteClient}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteClient(null);
        }}
      />

      <ClientDetailSheet
        clientId={sheetClientId}
        open={!!sheetClientId}
        onOpenChange={(open) => {
          if (!open) setSheetClientId(null);
        }}
      />
    </>
  );
}
