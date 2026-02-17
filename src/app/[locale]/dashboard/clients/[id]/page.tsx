"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useClient } from "@/hooks/use-clients";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle } from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  paused: "secondary",
  cancelled: "destructive",
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold">Client not found</h2>
        <Button variant="link" asChild>
          <Link href="/dashboard/clients">← Back to clients</Link>
        </Button>
      </div>
    );
  }

  const activeSeats = client.clientSubscriptions.filter((s) => s.status === "active");
  const totalMonthly = activeSeats.reduce((sum, s) => sum + Number(s.customPrice), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center size-10 rounded-full bg-muted">
            <UserCircle className="size-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground text-sm">
              {client.phone ?? "No phone"} · {client.notes ?? "No notes"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Active Seats</p>
          <p className="text-2xl font-bold">{activeSeats.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Monthly Cost</p>
          <p className="text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
        </div>
      </div>

      {/* Seats Table */}
      {client.clientSubscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <h3 className="text-lg font-semibold">No services</h3>
          <p className="text-muted-foreground text-sm mt-1">
            This client hasn&apos;t been assigned to any subscriptions yet.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead className="text-right">Custom Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.clientSubscriptions.map((cs) => (
                <TableRow key={cs.id}>
                  <TableCell className="font-medium">
                    {cs.subscription.plan.platform.name}
                  </TableCell>
                  <TableCell>{cs.subscription.plan.name}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/subscriptions/${cs.subscription.id}`}
                      className="text-primary hover:underline"
                    >
                      {cs.subscription.label}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(Number(cs.customPrice))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant[cs.status] ?? "secondary"}>
                      {cs.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(cs.joinedAt).toLocaleDateString("es-ES")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
