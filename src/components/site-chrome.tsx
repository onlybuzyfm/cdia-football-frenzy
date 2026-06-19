import { Link } from "@tanstack/react-router";
import { Trophy, Menu, X, LogIn, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const publicNav = [
  { to: "/", label: "Inicio" },
  { to: "/equipos", label: "Equipos" },
  { to: "/fixture", label: "Fixture" },
  { to: "/tabla", label: "Posiciones" },
  { to: "/llave", label: "Llave" },
  { to: "/goleadores", label: "Goleadores" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-secondary text-secondary-foreground backdrop-blur supports-[backdrop-filter]:bg-secondary/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-accent)] text-white shadow-[var(--shadow-elegant)]">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">CDIA · 2ª Edición</span>
          <span className="sm:hidden">CDIA</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {publicNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground/80 transition hover:bg-white/10 hover:text-white"
              activeProps={{ className: "bg-white/15 text-white" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="hidden sm:inline-flex">
                  <Button size="sm" variant="hero">
                    <Shield className="mr-1.5 h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-secondary-foreground hover:bg-white/10"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <LogIn className="mr-1.5 h-4 w-4" /> Acceso admin
              </Button>
            </Link>
          )}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-secondary md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-2 py-2">
            {publicNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground/85 hover:bg-white/10"
                activeProps={{ className: "bg-white/15 text-white" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-1 rounded-md px-3 py-2 text-sm font-semibold bg-[image:var(--gradient-accent)] text-white"
                  >
                    Panel admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    supabase.auth.signOut().then(() => {
                      window.location.href = "/";
                    });
                  }}
                  className="mt-1 rounded-md px-3 py-2 text-sm font-semibold bg-white/10 text-white hover:bg-white/20"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-md px-3 py-2 text-sm font-semibold bg-[image:var(--gradient-accent)] text-white"
              >
                Acceso admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-secondary text-secondary-foreground/85">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row">
        <p className="font-display text-base text-white">Juego CDIA · Segunda Edición</p>
        <p className="text-secondary-foreground/70">
          Desarrollado por <span className="font-semibold text-accent">PerceptIA</span>
        </p>
      </div>
    </footer>
  );
}