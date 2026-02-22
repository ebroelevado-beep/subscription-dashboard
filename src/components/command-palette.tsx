"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useClients } from "@/hooks/use-clients";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { usePlatforms } from "@/hooks/use-platforms";
import { useTranslations } from "next-intl";
import {
  Users,
  Repeat,
  Layers,
  Search,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  ScrollText,
  Bot
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const staticPages = [
  { key: "dashboard" as const, href: "/dashboard", icon: LayoutDashboard },
  { key: "platforms" as const, href: "/dashboard/platforms", icon: Layers },
  { key: "plans" as const, href: "/dashboard/plans", icon: CreditCard },
  { key: "subscriptions" as const, href: "/dashboard/subscriptions", icon: Repeat },
  { key: "clients" as const, href: "/dashboard/clients", icon: Users },
  { key: "history" as const, href: "/dashboard/history", icon: ScrollText },
  { key: "analytics" as const, href: "/dashboard/analytics", icon: BarChart3 },
  { key: "assistant" as const, href: "/dashboard/assistant", icon: Bot },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  // Data for search
  const { data: clients } = useClients();
  const { data: subscriptions } = useSubscriptions();
  const { data: platforms } = usePlatforms();

  // ⌘K / Ctrl+K binding
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      {/* Trigger button in topbar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span>{t("searchPlaceholder")}</span>
        <kbd className="ml-2 hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Modal Dialog for Search */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none sm:max-w-xl">
          <DialogTitle className="sr-only">{t("searchPlaceholder")}</DialogTitle>
          <Command
            className="relative w-full rounded-xl border bg-popover shadow-2xl animate-scale-in"
            loop
          >
            <div className="flex items-center border-b px-4">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Command.Input
                placeholder={t("searchPagesClientsSubscriptions")}
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <Command.List className="max-h-96 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                {t("noResultsFound")}
              </Command.Empty>

              {/* Pages */}
              <Command.Group heading={t("pages")} className="px-1 pb-1">
                {staticPages.map((page) => (
                  <Command.Item
                    key={page.href}
                    value={`page ${tn(page.key)}`}
                    onSelect={() => navigate(page.href)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  >
                    <page.icon className="size-4 text-muted-foreground shrink-0" />
                    {tn(page.key)}
                  </Command.Item>
                ))}
              </Command.Group>

              {/* Clients */}
              {clients && clients.length > 0 && (
                <Command.Group heading={t("clients")} className="px-1 pb-1">
                  {clients.slice(0, 8).map((client) => (
                    <Command.Item
                      key={client.id}
                      value={`client ${client.name} ${client.phone ?? ""}`}
                      onSelect={() => navigate(`/dashboard/clients`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <Users className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-col">
                        <span>{client.name}</span>
                        {client.phone && (
                          <span className="text-xs text-muted-foreground">{client.phone}</span>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Subscriptions */}
              {subscriptions && subscriptions.length > 0 && (
                <Command.Group heading={t("subscriptions")} className="px-1 pb-1">
                  {subscriptions.slice(0, 6).map((sub) => (
                    <Command.Item
                      key={sub.id}
                      value={`subscription ${sub.label}`}
                      onSelect={() => navigate(`/dashboard/subscriptions/${sub.id}`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <Repeat className="size-4 text-muted-foreground shrink-0" />
                      {sub.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Platforms */}
              {platforms && platforms.length > 0 && (
                <Command.Group heading={t("platforms")} className="px-1 pb-1">
                  {platforms.slice(0, 6).map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`platform ${p.name}`}
                      onSelect={() => navigate(`/dashboard/platforms`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <Layers className="size-4 text-muted-foreground shrink-0" />
                      {p.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t px-4 py-2">
              <p className="text-xs text-muted-foreground">
                {t("navigateHint")}
              </p>
              <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
                ESC
              </kbd>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
