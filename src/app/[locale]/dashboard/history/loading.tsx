import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filter bar */}
      <div className="rounded-xl border bg-card p-4">
        <FilterBarSkeleton items={5} />
      </div>

      {/* Table */}
      <TableSkeleton rows={8} cols={7} />

      {/* Pagination */}
      <div className="flex justify-between px-1">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
