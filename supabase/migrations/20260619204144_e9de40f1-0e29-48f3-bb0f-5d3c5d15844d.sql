
DELETE FROM public.goals;
DELETE FROM public.matches;
UPDATE public.tournament_awards SET mvp_futbol_player_id = NULL, mvp_basquet_player_id = NULL, mvp_player_id = NULL;

ALTER TABLE public.matches ALTER COLUMN sport DROP DEFAULT;
ALTER TABLE public.matches DROP COLUMN sport;
ALTER TABLE public.tournament_awards DROP COLUMN mvp_basquet_player_id;
DROP TYPE IF EXISTS public.sport_kind;
