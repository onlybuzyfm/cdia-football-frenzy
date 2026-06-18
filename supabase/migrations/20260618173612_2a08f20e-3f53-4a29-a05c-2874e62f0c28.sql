
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_max_teams() FROM public, anon, authenticated;

-- Storage policies for team-assets bucket
CREATE POLICY "team assets public read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'team-assets');

CREATE POLICY "team assets admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'team-assets' AND public.is_admin());

CREATE POLICY "team assets admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'team-assets' AND public.is_admin());

CREATE POLICY "team assets admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'team-assets' AND public.is_admin());
