import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, CalendarDays, CheckCircle2, Clock, Award } from "lucide-react";
import { teamsQuery, matchesQuery } from "@/lib/queries";
import { computeStandings, getQualifiers } from "@/lib/tournament";
import { TeamLogo } from "@/components/team-logo";
import { StandingsTable } from "@/components/standings-table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Juego CDIA Segunda Edición · Torneo de fútbol" },
      { name: "description", content: "Sigue el torneo Juego CDIA Segunda Edición en vivo: posiciones, fixture, llave final, goleadores y resultados." },
      { property: "og:title", content: "Juego CDIA Segunda Edición" },
      { property: "og:description", content: "Torneo de fútbol con 8 equipos en dos grupos, semifinales y final." },
    ],
  }),
  component: HomePage,
});

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}

function HomePage() {
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];

  const total = matches.length;
  const played = matches.filter((m) => m.played).length;
  const pending = total - played;
  const q = getQualifiers(teams, matches);

  const upcoming = matches
    .filter((m) => !m.played)
    .slice(0, 5);

  return (
    <div>
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-white">
        <div className="absolute inset-0 opacity-25 [background:radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">Torneo oficial</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-6xl">
            Juego CDIA<br />
            <span className="text-accent">Segunda Edición</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/85">
            8 equipos. 2 grupos. Una sola copa. Sigue cada partido, resultado y la llave final en tiempo real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/fixture" className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-semibold text-secondary shadow-[var(--shadow-elegant)] hover:brightness-110">
              Ver fixture
            </Link>
            <Link to="/tabla" className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 font-semibold text-white hover:bg-white/20">
              Tabla de posiciones
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="font-display text-2xl font-bold text-primary">Resumen del torneo</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat icon={Users} label="Equipos" value={teams.length} />
          <Stat icon={CalendarDays} label="Partidos" value={total} />
          <Stat icon={CheckCircle2} label="Jugados" value={played} />
          <Stat icon={Clock} label="Pendientes" value={pending} />
          <Stat icon={Award} label="Clasificados" value={[q.A1, q.A2, q.B1, q.B2].filter(Boolean).length} />
          <Stat icon={Trophy} label="Grupos" value={2} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <StandingsTable title="Grupo A" rows={computeStandings(teams, matches, "A")} />
          <StandingsTable title="Grupo B" rows={computeStandings(teams, matches, "B")} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-primary">Próximos encuentros</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.length === 0 && (
            <p className="text-muted-foreground">No hay partidos programados aún.</p>
          )}
          {upcoming.map((m) => {
            const home = teams.find((t) => t.id === m.home_team_id);
            const away = teams.find((t) => t.id === m.away_team_id);
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {m.phase === "group" ? `Grupo ${m.group_name ?? ""}` : m.phase}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamLogo name={home?.name} url={home?.logo_url} color={home?.shirt_color} size={28} />
                    <span className="truncate font-medium">{home?.name ?? "Por definir"}</span>
                  </div>
                  <span className="font-display text-xl text-muted-foreground">vs</span>
                  <div className="flex min-w-0 items-center justify-end gap-2">
                    <span className="truncate font-medium">{away?.name ?? "Por definir"}</span>
                    <TeamLogo name={away?.name} url={away?.logo_url} color={away?.shirt_color} size={28} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {m.match_date ?? "Fecha por definir"} {m.match_time ? `· ${m.match_time}` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
