import { PageHeaderSkeleton, SearchBarSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
