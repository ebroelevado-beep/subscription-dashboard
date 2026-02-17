"use client";

import { useState, useMemo } from "react";
import { useClients } from "@/hooks/use-clients";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [clients, search]);

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
          {t("addClient")}
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tc("searchByNameOrPhone")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ClientsTable clients={filtered} isLoading={isLoading} />

      {search && filtered.length === 0 && clients && clients.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {tc("noMatchSearch", { query: search })}{" "}
          <button
            className="underline hover:text-foreground"
            onClick={() => setSearch("")}
          >
            {tc("clearSearch")}
          </button>
        </p>
      )}

      <ClientFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
