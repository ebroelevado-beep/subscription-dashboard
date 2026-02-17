"use client";

import { useState } from "react";
import { usePlatforms } from "@/hooks/use-platforms";
import { PlatformsTable } from "@/components/platforms/platforms-table";
import { PlatformFormDialog } from "@/components/platforms/platform-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PlatformsPage() {
  const { data: platforms, isLoading } = usePlatforms();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Platforms
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the services you subscribe to.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add Platform
        </Button>
      </div>

      {/* Table */}
      <PlatformsTable platforms={platforms ?? []} isLoading={isLoading} />

      {/* Create dialog */}
      <PlatformFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
