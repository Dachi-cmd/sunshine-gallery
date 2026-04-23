
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Drop broad listing policy; public bucket still allows direct file URLs.
DROP POLICY IF EXISTS "Public read artworks bucket" ON storage.objects;
