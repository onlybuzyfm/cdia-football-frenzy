import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { teamsQuery, matchesQuery, playersQuery, awardsQuery, goalsQuery } from "@/lib/queries";
import { getQualifiers } from "@/lib/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Save, Star, Goal, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { TeamLogo } from "@/components/team-logo";
import { Bracket } from "@/components/bracket";

export const Route = createFileRoute("/_authenticated/admin/llave")({
  component: AdminLlave,
});

type Match = Tables<"matches">;

function AdminLlave() {
  const qc = useQueryClient();
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const players = useQuery(playersQuery).data ?? [];
  const goals = useQuery(goalsQuery).data ?? [];
  const awards = useQuery(awardsQuery).data;

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["awards"] });
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const semi1 = matches.find((m) => m.phase === "semifinal" && m.match_order === 1);
  const semi2 = matches.find((m) => m.phase === "semifinal" && m.match_order === 2);
  const final = matches.find((m) => m.phase === "final");
  const hasKnockout = !!(semi1 || semi2 || final);

  const groupMatches = matches.filter((m) => m.phase === "group");
  const allGroupPlayed = groupMatches.length === 12 && groupMatches.every((m) => m.played);

  const generateKnockout = async (confirmReplace = true) => {
    const q = getQualifiers(teams, matches);
    if (!q.A1 || !q.A2 || !q.B1 || !q.B2) {
      return toast.error("Termina la fase de grupos para conocer a los clasificados.");
    }
    if (hasKnockout) {
      if (confirmReplace && !confirm("Esto reemplaza semifinales, 3er lugar y final. ¿Continuar?")) return;
      const { error } = await supabase.from("matches").delete().in("phase", ["semifinal", "third_place", "final"]);
      if (error) return toast.error(error.message);
    }
    const rows = [
      { phase: "semifinal" as const, match_order: 1, home_team_id: q.A1.id, away_team_id: q.B2.id },
      { phase: "semifinal" as const, match_order: 2, home_team_id: q.B1.id, away_team_id: q.A2.id },
      { phase: "final" as const, match_order: 1, home_team_id: null, away_team_id: null },
    ];
    const { error } = await supabase.from("matches").insert(rows);
    if (error) return toast.error(error.message);
    toast.success("Llave generada");
    refetch();
  };

  const setFinalists = async (silent = false) => {
    const winner = (m?: Match) => (m?.played && m.home_score! > m.away_score! ? m.home_team_id : m?.played ? m.away_team_id : null);
    const w1 = winner(semi1), w2 = winner(semi2);
    if (!w1 || !w2) {
      if (!silent) toast.error("Carga primero los resultados de ambas semifinales.");
      return;
    }
    if (final && (final.home_team_id !== w1 || final.away_team_id !== w2)) {
      await supabase.from("matches").update({ home_team_id: w1, away_team_id: w2 }).eq("id", final.id);
    }
    if (!silent) toast.success("Final actualizada");
    refetch();
  };

  // Auto-generate knockout when group phase completes
  const autoGenRef = useRef(false);
  useEffect(() => {
    if (allGroupPlayed && !hasKnockout && !autoGenRef.current) {
      autoGenRef.current = true;
      generateKnockout(false);
    }
  }, [allGroupPlayed, hasKnockout]);

  // Auto-fill final / third place when both semis are played
  const autoFinalRef = useRef(false);
  const bothSemisPlayed = !!(semi1?.played && semi2?.played);
  useEffect(() => {
    if (!bothSemisPlayed) { autoFinalRef.current = false; return; }
    if (autoFinalRef.current) return;
    autoFinalRef.current = true;
    setFinalists(true);
  }, [bothSemisPlayed, semi1?.home_score, semi1?.away_score, semi2?.home_score, semi2?.away_score]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Llave final y MVP</h1>
          <p className="text-sm text-muted-foreground">
            La llave se genera automáticamente al terminar la fase de grupos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFinalists(false)} disabled={!hasKnockout}>
            Asignar finalistas
          </Button>
          <Button variant="hero" onClick={() => generateKnockout(true)}>
            <Sparkles className="mr-2 h-4 w-4" /> Generar llave
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <Bracket teams={teams} matches={matches} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {[semi1, semi2, final].filter(Boolean).map((m) => (
          <KnockoutEditor key={m!.id} match={m!} teams={teams} onChanged={refetch} />
        ))}
      </div>

      <GoalsManager matches={matches} teams={teams} players={players} goals={goals} onChanged={refetch} />

      <MvpPicker awards={awards} players={players} teams={teams} onChanged={refetch} mvpKey="mvp_futbol_player_id" label="MVP del torneo" />
    </div>
  );
}

