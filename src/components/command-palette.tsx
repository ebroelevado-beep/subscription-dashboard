"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useClients } from "@/hooks/use-clients";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { usePlatforms } from "@/hooks/use-platforms";
import {
  Users,
  Repeat,
  Layers,
  Search,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  ScrollText,
} from "lucide-react";

const staticPages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Platforms", href: "/dashboard/platforms", icon: Layers },
  { label: "Plans", href: "/dashboard/plans", icon: CreditCard },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: Repeat },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "History", href: "/dashboard/history", icon: ScrollText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        <span>Search…</span>
        <kbd className="ml-2 hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Dialog overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Command dialog */}
          <Command
            className="relative z-10 w-full max-w-lg rounded-xl border bg-popover shadow-2xl animate-scale-in"
            loop
          >
            <div className="flex items-center border-b px-4">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Command.Input
                placeholder="Search pages, clients, subscriptions…"
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {/* Pages */}
              <Command.Group heading="Pages" className="px-1 pb-1">
                {staticPages.map((page) => (
                  <Command.Item
                    key={page.href}
                    value={`page ${page.label}`}
                    onSelect={() => navigate(page.href)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  >
                    <page.icon className="size-4 text-muted-foreground shrink-0" />
                    {page.label}
                  </Command.Item>
                ))}
              </Command.Group>

              {/* Clients */}
              {clients && clients.length > 0 && (
                <Command.Group heading="Clients" className="px-1 pb-1">
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
                <Command.Group heading="Subscriptions" className="px-1 pb-1">
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
                <Command.Group heading="Platforms" className="px-1 pb-1">
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
                Navigate with ↑↓ · Select with ↵
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ESC to close
              </button>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
