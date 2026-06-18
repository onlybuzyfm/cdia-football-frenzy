import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { matchesQuery, teamsQuery, playersQuery } from "@/lib/queries";
import { getQualifiers } from "@/lib/tournament";
import { Users, CalendarDays, CheckCircle2, Clock, Trophy, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function Tile({ icon: Icon, label, value, to }: { icon: any; label: string; value: number | string; to?: string }) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:border-primary">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-primary">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function AdminDashboard() {
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const players = useQuery(playersQuery).data ?? [];
  const played = matches.filter((m) => m.played).length;
  const q = getQualifiers(teams, matches);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Panel de control</h1>
        <p className="text-muted-foreground">Juego CDIA · Segunda Edición</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Tile icon={Users} label="Equipos" value={`${teams.length} / 8`} to="/admin/equipos" />
        <Tile icon={Users} label="Jugadores" value={players.length} to="/admin/equipos" />
        <Tile icon={CalendarDays} label="Partidos" value={matches.length} to="/admin/partidos" />
        <Tile icon={CheckCircle2} label="Jugados" value={played} />
        <Tile icon={Clock} label="Pendientes" value={matches.length - played} />
        <Tile icon={Award} label="Clasificados" value={[q.A1, q.A2, q.B1, q.B2].filter(Boolean).length} to="/admin/llave" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-semibold text-primary">Pasos sugeridos</h2>
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Registra los 8 equipos y asígnalos al Grupo A o B.</li>
          <li>Genera el fixture de la fase de grupos automáticamente.</li>
          <li>Carga los resultados — la tabla y la llave se actualizan solas.</li>
          <li>Activa semifinales y final cuando se cumplan los cruces.</li>
          <li>Selecciona al MVP del torneo desde la sección Llave final.</li>
        </ol>
      </div>
    </div>
  );
}