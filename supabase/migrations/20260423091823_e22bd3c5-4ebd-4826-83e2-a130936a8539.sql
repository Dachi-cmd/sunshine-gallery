
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Artworks (gallery)
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ka TEXT,
  description TEXT,
  description_ka TEXT,
  image_url TEXT NOT NULL,
  year INT,
  medium TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views published artworks" ON public.artworks
  FOR SELECT TO anon, authenticated USING (published = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage artworks" ON public.artworks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Products (shop)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ka TEXT,
  description TEXT,
  description_ka TEXT,
  image_url TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views published products" ON public.products
  FOR SELECT TO anon, authenticated USING (published = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER artworks_updated BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for uploaded images (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', TRUE);

CREATE POLICY "Public read artworks bucket" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'artworks');

CREATE POLICY "Admins upload artworks" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update artworks" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete artworks" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));
