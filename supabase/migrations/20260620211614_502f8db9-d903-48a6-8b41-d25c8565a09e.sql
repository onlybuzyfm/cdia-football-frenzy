
-- Remove all scorer (ayudante) accounts and the scorer role concept
DELETE FROM public.user_roles WHERE role = 'scorer';

-- Drop scorer-only RLS policies
DROP POLICY IF EXISTS "matches scorer ins" ON public.matches;
DROP POLICY IF EXISTS "matches scorer upd" ON public.matches;
DROP POLICY IF EXISTS "matches scorer del" ON public.matches;
DROP POLICY IF EXISTS "goals scorer ins"   ON public.goals;
DROP POLICY IF EXISTS "goals scorer upd"   ON public.goals;
DROP POLICY IF EXISTS "goals scorer del"   ON public.goals;

DROP FUNCTION IF EXISTS public.can_score();

-- Recreate app_role enum without 'scorer' (must rebuild has_role too)
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin');

ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING role::text::public.app_role;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role_old);
DROP TYPE public.app_role_old;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DELETE FROM auth.users WHERE email LIKE 'ayudante%@cdia.local';