function KnockoutEditor({ match, teams, onChanged }: { match: Match; teams: Tables<"teams">[]; onChanged: () => void }) {
  const home = teams.find((t) => t.id === match.home_team_id);
  const away = teams.find((t) => t.id === match.away_team_id);
  const [hs, setHs] = useState<string>(match.home_score?.toString() ?? "");
  const [as_, setAs] = useState<string>(match.away_score?.toString() ?? "");
  const [date, setDate] = useState(match.match_date ?? "");
  const [time, setTime] = useState(match.match_time ?? "");
  const label = match.phase === "semifinal" ? `Semifinal ${match.match_order}` : match.phase === "third_place" ? "Tercer lugar" : "Final";

  const save = async () => {
    const played = hs !== "" && as_ !== "";
    const { error } = await supabase.from("matches").update({
      home_score: hs === "" ? null : Number(hs),
      away_score: as_ === "" ? null : Number(as_),
      match_date: date || null, match_time: time || null, played,
    }).eq("id", match.id);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    onChanged();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{label}</p>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><TeamLogo name={home?.name} url={home?.logo_url} color={home?.shirt_color} size={26} /><span>{home?.name ?? "Por definir"}</span></div>
        <span className="text-muted-foreground">vs</span>
        <div className="flex items-center gap-2"><span>{away?.name ?? "Por definir"}</span><TeamLogo name={away?.name} url={away?.logo_url} color={away?.shirt_color} size={26} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div><Label>Local</Label><Input inputMode="numeric" value={hs} onChange={(e) => setHs(e.target.value)} /></div>
        <div><Label>Visita</Label><Input inputMode="numeric" value={as_} onChange={(e) => setAs(e.target.value)} /></div>
        <div><Label>Fecha</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      </div>
      <div className="mt-3"><Button variant="hero" size="sm" onClick={save}><Save className="mr-1.5 h-4 w-4" /> Guardar</Button></div>
    </div>
  );
}

function GoalsManager({
  matches, teams, players, goals, onChanged,
}: {
  matches: Tables<"matches">[]; teams: Tables<"teams">[]; players: Tables<"players">[]; goals: Tables<"goals">[]; onChanged: () => void;
}) {
  const [matchId, setMatchId] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [count, setCount] = useState("1");
  const m = matches.find((x) => x.id === matchId);
  const eligible = players.filter((p) => p.team_id === m?.home_team_id || p.team_id === m?.away_team_id);

  const add = async () => {
    const p = players.find((x) => x.id === playerId);
    if (!matchId || !p) return toast.error("Selecciona partido y jugador");
    const { error } = await supabase.from("goals").insert({
      match_id: matchId, player_id: p.id, team_id: p.team_id, count: Number(count) || 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Gol registrado"); setPlayerId(""); setCount("1"); onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  const labelMatch = (m: Tables<"matches">) => {
    const h = teams.find((t) => t.id === m.home_team_id)?.name ?? "?";
    const a = teams.find((t) => t.id === m.away_team_id)?.name ?? "?";
    return `${h} vs ${a} (${m.phase})`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Goal className="h-5 w-5 text-accent" />
        <h2 className="font-display text-lg font-semibold text-primary">Goleadores</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_auto]">
        <Select value={matchId} onValueChange={(v) => { setMatchId(v); setPlayerId(""); }}>
          <SelectTrigger><SelectValue placeholder="Partido" /></SelectTrigger>
          <SelectContent>{matches.map((m) => <SelectItem key={m.id} value={m.id}>{labelMatch(m)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={playerId} onValueChange={setPlayerId} disabled={!matchId}>
          <SelectTrigger><SelectValue placeholder="Jugador" /></SelectTrigger>
          <SelectContent>
            {eligible.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} ({teams.find(t => t.id === p.team_id)?.name})</SelectItem>)}
          </SelectContent>
        </Select>
        <Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
        <Button variant="hero" onClick={add}>Agregar</Button>
      </div>
      {goals.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-md border border-border">
          {goals.map((g) => {
            const p = players.find((x) => x.id === g.player_id);
            const t = teams.find((x) => x.id === g.team_id);
            return (
              <li key={g.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{p?.full_name ?? "?"} <span className="text-muted-foreground">— {t?.name}</span> · {g.count} gol(es)</span>
                <Button size="sm" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MvpPicker({
  awards, players, teams, onChanged, mvpKey, label,
}: { awards: any; players: Tables<"players">[]; teams: Tables<"teams">[]; onChanged: () => void; mvpKey: string; label: string }) {
  const [pid, setPid] = useState<string>((awards as any)?.[mvpKey] ?? "");

  const save = async () => {
    if (!awards) return;
    const updateData: any = { [mvpKey]: pid || null };
    const { error } = await supabase.from("tournament_awards").update(updateData).eq("id", awards.id);
    if (error) return toast.error(error.message);
    toast.success("MVP actualizado");
    onChanged();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-5 w-5 text-accent" />
        <h2 className="font-display text-lg font-semibold text-primary">{label}</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger><SelectValue placeholder="Selecciona jugador" /></SelectTrigger>
          <SelectContent>
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name} — {teams.find((t) => t.id === p.team_id)?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="hero" onClick={save}>Guardar MVP</Button>
      </div>
    </div>
  );
}
