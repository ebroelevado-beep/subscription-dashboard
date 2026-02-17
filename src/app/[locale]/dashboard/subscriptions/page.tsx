"use client";

import { useState } from "react";
import { usePlans } from "@/hooks/use-plans";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export default function SubscriptionsPage() {
  const [planFilter, setPlanFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: plans } = usePlans();
  const { data: subscriptions, isLoading } = useSubscriptions(
    planFilter || undefined
  );
  const t = useTranslations("subscriptions");
  const tc = useTranslations("common");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("newSubscription")}
        </Button>
      </div>

      {/* Search + Plan filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={tc("searchSubscriptions")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {tc("filterByPlan")}
          </label>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={tc("allPlans")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc("allPlans")}</SelectItem>
              {plans?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SubscriptionsTable
        subscriptions={(subscriptions ?? []).filter((s) =>
          search.trim() === ""
            ? true
            : s.label.toLowerCase().includes(search.trim().toLowerCase())
        )}
        isLoading={isLoading}
      />

      <SubscriptionFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
