"use client";

import { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { usePlatforms } from "@/hooks/use-platforms";
import { PlansTable } from "@/components/plans/plans-table";
import { PlanFormDialog } from "@/components/plans/plan-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function PlansPage() {
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: platforms } = usePlatforms();
  const { data: plans, isLoading } = usePlans(platformFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage plan templates linked to your platforms.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add Plan
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Filter by platform:
        </span>
        <Select
          value={platformFilter ?? "all"}
          onValueChange={(v) =>
            setPlatformFilter(v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <PlansTable plans={plans ?? []} isLoading={isLoading} />

      {/* Create dialog */}
      <PlanFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
