import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { teamsQuery, playersQuery } from "@/lib/queries";
import { TeamLogo } from "@/components/team-logo";

export const Route = createFileRoute("/equipos")({
  head: () => ({
    meta: [
      { title: "Equipos · Juego CDIA Segunda Edición" },
      { name: "description", content: "Equipos participantes del torneo Juego CDIA Segunda Edición y sus planteles." },
    ],
  }),
  component: EquiposPage,
});

function EquiposPage() {
  const teams = useQuery(teamsQuery).data ?? [];
  const players = useQuery(playersQuery).data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-primary">Equipos participantes</h1>
        <p className="text-muted-foreground">{teams.length} de 8 equipos inscritos.</p>
      </header>

      {teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Aún no se registran equipos. <Link to="/auth" className="text-primary underline">Acceso administrador</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => {
            const roster = players.filter((p) => p.team_id === t.id);
            return (
              <article key={t.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3 border-b border-border bg-[image:var(--gradient-hero)] p-4 text-white">
                  <TeamLogo name={t.name} url={t.logo_url} color={t.shirt_color} size={48} />
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold leading-tight">{t.name}</h2>
                    <p className="text-xs text-white/80">Grupo {t.group_name ?? "-"} · {roster.length} jugadores</p>
                  </div>
                </div>
                <div className="space-y-1 p-4 text-sm">
                  {t.captain && <p><span className="text-muted-foreground">Capitán:</span> {t.captain}</p>}
                  {t.phone && <p><span className="text-muted-foreground">Teléfono:</span> {t.phone}</p>}
                  {t.email && <p className="truncate"><span className="text-muted-foreground">Email:</span> {t.email}</p>}
                </div>
                {roster.length > 0 && (
                  <div className="border-t border-border bg-muted/40 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plantel</p>
                    <ul className="space-y-1 text-sm">
                      {roster.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            <span className="mr-2 inline-block w-6 text-center font-display font-bold text-accent">
                              {p.jersey_number ?? "·"}
                            </span>
                            {p.full_name}
                          </span>
                          {p.position && <span className="text-xs text-muted-foreground">{p.position}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}