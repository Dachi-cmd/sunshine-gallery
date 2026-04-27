ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);