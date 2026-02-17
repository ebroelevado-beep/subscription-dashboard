import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function PlatformsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} cols={3} />
    </div>
  );
}
