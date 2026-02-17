import { PageHeaderSkeleton, SearchBarSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function SubscriptionsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBarSkeleton />
        <FilterBarSkeleton items={1} />
      </div>
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
