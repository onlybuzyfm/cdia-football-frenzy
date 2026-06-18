
CREATE OR REPLACE FUNCTION public.can_score()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'scorer'::public.app_role)
$$;

DROP POLICY IF EXISTS "matches scorer ins" ON public.matches;
DROP POLICY IF EXISTS "matches scorer upd" ON public.matches;
CREATE POLICY "matches scorer ins" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (public.can_score());
CREATE POLICY "matches scorer upd" ON public.matches
  FOR UPDATE TO authenticated USING (public.can_score()) WITH CHECK (public.can_score());

DROP POLICY IF EXISTS "goals scorer ins" ON public.goals;
DROP POLICY IF EXISTS "goals scorer upd" ON public.goals;
DROP POLICY IF EXISTS "goals scorer del" ON public.goals;
CREATE POLICY "goals scorer ins" ON public.goals
  FOR INSERT TO authenticated WITH CHECK (public.can_score());
CREATE POLICY "goals scorer upd" ON public.goals
  FOR UPDATE TO authenticated USING (public.can_score()) WITH CHECK (public.can_score());
CREATE POLICY "goals scorer del" ON public.goals
  FOR DELETE TO authenticated USING (public.can_score());
