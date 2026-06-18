import type { StandingRow } from "@/lib/tournament";
import { TeamLogo } from "@/components/team-logo";

export function StandingsTable({ title, rows }: { title: string; rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border bg-[image:var(--gradient-hero)] px-4 py-3 text-white">
        <h3 className="font-display text-lg font-semibold tracking-wide">{title}</h3>
        <span className="text-xs uppercase opacity-80">Clasifican 1° y 2°</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Equipo</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">PG</th>
              <th className="px-2 py-2 text-center">PE</th>
              <th className="px-2 py-2 text-center">PP</th>
              <th className="px-2 py-2 text-center">GF</th>
              <th className="px-2 py-2 text-center">GC</th>
              <th className="px-2 py-2 text-center">DG</th>
              <th className="px-3 py-2 text-center font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">
                  Sin equipos en este grupo.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={r.team.id}
                className={`border-t border-border ${i < 2 ? "bg-accent/10" : ""}`}
              >
                <td className="px-3 py-2 font-semibold">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TeamLogo name={r.team.name} url={r.team.logo_url} color={r.team.shirt_color} size={28} />
                    <span className="font-medium">{r.team.name}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center">{r.pj}</td>
                <td className="px-2 py-2 text-center">{r.pg}</td>
                <td className="px-2 py-2 text-center">{r.pe}</td>
                <td className="px-2 py-2 text-center">{r.pp}</td>
                <td className="px-2 py-2 text-center">{r.gf}</td>
                <td className="px-2 py-2 text-center">{r.gc}</td>
                <td className="px-2 py-2 text-center">{r.dg}</td>
                <td className="px-3 py-2 text-center font-bold text-primary">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}