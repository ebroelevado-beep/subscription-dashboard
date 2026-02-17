"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Repeat,
  Menu,
  LogOut,
  Moon,
  Sun,
  ScrollText,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/command-palette";
import { useEffect, useState, useCallback } from "react";
import { usePrefetch } from "@/hooks/use-prefetch";

// ── Sidebar dimensions ──
const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 68;

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Platforms", href: "/dashboard/platforms", icon: Layers },
  { label: "Plans", href: "/dashboard/plans", icon: CreditCard },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: Repeat },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "History", href: "/dashboard/history", icon: ScrollText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// ── Cookie helpers ──
const COOKIE_KEY = "sidebar-collapsed";

function readCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_KEY}=1`);
}

function writeCookie(collapsed: boolean) {
  document.cookie = `${COOKIE_KEY}=${collapsed ? "1" : "0"}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

// ── Nav Links (desktop) ──
function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const prefetch = usePrefetch();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            onMouseEnter={() => prefetch(item.href)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/15"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
            )}
            <item.icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive && "text-primary"
              )}
            />
            <span
              className={cn(
                "transition-opacity duration-200 whitespace-nowrap",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              {item.label}
            </span>
          </Link>
        );

        // Wrap in tooltip when collapsed
        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }

        return link;
      })}
    </nav>
  );
}

// ── Mobile Nav Links (no collapse / tooltip needed) ──
function MobileNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/15"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
            )}
            <item.icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive && "text-primary"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── User Menu ──
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? "U";

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 px-3 py-2.5 h-auto",
            collapsed && "justify-center px-2"
          )}
        >
          <Avatar className="size-8 shrink-0">
            {user?.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "flex flex-col items-start text-left overflow-hidden transition-opacity duration-200",
              collapsed ? "opacity-0 w-0" : "opacity-100"
            )}
          >
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align="start"
        className="w-56"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // When collapsed, wrap the entire dropdown in a tooltip
  // (tooltip on hover, dropdown on click — no nesting conflicts)
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{menu}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {user?.name || "User"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return menu;
}

// Full-feature mobile user menu (always expanded look)
function MobileUserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 h-auto">
          <Avatar className="size-8">
            {user?.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left overflow-hidden">
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Theme Toggle ──
function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return stored === "dark" || (!stored && prefersDark);
  });

  // Keep the DOM class in sync on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="size-8"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

// ── Shell ──
export function DashboardShell({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sync cookie on mount (client may override SSR hint)
  useEffect(() => {
    const cookie = readCookie();
    if (cookie !== collapsed) setCollapsed(cookie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCookie(next);
      return next;
    });
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
          minWidth: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
        }}
        className="hidden lg:flex lg:flex-col border-r bg-sidebar/80 backdrop-blur-xl backdrop-saturate-150 transition-[width,min-width] duration-200 ease-in-out"
      >
        {/* Logo — h-14 matches the topbar height so borders align */}
        <div
          className={cn(
            "flex h-14 items-center gap-2.5 px-5",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm shadow-sm shadow-primary/20 shrink-0">
            SL
          </div>
          <span
            className={cn(
              "text-lg font-semibold tracking-tight text-foreground transition-opacity duration-200 whitespace-nowrap",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            SubLedger
          </span>
        </div>

        <Separator />

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks collapsed={collapsed} />
        </div>

        <Separator />

        {/* Footer — toggle (left) + user menu (right) */}
        <div
          className={cn(
            "flex items-center gap-1 p-3",
            collapsed && "flex-col"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={toggleCollapse}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>

          <div className={cn("flex-1 min-w-0", collapsed && "w-full")}>
            <UserMenu collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center gap-3 border-b bg-background/70 backdrop-blur-xl backdrop-saturate-150 px-4 lg:px-6">
          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden size-8"
              >
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 pt-10">
              <div className="flex items-center gap-2.5 px-5 pb-4">
                <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm shadow-sm shadow-primary/20">
                  SL
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  SubLedger
                </span>
              </div>
              <Separator />
              <div className="px-3 py-4">
                <MobileNavLinks onNavigate={() => setSheetOpen(false)} />
              </div>
              <Separator />
              <div className="p-3">
                <MobileUserMenu />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <CommandPalette />
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
