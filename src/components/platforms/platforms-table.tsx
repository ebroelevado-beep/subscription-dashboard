"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Platform } from "@/hooks/use-platforms";
import { PlatformFormDialog } from "./platform-form-dialog";
import { DeletePlatformDialog } from "./delete-platform-dialog";
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
import { Pencil, Trash2, Layers } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslations } from "next-intl";

interface PlatformsTableProps {
  platforms: Platform[];
  isLoading: boolean;
}

export function PlatformsTable({ platforms, isLoading }: PlatformsTableProps) {
  const [editPlatform, setEditPlatform] = useState<Platform | null>(null);
  const [deletePlatform, setDeletePlatform] = useState<Platform | null>(null);
  const t = useTranslations("platforms");
  const tc = useTranslations("common");

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead className="text-center">{t("plans")}</TableHead>
              <TableHead>{tc("created")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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

  if (platforms.length === 0) {
    return (
      <div className="rounded-lg border border-dashed">
        <EmptyState
          icon={Layers}
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
              <TableHead className="text-center">{t("plans")}</TableHead>
              <TableHead>{tc("created")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platforms.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{p.plans.length}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(p.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditPlatform(p)}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">{tc("edit")}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletePlatform(p)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">{tc("delete")}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <PlatformFormDialog
        mode="edit"
        platform={editPlatform ?? undefined}
        open={!!editPlatform}
        onOpenChange={(open) => {
          if (!open) setEditPlatform(null);
        }}
      />

      {/* Delete dialog */}
      <DeletePlatformDialog
        platform={deletePlatform}
        open={!!deletePlatform}
        onOpenChange={(open) => {
          if (!open) setDeletePlatform(null);
        }}
      />
    </>
  );
}
