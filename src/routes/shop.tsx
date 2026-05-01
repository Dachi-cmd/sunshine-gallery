import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  const [lightbox, setLightbox] = useState<number | null>(null);

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

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, filtered.length]);

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
        {filtered.map((p, i) => (
          <article key={p.id} className="group">
            <button
              type="button"
              onClick={() => setLightbox(i)}
              className="block aspect-square w-full overflow-hidden bg-muted"
              aria-label={pickLocalized(p, "name", lang)}
            >
              <img
                src={resolveImage(p.image_url)}
                alt={pickLocalized(p, "name", lang)}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
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
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (() => {
        const p = filtered[lightbox];
        const desc = pickLocalized(p, "description", lang) as string | null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
              }}
              className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
              }}
              className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>

            <div
              className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-sm bg-black shadow-2xl md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-1 items-center justify-center bg-black p-4 md:p-6 min-h-0">
                <img
                  src={resolveImage(p.image_url)}
                  alt={pickLocalized(p, "name", lang)}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <aside className="flex w-full shrink-0 flex-col bg-black text-white md:w-[340px] md:border-l md:border-white/10">
                <div className="flex-1 overflow-y-auto px-6 py-6 md:px-7 md:py-8">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    {lightbox + 1} / {filtered.length}
                  </p>
                  <h2 className="serif mt-3 text-2xl leading-tight md:text-3xl">
                    {pickLocalized(p, "name", lang)}
                  </h2>
                  {formatPrice(p.price_cents, p.currency, lang) && (
                    <p className="serif mt-4 text-xl text-white">
                      {formatPrice(p.price_cents, p.currency, lang)}
                    </p>
                  )}
                  {desc && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                        {lang === "en" ? "Description" : "აღწერა"}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">{desc}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-white/10 bg-black px-5 py-4 md:px-7 md:py-5">
                  {p.in_stock ? (
                    <button
                      type="button"
                      onClick={() => void addProductToCart(p.id)}
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
        );
      })()}
    </section>
  );
}
