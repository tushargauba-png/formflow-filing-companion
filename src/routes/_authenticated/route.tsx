import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, FileText, Building2, Users, FileSpreadsheet, LogOut, FilePlus2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    // Signed in is not enough: the email must be on the allowed_users list (enforced again by RLS).
    const { data: allowed, error } = await supabase.rpc("is_allowed_user");
    if (error || !allowed) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { denied: true } });
    }
    return { user: data.user };
  },
  component: Shell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forms", label: "Form 146 register", icon: FileText },
  { to: "/remitters", label: "Remitters (clients)", icon: Building2 },
  { to: "/remittees", label: "Remittees (payees)", icon: Users },
  { to: "/reports", label: "Reports & billing", icon: FileSpreadsheet },
] as const;

function Shell() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-sidebar-primary">Operations</div>
          <div className="mt-1 font-display text-2xl">Form 146 Desk</div>
        </div>
        <Link to="/forms/$id" params={{ id: "new" }}
          className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-md bg-sidebar-primary px-3 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90">
          <FilePlus2 className="h-4 w-4" /> New Form 146
        </Link>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/35">
            <FileText className="h-4 w-4" /> Form 145 <span className="ml-auto font-mono text-[10px]">SOON</span>
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs">
          <div className="truncate text-sidebar-foreground/60">{user.email}</div>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-primary">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
