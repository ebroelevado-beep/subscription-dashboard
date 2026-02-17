import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* ── Page Header ── */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  );
}

/* ── Stat Card ── */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="size-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

/* ── Table ── */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Head */}
      <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 max-w-[140px]" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b last:border-0 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 max-w-[160px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Filter Bar ── */
export function FilterBarSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-36 rounded-md" />
      ))}
    </div>
  );
}

/* ── Search Bar ── */
export function SearchBarSkeleton() {
  return <Skeleton className="h-9 w-full max-w-sm rounded-md" />;
}

/* ── Chart placeholder ── */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
