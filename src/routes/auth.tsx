import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Trophy } from "lucide-react";

const DOMAIN = "cdia.local";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso · Juego CDIA" },
      { name: "description", content: "Acceso para administradores y ayudantes del torneo." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Idempotent seed of admin + 5 scorers on first visit
    fetch("/api/public/seed-accounts", { method: "POST" }).catch(() => {});
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleaned = username.trim().toLowerCase();
      const email = cleaned.includes("@") ? cleaned : `${cleaned}@${DOMAIN}`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bienvenido");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] text-white shadow-[var(--shadow-elegant)]">
        <Trophy className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl font-bold text-primary">Acceso al torneo</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Ingresá con tu <strong>usuario</strong> y contraseña. Administradores cargan equipos y ayudantes registran resultados.
      </p>
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-1.5">
          <Label htmlFor="username">Usuario</Label>
          <Input id="username" autoComplete="username" required value={username}
            onChange={(e) => setUsername(e.target.value)} placeholder="usuario" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="current-password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
        </div>
        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          <Shield className="mr-2 h-4 w-4" />
          {loading ? "Procesando…" : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}