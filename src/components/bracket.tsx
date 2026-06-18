import type { Match, Team } from "@/lib/tournament";
import { TeamLogo } from "@/components/team-logo";
import { Trophy } from "lucide-react";

function MatchCard({
  label,
  home,
  away,
  hs,
  as,
  played,
}: {
  label: string;
  home?: Team | null;
  away?: Team | null;
  hs?: number | null;
  as?: number | null;
  played?: boolean;
}) {
  const winner = played && hs != null && as != null ? (hs > as ? "home" : as > hs ? "away" : null) : null;
  const Row = ({ t, score, side }: { t?: Team | null; score?: number | null; side: "home" | "away" }) => (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 ${
        winner === side ? "bg-accent/15 font-semibold" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <TeamLogo name={t?.name} url={t?.logo_url} color={t?.shirt_color} size={22} />
        <span className="truncate text-sm">{t?.name ?? "Por definir"}</span>
      </div>
      <span className="font-display text-base tabular-nums">{score ?? "-"}</span>
    </div>
  );
  return (
    <div className="w-64 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground/85">
        {label}
      </div>
      <Row t={home} score={hs} side="home" />
      <div className="border-t border-dashed border-border" />
      <Row t={away} score={as} side="away" />
    </div>
  );
}

export function Bracket({
  teams,
  matches,
}: {
  teams: Team[];
  matches: Match[];
}) {
  const byId = new Map(teams.map((t) => [t.id, t]));
  const semi1 = matches.find((m) => m.phase === "semifinal" && m.match_order === 1);
  const semi2 = matches.find((m) => m.phase === "semifinal" && m.match_order === 2);
  const third = matches.find((m) => m.phase === "third_place");
  const final = matches.find((m) => m.phase === "final");

  const winnerOf = (m?: Match) => {
    if (!m?.played || m.home_score == null || m.away_score == null) return null;
    if (m.home_score > m.away_score) return byId.get(m.home_team_id ?? "") ?? null;
    if (m.away_score > m.home_score) return byId.get(m.away_team_id ?? "") ?? null;
    return null;
  };
  const champion = winnerOf(final);

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[760px] items-center justify-center gap-8 p-6">
        <div className="flex flex-col gap-8">
          <MatchCard
            label="Semifinal 1"
            home={byId.get(semi1?.home_team_id ?? "") ?? null}
            away={byId.get(semi1?.away_team_id ?? "") ?? null}
            hs={semi1?.home_score}
            as={semi1?.away_score}
            played={semi1?.played}
          />
          <MatchCard
            label="Semifinal 2"
            home={byId.get(semi2?.home_team_id ?? "") ?? null}
            away={byId.get(semi2?.away_team_id ?? "") ?? null}
            hs={semi2?.home_score}
            as={semi2?.away_score}
            played={semi2?.played}
          />
        </div>
        <div className="flex flex-col gap-8">
          <MatchCard
            label="Final"
            home={byId.get(final?.home_team_id ?? "") ?? null}
            away={byId.get(final?.away_team_id ?? "") ?? null}
            hs={final?.home_score}
            as={final?.away_score}
            played={final?.played}
          />
          <MatchCard
            label="3er lugar"
            home={byId.get(third?.home_team_id ?? "") ?? null}
            away={byId.get(third?.away_team_id ?? "") ?? null}
            hs={third?.home_score}
            as={third?.away_score}
            played={third?.played}
          />
        </div>
        <div className="flex w-56 flex-col items-center justify-center rounded-xl border border-accent/40 bg-[image:var(--gradient-accent)] p-6 text-center text-white shadow-[var(--shadow-elegant)]">
          <Trophy className="mb-2 h-10 w-10" />
          <p className="text-xs uppercase tracking-widest opacity-90">Campeón</p>
          <p className="mt-2 font-display text-xl font-bold">
            {champion?.name ?? "Por definir"}
          </p>
        </div>
      </div>
    </div>
  );
}