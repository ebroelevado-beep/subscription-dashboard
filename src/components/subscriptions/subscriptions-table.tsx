"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import type { Subscription } from "@/hooks/use-subscriptions";
import { SubscriptionFormDialog } from "./subscription-form-dialog";
import { DeleteSubscriptionDialog } from "./delete-subscription-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2, Eye, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslations } from "next-intl";

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  isLoading: boolean;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES");
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  paused: "secondary",
};

export function SubscriptionsTable({ subscriptions, isLoading }: SubscriptionsTableProps) {
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subscription | null>(null);
  const t = useTranslations("subscriptions");
  const tc = useTranslations("common");
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("label")}</TableHead>
              <TableHead>{tc("platform")} → {tc("plan")}</TableHead>
              <TableHead className="text-center">{t("seats")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead>{t("nextRenewal")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto rounded-full" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-5 w-14 mx-auto rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="size-8 rounded-md" />
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

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed">
        <EmptyState
          icon={CreditCard}
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
              <TableHead>{t("label")}</TableHead>
              <TableHead>{tc("platform")} → {tc("plan")}</TableHead>
              <TableHead className="text-center">{t("seats")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead>{t("nextRenewal")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => {
              const occupied = sub.clientSubscriptions.length;
              const max = sub.plan.maxSeats;
              const isFull = max !== null && occupied >= max;

              return (
                <TableRow 
                  key={sub.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/subscriptions/${sub.id}`)}
                >
                  <TableCell className="font-medium">{sub.label}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.plan.platform.name} → {sub.plan.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant={isFull ? "destructive" : "secondary"}>
                            {occupied} / {max ?? "∞"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {max != null
                            ? t("availableSeats", { available: max - occupied, total: max })
                            : t("unlimitedSeats")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant[sub.status] ?? "secondary"}>
                      {tc(sub.status as "active" | "paused")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.activeUntil)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <Link href={`/dashboard/subscriptions/${sub.id}`}>
                          <Eye className="size-3.5" />
                          <span className="sr-only">{tc("edit")}</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditSub(sub)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">{tc("edit")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteSub(sub)}
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

      <SubscriptionFormDialog
        mode="edit"
        subscription={editSub ?? undefined}
        open={!!editSub}
        onOpenChange={(open: boolean) => {
          if (!open) setEditSub(null);
        }}
      />

      <DeleteSubscriptionDialog
        subscription={deleteSub}
        open={!!deleteSub}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteSub(null);
        }}
      />
    </>
  );
}
