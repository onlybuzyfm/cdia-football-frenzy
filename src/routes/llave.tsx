import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { matchesQuery, teamsQuery, awardsQuery, playersQuery } from "@/lib/queries";
import { Bracket } from "@/components/bracket";
import { getQualifiers } from "@/lib/tournament";
import { Star } from "lucide-react";

export const Route = createFileRoute("/llave")({
  head: () => ({
    meta: [
      { title: "Llave final · Juego CDIA" },
      { name: "description", content: "Llave visual de semifinales, tercer lugar y final del torneo." },
    ],
  }),
  component: LlavePage,
});

function LlavePage() {
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const players = useQuery(playersQuery).data ?? [];
  const awards = useQuery(awardsQuery).data;
  const q = getQualifiers(teams, matches);

  const mvp = players.find((p) => p.id === awards?.mvp_player_id);
  const mvpTeam = teams.find((t) => t.id === mvp?.team_id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-primary">Llave final</h1>
        <p className="text-muted-foreground">Cruces: 1°A vs 2°B y 1°B vs 2°A.</p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          { l: "1° Grupo A", t: q.A1 },
          { l: "2° Grupo B", t: q.B2 },
          { l: "1° Grupo B", t: q.B1 },
          { l: "2° Grupo A", t: q.A2 },
        ].map((c) => (
          <div key={c.l} className="rounded-lg border border-border bg-card p-3 text-center shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.l}</p>
            <p className="mt-1 font-display text-lg">{c.t?.name ?? "Por definir"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <Bracket teams={teams} matches={matches} />
      </div>

      {mvp && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-accent/40 bg-[image:var(--gradient-accent)] p-5 text-white shadow-[var(--shadow-elegant)]">
          <Star className="h-10 w-10" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">MVP del torneo</p>
            <p className="font-display text-2xl font-bold">{mvp.full_name}</p>
            {mvpTeam && <p className="text-sm opacity-90">{mvpTeam.name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}