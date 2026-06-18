import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { matchesQuery, teamsQuery } from "@/lib/queries";
import { computeStandings } from "@/lib/tournament";
import { StandingsTable } from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportStandingsPDF } from "@/lib/pdf";

export const Route = createFileRoute("/tabla")({
  head: () => ({
    meta: [
      { title: "Tabla de posiciones · Juego CDIA" },
      { name: "description", content: "Tabla de posiciones actualizada del torneo Juego CDIA Segunda Edición." },
    ],
  }),
  component: TablaPage,
});

function TablaPage() {
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const a = computeStandings(teams, matches, "A");
  const b = computeStandings(teams, matches, "B");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Tabla de posiciones</h1>
          <p className="text-muted-foreground">Actualizada automáticamente con cada resultado.</p>
        </div>
        <Button variant="hero" onClick={() => exportStandingsPDF([{ title: "Grupo A", rows: a }, { title: "Grupo B", rows: b }])}>
          <Download className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <StandingsTable title="Grupo A" rows={a} />
        <StandingsTable title="Grupo B" rows={b} />
      </div>
    </div>
  );
}