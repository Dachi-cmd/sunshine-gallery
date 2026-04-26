
-- Add pricing to artworks
ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS price_cents integer,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- Site settings (single-row key/value store)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults
INSERT INTO public.site_settings (key, value) VALUES
  ('contact_email', 'abramishvilidaviti@yahoo.com'),
  ('contact_phone', '597 00 93 91'),
  ('contact_phone_link', '+995597009391'),
  ('social_instagram', 'https://instagram.com/'),
  ('social_youtube', 'https://youtube.com/'),
  ('social_facebook', 'https://facebook.com/'),
  ('social_linkedin', 'https://linkedin.com/')
ON CONFLICT (key) DO NOTHING;

-- Auto-grant admin role to designated emails on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  IF NEW.email IN ('davitmoreart@gmail.com', 'killaboom0@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- If davitmoreart already exists, grant role now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'davitmoreart@gmail.com'
ON CONFLICT DO NOTHING;
