import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultCollapsed =
    cookieStore.get("sidebar-collapsed")?.value === "1";

  return (
    <DashboardShell defaultCollapsed={defaultCollapsed}>
      {children}
    </DashboardShell>
  );
}
