ALTER TABLE public.tournament_awards ADD COLUMN mvp_futbol_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_awards ADD COLUMN mvp_basquet_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL;

GRANT SELECT, UPDATE ON public.tournament_awards TO authenticated;
GRANT ALL ON public.tournament_awards TO service_role;