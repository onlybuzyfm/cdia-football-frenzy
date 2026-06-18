import type { Tables } from "@/integrations/supabase/types";

export type Team = Tables<"teams">;
export type Match = Tables<"matches">;

export interface StandingRow {
  team: Team;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export function computeStandings(
  teams: Team[],
  matches: Match[],
  group: "A" | "B"
): StandingRow[] {
  const groupTeams = teams.filter((t) => t.group_name === group);
  const rows = new Map<string, StandingRow>();
  for (const t of groupTeams) {
    rows.set(t.id, { team: t, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
  }
  const groupMatches = matches.filter(
    (m) => m.phase === "group" && m.group_name === group && m.played && m.home_team_id && m.away_team_id
  );
  for (const m of groupMatches) {
    const h = rows.get(m.home_team_id!);
    const a = rows.get(m.away_team_id!);
    if (!h || !a) continue;
    const hs = m.home_score ?? 0;
    const as = m.away_score ?? 0;
    h.pj++; a.pj++;
    h.gf += hs; h.gc += as;
    a.gf += as; a.gc += hs;
    if (hs > as) { h.pg++; a.pp++; h.pts += 3; }
    else if (hs < as) { a.pg++; h.pp++; a.pts += 3; }
    else { h.pe++; a.pe++; h.pts += 1; a.pts += 1; }
  }
  for (const r of rows.values()) r.dg = r.gf - r.gc;

  return Array.from(rows.values()).sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.dg !== x.dg) return y.dg - x.dg;
    if (y.gf !== x.gf) return y.gf - x.gf;
    // head to head
    const h2h = groupMatches.find(
      (m) =>
        (m.home_team_id === x.team.id && m.away_team_id === y.team.id) ||
        (m.home_team_id === y.team.id && m.away_team_id === x.team.id)
    );
    if (h2h) {
      const xs = h2h.home_team_id === x.team.id ? h2h.home_score! : h2h.away_score!;
      const ys = h2h.home_team_id === y.team.id ? h2h.home_score! : h2h.away_score!;
      return ys - xs;
    }
    return x.team.name.localeCompare(y.team.name);
  });
}

/** Round-robin fixture for 4 teams (3 fechas). */
export function generateRoundRobin(teamIds: string[]): Array<{ home: string; away: string; round: number }> {
  if (teamIds.length !== 4) return [];
  const [a, b, c, d] = teamIds;
  return [
    { home: a, away: b, round: 1 },
    { home: c, away: d, round: 1 },
    { home: a, away: c, round: 2 },
    { home: b, away: d, round: 2 },
    { home: a, away: d, round: 3 },
    { home: b, away: c, round: 3 },
  ];
}

export function getQualifiers(teams: Team[], matches: Match[]) {
  const a = computeStandings(teams, matches, "A");
  const b = computeStandings(teams, matches, "B");
  return {
    A1: a[0]?.team ?? null,
    A2: a[1]?.team ?? null,
    B1: b[0]?.team ?? null,
    B2: b[1]?.team ?? null,
    groupA: a,
    groupB: b,
  };
}