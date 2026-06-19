REVOKE SELECT (email, phone) ON public.teams FROM anon;
REVOKE SELECT (email, phone) ON public.teams FROM PUBLIC;

DROP POLICY IF EXISTS "team assets public read" ON storage.objects;