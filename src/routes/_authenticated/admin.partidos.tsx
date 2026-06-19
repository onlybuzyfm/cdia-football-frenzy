import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { teamsQuery, matchesQuery } from "@/lib/queries";
import { generateRoundRobin, scheduleGroupPhase, type ScheduledMatch } from "@/lib/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TeamLogo } from "@/components/team-logo";
import type { Tables } from "@/integrations/supabase/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/partidos")({
  component: AdminPartidos,
});

type Match = Tables<"matches">;

function AdminPartidos() {
  const qc = useQueryClient();
  const teams = useQuery(teamsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const groupMatches = matches.filter((m) => m.phase === "group");
  const groupA = teams.filter((t) => t.group_name === "A");
  const groupB = teams.filter((t) => t.group_name === "B");

  const refetch = () => qc.invalidateQueries({ queryKey: ["matches"] });

  const generate = async () => {
    if (groupA.length !== 4 || groupB.length !== 4) {
      return toast.error("Necesitas 4 equipos en cada grupo (A y B).");
    }
    if (groupMatches.length > 0) {
      if (!confirm("Esto eliminará el fixture actual de la fase de grupos. ¿Continuar?")) return;
      const { error: delErr } = await supabase.from("matches").delete().eq("phase", "group");
      if (delErr) return toast.error(delErr.message);
    }
    const all: ScheduledMatch[] = [];
    for (const sport of ["futbol", "basquet"] as const) {
      for (const [group, list] of [["A", groupA], ["B", groupB]] as const) {
        const fx = generateRoundRobin(list.map((t) => t.id));
        fx.forEach((f) => all.push({ sport, group, home: f.home, away: f.away }));
      }
    }
    const scheduled = scheduleGroupPhase(all);
    const rows = scheduled.map((m, i) => ({
      phase: "group" as const,
      sport: m.sport,
      group_name: m.group,
      home_team_id: m.home,
      away_team_id: m.away,
      match_order: i + 1,
    }));
    const { error } = await supabase.from("matches").insert(rows);
    if (error) return toast.error(error.message);
    toast.success("Fixture generado");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Fixture y resultados</h1>
          <p className="text-sm text-muted-foreground">Genera el fixture de grupos y registra los marcadores.</p>
        </div>
        <Button variant="hero" onClick={generate}>
          <Sparkles className="mr-2 h-4 w-4" /> Generar fixture de grupos
        </Button>
      </div>

      <Tabs defaultValue="futbol" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="futbol">Fútbol</TabsTrigger>
          <TabsTrigger value="basquet">Básquet</TabsTrigger>
        </TabsList>
        {(["futbol", "basquet"] as const).map((sport) => (
          <TabsContent key={sport} value={sport} className="space-y-6">
            {(["A", "B"] as const).map((g) => {
              const list = groupMatches.filter((m) => m.group_name === g && m.sport === sport);
              return (
                <section key={`${sport}-${g}`}>
                  <h2 className="mb-2 font-display text-lg font-semibold text-secondary">
                    Grupo {g}
                  </h2>
                  <div className="space-y-2">
                    {list.map((m) => (
                      <MatchRow key={m.id} match={m} teams={teams} onChanged={refetch} />
                    ))}
                    {list.length === 0 && (
                      <p className="text-sm text-muted-foreground">Sin partidos generados.</p>
                    )}
                  </div>
                </section>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MatchRow({ match, teams, onChanged }: { match: Match; teams: Tables<"teams">[]; onChanged: () => void }) {
  const home = teams.find((t) => t.id === match.home_team_id);
  const away = teams.find((t) => t.id === match.away_team_id);
  const [hs, setHs] = useState<string>(match.home_score?.toString() ?? "");
  const [as_, setAs] = useState<string>(match.away_score?.toString() ?? "");
  const [date, setDate] = useState(match.match_date ?? "");
  const [time, setTime] = useState(match.match_time ?? "");
  const [notes, setNotes] = useState(match.notes ?? "");
  const [open, setOpen] = useState(false);

  const save = async () => {
    const played = hs !== "" && as_ !== "";
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: hs === "" ? null : Number(hs),
        away_score: as_ === "" ? null : Number(as_),
        match_date: date || null,
        match_time: time || null,
        notes: notes || null,
        played,
      })
      .eq("id", match.id);
    if (error) return toast.error(error.message);
    toast.success("Partido actualizado");
    onChanged();
  };

  const remove = async () => {
    if (!confirm("¿Eliminar partido?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", match.id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <button className="grid w-full grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo name={home?.name} url={home?.logo_url} color={home?.shirt_color} size={28} />
          <span className="truncate">{home?.name ?? "?"}</span>
        </div>
        <span className="font-display text-lg font-bold text-primary">
          {match.played ? `${match.home_score} - ${match.away_score}` : "vs"}
        </span>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right">{away?.name ?? "?"}</span>
          <TeamLogo name={away?.name} url={away?.logo_url} color={away?.shirt_color} size={28} />
        </div>
        <span className="ml-2 text-xs text-muted-foreground">{match.match_date ?? ""}</span>
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-5">
          <div><Label>Goles local</Label><Input inputMode="numeric" value={hs} onChange={(e) => setHs(e.target.value)} /></div>
          <div><Label>Goles visita</Label><Input inputMode="numeric" value={as_} onChange={(e) => setAs(e.target.value)} /></div>
          <div><Label>Fecha</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <div className="sm:col-span-5"><Label>Observaciones</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="col-span-2 flex gap-2 sm:col-span-5">
            <Button variant="hero" size="sm" onClick={save}><Save className="mr-1.5 h-4 w-4" /> Guardar</Button>
            <Button variant="ghost" size="sm" onClick={remove}><Trash2 className="mr-1.5 h-4 w-4 text-destructive" /> Eliminar</Button>
          </div>
        </div>
      )}
    </div>
  );
}