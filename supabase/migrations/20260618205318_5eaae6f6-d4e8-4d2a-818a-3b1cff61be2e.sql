
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scorer';

DO $$ BEGIN
  CREATE TYPE public.sport_kind AS ENUM ('futbol', 'basquet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS sport public.sport_kind NOT NULL DEFAULT 'futbol';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS sport public.sport_kind NOT NULL DEFAULT 'futbol';

CREATE OR REPLACE FUNCTION public.enforce_max_teams()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF (SELECT count(*) FROM public.teams WHERE sport = NEW.sport) >= 8 THEN
    RAISE EXCEPTION 'Máximo 8 equipos permitidos para %', NEW.sport;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_max_teams_trg ON public.teams;
CREATE TRIGGER enforce_max_teams_trg BEFORE INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.enforce_max_teams();

CREATE OR REPLACE FUNCTION public.prevent_cross_sport_player()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_sport public.sport_kind; conflict_count int;
BEGIN
  SELECT sport INTO new_sport FROM public.teams WHERE id = NEW.team_id;
  IF new_sport IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO conflict_count FROM public.players p
    JOIN public.teams t ON t.id = p.team_id
   WHERE lower(btrim(p.full_name)) = lower(btrim(NEW.full_name))
     AND t.sport <> new_sport
     AND p.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'El jugador "%" ya está inscripto en un equipo del otro deporte', NEW.full_name;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS prevent_cross_sport_player_trg ON public.players;
CREATE TRIGGER prevent_cross_sport_player_trg BEFORE INSERT OR UPDATE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.prevent_cross_sport_player();
