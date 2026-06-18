-- Equipos compartidos entre deportes: el campo sport queda solo en partidos
DROP TRIGGER IF EXISTS prevent_cross_sport_player_trg ON public.players;
DROP FUNCTION IF EXISTS public.prevent_cross_sport_player();

CREATE OR REPLACE FUNCTION public.enforce_max_teams()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT count(*) FROM public.teams) >= 8 THEN
    RAISE EXCEPTION 'Máximo 8 equipos permitidos en el torneo';
  END IF;
  RETURN NEW;
END; $$;

ALTER TABLE public.teams DROP COLUMN IF EXISTS sport;