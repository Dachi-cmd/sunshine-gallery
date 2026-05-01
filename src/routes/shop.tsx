import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, pickLocalized } from "@/lib/i18n";
import { resolveImage } from "@/lib/assetMap";
import { formatPrice } from "@/lib/siteSettings";
import { useCart } from "@/lib/cart";
import { ShoppingBag, X, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "t-shirts", label: "T-Shirts" },
  { value: "hoodies", label: "Hoodies" },
  { value: "bags", label: "Bags" },
  { value: "posters", label: "Posters" },
  { value: "postcards", label: "Postcards" },
  { value: "other", label: "Other" },
] as const;

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Davit Abramishvili" },
      { name: "description", content: "Limited edition prints and books from the studio." },
      { property: "og:title", content: "Shop — Davit Abramishvili" },
      { property: "og:description", content: "Limited edition prints and books." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { lang, t } = useI18n();
  const { addProductToCart } = useCart();
  const [category, setCategory] = useState<string>("all");
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (data ?? []).filter((p) => category === "all" || (p.category ?? "other") === category);

  const openProduct = useMemo(
    () => (openProductId ? filtered.find((p) => p.id === openProductId) ?? null : null),
    [filtered, openProductId],
  );

  const slides: string[] = useMemo(() => {
    if (!openProduct) return [];
    const extra = (openProduct.images ?? []) as string[];
    return [openProduct.image_url, ...extra].filter(Boolean);
  }, [openProduct]);

  useEffect(() => {
    setSlideIdx(0);
  }, [openProductId]);

  useEffect(() => {
    if (!openProduct) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenProductId(null);
      if (slides.length > 1) {
        if (e.key === "ArrowRight") setSlideIdx((i) => (i + 1) % slides.length);
        if (e.key === "ArrowLeft") setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openProduct, slides.length]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <header className="mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio</p>
        <h1 className="serif mt-2 text-4xl md:text-5xl">Shop</h1>
      </header>

      <div className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`text-xs uppercase tracking-[0.25em] transition ${
              category === c.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">…</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-muted-foreground">{t("shop.empty")}</p>
      )}

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {filtered.map((p) => {
          const extraCount = ((p.images ?? []) as string[]).length;
          return (
            <article key={p.id} className="group">
              <button
                type="button"
                onClick={() => setOpenProductId(p.id)}
                className="relative block aspect-square w-full overflow-hidden bg-muted"
                aria-label={pickLocalized(p, "name", lang)}
              >
                <img
                  src={resolveImage(p.image_url)}
                  alt={pickLocalized(p, "name", lang)}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                />
                {extraCount > 0 && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                    +{extraCount}
                  </span>
                )}
              </button>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="serif text-2xl">{pickLocalized(p, "name", lang)}</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {pickLocalized(p, "description", lang)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="serif text-xl">{formatPrice(p.price_cents, p.currency, lang)}</p>
                  {p.in_stock ? (
                    <button
                      type="button"
                      onClick={() => void addProductToCart(p.id)}
                      className="mt-2 inline-flex items-center gap-1.5 border-b border-foreground pb-0.5 text-[11px] uppercase tracking-[0.25em] hover:text-accent hover:border-accent"
                    >
                      <ShoppingBag size={12} /> {t("shop.addToCart") || "Add to cart"}
                    </button>
                  ) : (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                      {t("shop.outOfStock")}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Product lightbox with per-product image carousel */}
      {openProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setOpenProductId(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenProductId(null); }}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div
            className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-sm bg-black shadow-2xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-1 items-center justify-center bg-black p-4 md:p-6 min-h-0">
              <img
                src={resolveImage(slides[slideIdx])}
                alt={pickLocalized(openProduct, "name", lang)}
                className="max-h-full max-w-full object-contain"
              />
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSlideIdx((i) => (i - 1 + slides.length) % slides.length)}
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideIdx((i) => (i + 1) % slides.length)}
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                    {slideIdx + 1} / {slides.length}
                  </div>
                </>
              )}
            </div>

            <aside className="flex w-full shrink-0 flex-col bg-black text-white md:w-[340px] md:border-l md:border-white/10">
              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-7 md:py-8">
                <h2 className="serif mt-1 text-2xl leading-tight md:text-3xl">
                  {pickLocalized(openProduct, "name", lang)}
                </h2>
                {formatPrice(openProduct.price_cents, openProduct.currency, lang) && (
                  <p className="serif mt-4 text-xl text-white">
                    {formatPrice(openProduct.price_cents, openProduct.currency, lang)}
                  </p>
                )}
                {pickLocalized(openProduct, "description", lang) && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                      {lang === "en" ? "Description" : "აღწერა"}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                      {pickLocalized(openProduct, "description", lang)}
                    </p>
                  </div>
                )}

                {slides.length > 1 && (
                  <div className="mt-6 grid grid-cols-4 gap-2">
                    {slides.map((url, i) => (
                      <button
                        key={url + i}
                        type="button"
                        onClick={() => setSlideIdx(i)}
                        className={`aspect-square overflow-hidden border ${
                          slideIdx === i ? "border-white" : "border-white/20 opacity-60 hover:opacity-100"
                        }`}
                        aria-label={`Image ${i + 1}`}
                      >
                        <img src={resolveImage(url)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 bg-black px-5 py-4 md:px-7 md:py-5">
                {openProduct.in_stock ? (
                  <button
                    type="button"
                    onClick={() => void addProductToCart(openProduct.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 bg-white px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
                  >
                    <ShoppingBag size={12} /> {t("shop.addToCart") || "Add to cart"}
                  </button>
                ) : (
                  <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/50">
                    {t("shop.outOfStock")}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}
