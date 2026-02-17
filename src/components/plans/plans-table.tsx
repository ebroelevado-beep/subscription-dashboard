"use client";

import { useState } from "react";
import type { Plan } from "@/hooks/use-plans";
import { PlanFormDialog } from "./plan-form-dialog";
import { DeletePlanDialog } from "./delete-plan-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface PlansTableProps {
  plans: Plan[];
  isLoading: boolean;
}

export function PlansTable({ plans, isLoading }: PlansTableProps) {
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">My Cost</TableHead>
              <TableHead className="text-center">Max Seats</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
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

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed">
        <EmptyState
          icon={CreditCard}
          title="No plans yet"
          description="Create a plan to define pricing and seat limits for a platform."
        />
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(val);

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">My Cost</TableHead>
              <TableHead className="text-center">Max Seats</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {plan.platform.name}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatCurrency(Number(plan.cost))}
                </TableCell>
                <TableCell className="text-center">
                  {plan.maxSeats ?? "∞"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditPlan(plan)}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletePlan(plan)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <PlanFormDialog
        mode="edit"
        plan={editPlan ?? undefined}
        open={!!editPlan}
        onOpenChange={(open) => {
          if (!open) setEditPlan(null);
        }}
      />

      {/* Delete dialog */}
      <DeletePlanDialog
        plan={deletePlan}
        open={!!deletePlan}
        onOpenChange={(open) => {
          if (!open) setDeletePlan(null);
        }}
      />
    </>
  );
}
