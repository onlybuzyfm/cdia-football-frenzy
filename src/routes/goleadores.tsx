import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { goalsQuery, playersQuery, teamsQuery } from "@/lib/queries";
import { TeamLogo } from "@/components/team-logo";

export const Route = createFileRoute("/goleadores")({
  head: () => ({
    meta: [
      { title: "Goleadores · Juego CDIA" },
      { name: "description", content: "Tabla de goleadores del torneo Juego CDIA Segunda Edición." },
    ],
  }),
  component: GoleadoresPage,
});

function GoleadoresPage() {
  const goals = useQuery(goalsQuery).data ?? [];
  const players = useQuery(playersQuery).data ?? [];
  const teams = useQuery(teamsQuery).data ?? [];

  const totals = new Map<string, number>();
  for (const g of goals) totals.set(g.player_id, (totals.get(g.player_id) ?? 0) + g.count);

  const rows = [...totals.entries()]
    .map(([pid, total]) => {
      const p = players.find((x) => x.id === pid);
      const t = teams.find((tt) => tt.id === p?.team_id);
      return { player: p, team: t, total };
    })
    .filter((r) => r.player)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Tabla de goleadores</h1>
      <p className="mb-6 text-muted-foreground">Estadísticas acumuladas del torneo.</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Jugador</th>
              <th className="px-3 py-2 text-left">Equipo</th>
              <th className="px-3 py-2 text-center">Goles</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Sin goles registrados.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.player!.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{i + 1}</td>
                <td className="px-3 py-2">{r.player!.full_name}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TeamLogo name={r.team?.name} url={r.team?.logo_url} color={r.team?.shirt_color} size={22} />
                    <span>{r.team?.name ?? "-"}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center font-display text-lg font-bold text-accent">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}