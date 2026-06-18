
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin'::public.app_role) $$;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  captain TEXT,
  phone TEXT,
  email TEXT,
  shirt_color TEXT,
  logo_url TEXT,
  group_name TEXT CHECK (group_name IN ('A','B')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams public read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams admin write" ON public.teams FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "teams admin update" ON public.teams FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teams admin delete" ON public.teams FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Enforce max 8 teams
CREATE OR REPLACE FUNCTION public.enforce_max_teams()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.teams) >= 8 THEN
    RAISE EXCEPTION 'Máximo 8 equipos permitidos';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER teams_max BEFORE INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION public.enforce_max_teams();

-- Players
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  jersey_number INT,
  position TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX players_team_idx ON public.players(team_id);
GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players public read" ON public.players FOR SELECT USING (true);
CREATE POLICY "players admin ins" ON public.players FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "players admin upd" ON public.players FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "players admin del" ON public.players FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Matches
CREATE TYPE public.match_phase AS ENUM ('group','semifinal','third_place','final');
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase public.match_phase NOT NULL DEFAULT 'group',
  group_name TEXT CHECK (group_name IN ('A','B')),
  home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  home_score INT,
  away_score INT,
  match_date DATE,
  match_time TIME,
  notes TEXT,
  played BOOLEAN NOT NULL DEFAULT false,
  match_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches public read" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches admin ins" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "matches admin upd" ON public.matches FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "matches admin del" ON public.matches FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  count INT NOT NULL DEFAULT 1 CHECK (count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX goals_match_idx ON public.goals(match_id);
CREATE INDEX goals_player_idx ON public.goals(player_id);
GRANT SELECT ON public.goals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals public read" ON public.goals FOR SELECT USING (true);
CREATE POLICY "goals admin ins" ON public.goals FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "goals admin upd" ON public.goals FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "goals admin del" ON public.goals FOR DELETE TO authenticated USING (public.is_admin());

-- MVP (singleton-ish)
CREATE TABLE public.tournament_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mvp_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournament_awards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_awards TO authenticated;
GRANT ALL ON public.tournament_awards TO service_role;
ALTER TABLE public.tournament_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "awards public read" ON public.tournament_awards FOR SELECT USING (true);
CREATE POLICY "awards admin ins" ON public.tournament_awards FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "awards admin upd" ON public.tournament_awards FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.tournament_awards (mvp_player_id) VALUES (NULL);
