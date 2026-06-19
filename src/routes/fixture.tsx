import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { matchesQuery, teamsQuery } from "@/lib/queries";
import { TeamLogo } from "@/components/team-logo";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportFixturePDF } from "@/lib/pdf";

export const Route = createFileRoute("/fixture")({
  head: () => ({
    meta: [
      { title: "Fixture · Juego CDIA Segunda Edición" },
      { name: "description", content: "Calendario completo de partidos del torneo." },
    ],
  }),
  component: FixturePage,
});

const PHASE_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  semifinal: "Semifinales",
  third_place: "Tercer lugar",
  final: "Final",
};

function FixturePage() {
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const byId = new Map(teams.map((t) => [t.id, t]));

  const grouped = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    const key =
      m.phase === "group"
        ? `Grupo ${m.group_name ?? ""}`
        : PHASE_LABEL[m.phase];
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Fixture</h1>
          <p className="text-muted-foreground">Todos los partidos del torneo</p>
        </div>
        <Button variant="hero" onClick={() => exportFixturePDF(matches, teams)} disabled={matches.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </header>

      {matches.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Aún no se genera el fixture.
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([title, list]) => (
          <section key={title}>
            <h2 className="mb-3 font-display text-xl font-semibold text-secondary">{title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => {
                const home = byId.get(m.home_team_id ?? "");
                const away = byId.get(m.away_team_id ?? "");
                return (
                  <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.match_date ?? "Fecha por definir"}</span>
                      <span>{m.match_time ?? ""}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <TeamLogo name={home?.name} url={home?.logo_url} color={home?.shirt_color} size={28} />
                        <span className="truncate font-medium">{home?.name ?? "Por definir"}</span>
                      </div>
                      <div className="text-center font-display text-lg font-bold text-primary">
                        {m.played ? `${m.home_score} - ${m.away_score}` : "vs"}
                      </div>
                      <div className="flex min-w-0 items-center justify-end gap-2">
                        <span className="truncate text-right font-medium">{away?.name ?? "Por definir"}</span>
                        <TeamLogo name={away?.name} url={away?.logo_url} color={away?.shirt_color} size={28} />
                      </div>
                    </div>
                    {m.notes && <p className="mt-2 text-xs text-muted-foreground">{m.notes}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}