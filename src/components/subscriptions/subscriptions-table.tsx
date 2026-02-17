"use client";

import { useState } from "react";
import Link from "next/link";
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
  cancelled: "destructive",
};

export function SubscriptionsTable({ subscriptions, isLoading }: SubscriptionsTableProps) {
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subscription | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Platform → Plan</TableHead>
              <TableHead className="text-center">Occupancy</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Active Until</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </TableCell>
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
          title="No subscriptions yet"
          description="Create your first subscription from an existing plan."
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
              <TableHead>Label</TableHead>
              <TableHead>Platform → Plan</TableHead>
              <TableHead className="text-center">Occupancy</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Active Until</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => {
              const occupied = sub.clientSubscriptions.length;
              const max = sub.plan.maxSeats;
              const isFull = max !== null && occupied >= max;

              return (
                <TableRow key={sub.id}>
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
                          {isFull ? "Subscription is full" : `${occupied} of ${max ?? "unlimited"} seats occupied`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant[sub.status] ?? "secondary"}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.activeUntil)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const revenue = sub.clientSubscriptions.reduce(
                        (sum, s) => sum + Number(s.customPrice),
                        0
                      );
                      const cost = Number(sub.plan.cost);
                      const profit = revenue - cost;
                      return (
                        <div className="text-right">
                          <span className="font-mono text-sm">
                            {new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            }).format(revenue)}
                          </span>
                          <br />
                          <span
                            className={`text-xs ${
                              profit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {profit >= 0 ? "+" : ""}
                            {new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            }).format(profit)}
                          </span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <Link href={`/dashboard/subscriptions/${sub.id}`}>
                          <Eye className="size-3.5" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditSub(sub)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteSub(sub)}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
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
