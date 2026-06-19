import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Users, Calendar, Trophy } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type Tab = { to: string; icon: any; label: string; exact?: boolean };
const tabs: Tab[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/admin/equipos", icon: Users, label: "Equipos y jugadores" },
  { to: "/admin/partidos", icon: Calendar, label: "Fixture y resultados" },
  { to: "/admin/llave", icon: Trophy, label: "Llave final y MVP" },
];
const scorerTabs: Tab[] = [
  { to: "/admin/partidos", icon: Calendar, label: "Fixture y resultados" },
];

function AdminLayout() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (!isAdmin && pathname !== "/admin/partidos") {
      navigate({ to: "/admin/partidos" });
    }
  }, [isAdmin, pathname, navigate]);
  const visibleTabs = isAdmin ? tabs : scorerTabs;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 overflow-x-auto">
        <nav className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
          {visibleTabs.map((t) => (
            <Link
              key={t.to}
              to={t.to as any}
              activeOptions={{ exact: t.exact }}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}