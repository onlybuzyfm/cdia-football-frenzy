import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Trophy } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso administrador · Juego CDIA" },
      { name: "description", content: "Acceso para el administrador del torneo." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/public/bootstrap-admin")
      .then((r) => r.json())
      .then((d) => setHasAdmin(!!d.hasAdmin))
      .catch(() => setHasAdmin(true));
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasAdmin === false) {
        const res = await fetch("/api/public/bootstrap-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error");
        toast.success("Administrador creado. Iniciando sesión…");
      }
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
      <h1 className="font-display text-2xl font-bold text-primary">
        {hasAdmin === false ? "Crear administrador" : "Acceso administrador"}
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {hasAdmin === false
          ? "Define el usuario y contraseña del administrador del torneo."
          : "Sólo el administrador puede modificar la información del torneo."}
      </p>
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" className="w-full" disabled={loading || hasAdmin === null}>
          <Shield className="mr-2 h-4 w-4" />
          {loading ? "Procesando…" : hasAdmin === false ? "Crear y entrar" : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}