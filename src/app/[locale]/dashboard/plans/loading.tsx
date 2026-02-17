import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function PlansLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton items={2} />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
