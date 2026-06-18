import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { teamsQuery, playersQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TeamLogo } from "@/components/team-logo";
import { Plus, Pencil, Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/equipos")({
  component: AdminEquipos,
});

type Team = Tables<"teams">;
type Player = Tables<"players">;

function AdminEquipos() {
  const qc = useQueryClient();
  const teams = useQuery(teamsQuery).data ?? [];
  const players = useQuery(playersQuery).data ?? [];
  const [editing, setEditing] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null);

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ["teams"] });
    qc.invalidateQueries({ queryKey: ["players"] });
  };

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Equipo eliminado"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const limitReached = teams.length >= 8;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Equipos y jugadores</h1>
          <p className="text-sm text-muted-foreground">
            {teams.length} de 8 equipos registrados. Los mismos equipos juegan fútbol y básquet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="hero" disabled={limitReached} onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo equipo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((t) => {
          const roster = players.filter((p) => p.team_id === t.id);
          return (
            <div key={t.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3 border-b border-border bg-secondary p-3 text-secondary-foreground">
                <TeamLogo name={t.name} url={t.logo_url} color={t.shirt_color} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold leading-tight">{t.name}</p>
                  <p className="text-xs opacity-80">
                    ⚽ 🏀 · Grupo {t.group_name ?? "-"} · {roster.length} jugadores
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setEditing(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-destructive/30"
                  onClick={() => { if (confirm(`¿Eliminar equipo "${t.name}"?`)) del.mutate(t.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3 text-sm">
                {t.captain && <p><span className="text-muted-foreground">Capitán:</span> {t.captain}</p>}
                {t.phone && <p><span className="text-muted-foreground">Tel:</span> {t.phone}</p>}
                {t.email && <p className="truncate"><span className="text-muted-foreground">Email:</span> {t.email}</p>}
              </div>
              <div className="border-t border-border bg-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plantel</p>
                  <Button size="sm" variant="outline" onClick={() => setPlayerTeam(t)}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Gestionar
                  </Button>
                </div>
                {roster.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin jugadores aún.</p>
                ) : (
                  <ul className="space-y-0.5 text-sm">
                    {roster.slice(0, 6).map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>#{p.jersey_number ?? "·"} {p.full_name}</span>
                        <span className="text-xs text-muted-foreground">{p.position}</span>
                      </li>
                    ))}
                    {roster.length > 6 && <li className="text-xs text-muted-foreground">… y {roster.length - 6} más</li>}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TeamDialog
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        onDone={() => { setCreating(false); refetch(); }}
      />
      <TeamDialog
        open={!!editing}
        team={editing ?? undefined}
        onOpenChange={(o) => !o && setEditing(null)}
        onDone={() => { setEditing(null); refetch(); }}
      />
      <PlayersDialog
        team={playerTeam}
        players={players.filter((p) => p.team_id === playerTeam?.id)}
        onClose={() => setPlayerTeam(null)}
        onChanged={refetch}
      />
    </div>
  );
}

function TeamDialog({
  open, onOpenChange, team, onDone,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; team?: Team; onDone: () => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [captain, setCaptain] = useState(team?.captain ?? "");
  const [phone, setPhone] = useState(team?.phone ?? "");
  const [email, setEmail] = useState(team?.email ?? "");
  const [color, setColor] = useState(team?.shirt_color ?? "#1e3a8a");
  const [group, setGroup] = useState<string>(team?.group_name ?? "A");
  const [logoUrl, setLogoUrl] = useState<string | null>(team?.logo_url ?? null);
  const [uploading, setUploading] = useState(false);

  // reset when team changes
  useState(() => {
    if (team) {
      setName(team.name); setCaptain(team.captain ?? ""); setPhone(team.phone ?? "");
      setEmail(team.email ?? ""); setColor(team.shirt_color ?? "#1e3a8a");
      setGroup(team.group_name ?? "A"); setLogoUrl(team.logo_url);
    }
  });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("team-assets").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("team-assets").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast.success("Logo subido");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, captain, phone, email, shirt_color: color, group_name: group, logo_url: logoUrl };
    const { error } = team
      ? await supabase.from("teams").update(payload).eq("id", team.id)
      : await supabase.from("teams").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(team ? "Equipo actualizado" : "Equipo creado");
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{team ? "Editar equipo" : "Nuevo equipo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center gap-3">
            <TeamLogo name={name} url={logoUrl} color={color} size={56} />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo…" : "Subir escudo"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Capitán</Label>
              <Input value={captain} onChange={(e) => setCaptain(e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Color camiseta</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
            </div>
            <div>
              <Label>Grupo</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grupo A</SelectItem>
                  <SelectItem value="B">Grupo B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="hero">{team ? "Guardar cambios" : "Crear equipo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlayersDialog({
  team, players, onClose, onChanged,
}: {
  team: Team | null; players: Player[]; onClose: () => void; onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [pos, setPos] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    const { error } = await supabase.from("players").insert({
      team_id: team.id, full_name: name, jersey_number: num ? Number(num) : null, position: pos || null,
    });
    if (error) return toast.error(error.message);
    setName(""); setNum(""); setPos("");
    onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Dialog open={!!team} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Plantel · {team?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={add} className="grid grid-cols-[1fr_80px_140px_auto] gap-2">
          <Input placeholder="Nombre completo" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="N°" inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value)} />
          <Input placeholder="Posición" value={pos} onChange={(e) => setPos(e.target.value)} />
          <Button type="submit" variant="hero" size="sm"><Plus className="h-4 w-4" /></Button>
        </form>
        <div className="max-h-80 overflow-y-auto rounded-md border border-border">
          {players.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Sin jugadores aún.</p>
          ) : (
            <ul className="divide-y divide-border">
              {players.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    <span className="mr-2 inline-block w-6 text-center font-bold text-accent">{p.jersey_number ?? "·"}</span>
                    {p.full_name}
                    {p.position && <span className="ml-2 text-xs text-muted-foreground">{p.position}</span>}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}