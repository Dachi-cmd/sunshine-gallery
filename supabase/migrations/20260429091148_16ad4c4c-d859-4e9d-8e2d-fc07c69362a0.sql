
ALTER TABLE public.cart_items
  ALTER COLUMN artwork_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS product_id uuid;

ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_one_target;

ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_one_target
  CHECK (
    (artwork_id IS NOT NULL AND product_id IS NULL)
    OR (artwork_id IS NULL AND product_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_unique
  ON public.cart_items (user_id, product_id)
  WHERE product_id IS NOT NULL;
